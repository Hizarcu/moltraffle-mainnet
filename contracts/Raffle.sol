// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title Raffle
 * @notice Individual raffle contract with Chainlink VRF for provably fair winner selection
 * @dev Inherits from VRFConsumerBaseV2 for randomness
 */
contract Raffle is VRFConsumerBaseV2Plus {
    // Raffle status enum
    enum RaffleStatus {
        UPCOMING,
        ACTIVE,
        ENDED,
        DRAWN,
        CANCELLED
    }

    // Raffle details
    string public title;
    string public description;
    string public prizeDescription;
    uint256 public entryFee;
    uint256 public deadline;
    uint256 public maxParticipants;
    address public creator;
    RaffleStatus public status;

    // Participants
    address[] public participants;
    mapping(address => bool) public hasJoined;

    // Winner selection
    address public winner;
    uint256 public winnerIndex;
    uint256 public randomResult;
    uint256 public vrfRequestId;

    // Chainlink VRF Configuration
    IVRFCoordinatorV2Plus private immutable vrfCoordinator;
    bytes32 private immutable keyHash;
    uint256 private immutable subscriptionId;
    uint32 private constant CALLBACK_GAS_LIMIT = 100000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Events
    event ParticipantJoined(address indexed participant, uint256 participantCount);
    event WinnerDrawn(address indexed winner, uint256 winnerIndex, uint256 randomNumber, uint256 vrfRequestId);
    event PrizeClaimed(address indexed winner, uint256 amount);
    event RaffleCancelled();

    // Errors
    error NotCreator();
    error RaffleNotActive();
    error RaffleEnded();
    error AlreadyJoined();
    error InsufficientEntryFee();
    error RaffleFull();
    error DeadlineNotReached();
    error NoParticipants();
    error WinnerAlreadyDrawn();
    error NotWinner();
    error PrizeAlreadyClaimed();

    /**
     * @notice Create a new raffle
     * @param _title Raffle title
     * @param _description Raffle description
     * @param _prizeDescription Prize description
     * @param _entryFee Entry fee in wei
     * @param _deadline Deadline timestamp
     * @param _maxParticipants Maximum participants (0 = unlimited)
     * @param _vrfCoordinator Chainlink VRF Coordinator address
     * @param _keyHash Chainlink VRF Key Hash
     * @param _subscriptionId Chainlink VRF Subscription ID
     */
    constructor(
        string memory _title,
        string memory _description,
        string memory _prizeDescription,
        uint256 _entryFee,
        uint256 _deadline,
        uint256 _maxParticipants,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_entryFee > 0, "Entry fee must be greater than 0");

        title = _title;
        description = _description;
        prizeDescription = _prizeDescription;
        entryFee = _entryFee;
        deadline = _deadline;
        maxParticipants = _maxParticipants;
        creator = msg.sender;
        status = RaffleStatus.ACTIVE;

        vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
    }

    /**
     * @notice Join the raffle by paying the entry fee
     */
    function joinRaffle() external payable {
        if (status != RaffleStatus.ACTIVE) revert RaffleNotActive();
        if (block.timestamp >= deadline) revert RaffleEnded();
        if (hasJoined[msg.sender]) revert AlreadyJoined();
        if (msg.value != entryFee) revert InsufficientEntryFee();
        if (maxParticipants > 0 && participants.length >= maxParticipants) revert RaffleFull();

        participants.push(msg.sender);
        hasJoined[msg.sender] = true;

        emit ParticipantJoined(msg.sender, participants.length);
    }

    /**
     * @notice Draw winner using Chainlink VRF
     * @dev Can only be called after deadline and before winner is drawn
     */
    function drawWinner() external returns (uint256 requestId) {
        if (msg.sender != creator) revert NotCreator();
        if (block.timestamp < deadline) revert DeadlineNotReached();
        if (participants.length == 0) revert NoParticipants();
        if (winner != address(0)) revert WinnerAlreadyDrawn();

        status = RaffleStatus.ENDED;

        // Request randomness from Chainlink VRF V2Plus
        requestId = vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: CALLBACK_GAS_LIMIT,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        vrfRequestId = requestId;
        return requestId;
    }

    /**
     * @notice Callback function used by VRF Coordinator
     * @param _requestId VRF request ID
     * @param _randomWords Array of random values
     */
    function fulfillRandomWords(uint256 _requestId, uint256[] calldata _randomWords) internal override {
        randomResult = _randomWords[0];
        winnerIndex = randomResult % participants.length;
        winner = participants[winnerIndex];
        status = RaffleStatus.DRAWN;

        emit WinnerDrawn(winner, winnerIndex, randomResult, _requestId);
    }

    /**
     * @notice Claim prize (winner only)
     */
    function claimPrize() external {
        if (msg.sender != winner) revert NotWinner();
        if (status != RaffleStatus.DRAWN) revert WinnerAlreadyDrawn();

        uint256 prizeAmount = address(this).balance;
        status = RaffleStatus.DRAWN; // Keep status as DRAWN after claim

        (bool success, ) = winner.call{value: prizeAmount}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(winner, prizeAmount);
    }

    /**
     * @notice Cancel raffle (creator only, before deadline)
     */
    function cancelRaffle() external {
        if (msg.sender != creator) revert NotCreator();
        if (block.timestamp >= deadline) revert DeadlineNotReached();

        status = RaffleStatus.CANCELLED;

        // Refund all participants
        for (uint256 i = 0; i < participants.length; i++) {
            (bool success, ) = participants[i].call{value: entryFee}("");
            require(success, "Refund failed");
        }

        emit RaffleCancelled();
    }

    // View functions
    function getRaffleInfo() external view returns (
        string memory _title,
        string memory _description,
        string memory _prizeDescription,
        uint256 _entryFee,
        uint256 _deadline,
        uint256 _maxParticipants,
        uint256 _currentParticipants,
        address _creator,
        RaffleStatus _status
    ) {
        return (
            title,
            description,
            prizeDescription,
            entryFee,
            deadline,
            maxParticipants,
            participants.length,
            creator,
            status
        );
    }

    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
}
