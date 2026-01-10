// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

/**
 * @title Raffle
 * @notice Individual raffle contract with Chainlink VRF for provably fair winner selection
 * @notice Supports multiple ticket purchases per wallet and auto-execution via Chainlink Automation
 * @dev Inherits from VRFConsumerBaseV2Plus for randomness and AutomationCompatibleInterface for auto-draw
 */
contract Raffle is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
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
    uint256 public maxParticipants; // Max total tickets (0 = unlimited)
    address public creator;
    RaffleStatus public status;

    // Participants - now stores ticket entries (same address can appear multiple times)
    address[] public participants; // Each entry = 1 ticket
    mapping(address => uint256) public ticketCount; // Tracks tickets per wallet

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
    event ParticipantJoined(address indexed participant, uint256 ticketsBought, uint256 totalTickets, uint256 participantTicketCount);
    event WinnerDrawn(address indexed winner, uint256 winnerIndex, uint256 randomNumber, uint256 vrfRequestId);
    event PrizeClaimed(address indexed winner, uint256 amount);
    event RaffleCancelled();
    event AutoDrawTriggered(uint256 timestamp, string reason);

    // Errors
    error NotCreator();
    error RaffleNotActive();
    error RaffleEnded();
    error InsufficientPayment();
    error RaffleFull();
    error DeadlineNotReached();
    error NoParticipants();
    error WinnerAlreadyDrawn();
    error NotWinner();
    error PrizeAlreadyClaimed();
    error InvalidTicketCount();

    /**
     * @notice Create a new raffle
     * @param _title Raffle title
     * @param _description Raffle description
     * @param _prizeDescription Prize description
     * @param _entryFee Entry fee per ticket in wei
     * @param _deadline Deadline timestamp
     * @param _maxParticipants Maximum total tickets (0 = unlimited)
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
     * @notice Join the raffle by buying one or more tickets
     * @dev Send msg.value = entryFee * numberOfTickets
     */
    function joinRaffle() external payable {
        if (status != RaffleStatus.ACTIVE) revert RaffleNotActive();
        if (block.timestamp >= deadline) revert RaffleEnded();
        if (msg.value < entryFee) revert InsufficientPayment();

        // Calculate number of tickets being purchased
        uint256 ticketsToBuy = msg.value / entryFee;
        if (ticketsToBuy == 0) revert InvalidTicketCount();

        // Check if raffle would be overfilled
        if (maxParticipants > 0) {
            uint256 remainingSlots = maxParticipants - participants.length;
            if (ticketsToBuy > remainingSlots) revert RaffleFull();
        }

        // Add ticket entries
        for (uint256 i = 0; i < ticketsToBuy; i++) {
            participants.push(msg.sender);
        }
        ticketCount[msg.sender] += ticketsToBuy;

        // Refund excess payment if any
        uint256 totalCost = ticketsToBuy * entryFee;
        if (msg.value > totalCost) {
            (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(success, "Refund failed");
        }

        emit ParticipantJoined(msg.sender, ticketsToBuy, participants.length, ticketCount[msg.sender]);
    }

    /**
     * @notice Buy multiple tickets at once
     * @param numberOfTickets Number of tickets to buy
     */
    function buyTickets(uint256 numberOfTickets) external payable {
        if (status != RaffleStatus.ACTIVE) revert RaffleNotActive();
        if (block.timestamp >= deadline) revert RaffleEnded();
        if (numberOfTickets == 0) revert InvalidTicketCount();

        uint256 totalCost = numberOfTickets * entryFee;
        if (msg.value < totalCost) revert InsufficientPayment();

        // Check if raffle would be overfilled
        if (maxParticipants > 0 && participants.length + numberOfTickets > maxParticipants) {
            revert RaffleFull();
        }

        // Add ticket entries
        for (uint256 i = 0; i < numberOfTickets; i++) {
            participants.push(msg.sender);
        }
        ticketCount[msg.sender] += numberOfTickets;

        // Refund excess payment
        if (msg.value > totalCost) {
            (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(success, "Refund failed");
        }

        emit ParticipantJoined(msg.sender, numberOfTickets, participants.length, ticketCount[msg.sender]);
    }

    /**
     * @notice Draw winner using Chainlink VRF
     * @dev Can be called by creator after deadline, or by Chainlink Automation
     */
    function drawWinner() public returns (uint256 requestId) {
        // Allow creator OR Chainlink Automation to draw
        // Automation will call this via performUpkeep
        if (block.timestamp < deadline && (maxParticipants == 0 || participants.length < maxParticipants)) {
            revert DeadlineNotReached();
        }
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
     * @notice Chainlink Automation check function
     * @dev Called by Chainlink Automation nodes to check if upkeep is needed
     * @return upkeepNeeded True if winner should be drawn
     * @return performData Empty bytes (not used)
     */
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        bool deadlinePassed = block.timestamp >= deadline;
        bool isFull = maxParticipants > 0 && participants.length >= maxParticipants;
        bool hasParticipants = participants.length > 0;
        bool noWinnerYet = winner == address(0);
        bool isActive = status == RaffleStatus.ACTIVE;

        // Trigger auto-draw if:
        // 1. Raffle is active AND
        // 2. Has participants AND
        // 3. No winner yet AND
        // 4. (Deadline passed OR Max participants reached)
        upkeepNeeded = isActive && hasParticipants && noWinnerYet && (deadlinePassed || isFull);

        // Encode the reason for logging
        if (deadlinePassed) {
            performData = abi.encode("deadline_passed");
        } else if (isFull) {
            performData = abi.encode("max_participants_reached");
        } else {
            performData = "";
        }

        return (upkeepNeeded, performData);
    }

    /**
     * @notice Chainlink Automation perform function
     * @dev Called by Chainlink Automation when checkUpkeep returns true
     * @param performData Data from checkUpkeep (reason for trigger)
     */
    function performUpkeep(bytes calldata performData) external override {
        // Re-validate conditions (important for security)
        bool deadlinePassed = block.timestamp >= deadline;
        bool isFull = maxParticipants > 0 && participants.length >= maxParticipants;
        bool hasParticipants = participants.length > 0;
        bool noWinnerYet = winner == address(0);
        bool isActive = status == RaffleStatus.ACTIVE;

        require(
            isActive && hasParticipants && noWinnerYet && (deadlinePassed || isFull),
            "Upkeep not needed"
        );

        // Decode and emit reason
        if (performData.length > 0) {
            string memory reason = abi.decode(performData, (string));
            emit AutoDrawTriggered(block.timestamp, reason);
        }

        // Draw the winner
        drawWinner();
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

        // Refund all tickets - group by address to reduce gas
        // Note: Simple refund approach for now
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

    /**
     * @notice Get number of tickets owned by an address
     * @param _participant Address to check
     * @return Number of tickets owned
     */
    function getTicketCount(address _participant) external view returns (uint256) {
        return ticketCount[_participant];
    }

    /**
     * @notice Get unique participant count (number of unique addresses)
     * @return Number of unique participants
     */
    function getUniqueParticipantCount() external view returns (uint256) {
        // Note: This is O(n) - use with caution on large raffles
        address[] memory seen = new address[](participants.length);
        uint256 uniqueCount = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            bool isUnique = true;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (seen[j] == participants[i]) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                seen[uniqueCount] = participants[i];
                uniqueCount++;
            }
        }

        return uniqueCount;
    }

    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Check if auto-draw should trigger (convenience view function)
     * @return shouldDraw True if conditions are met for auto-draw
     * @return reason Reason string
     */
    function shouldAutoDraw() external view returns (bool shouldDraw, string memory reason) {
        bool deadlinePassed = block.timestamp >= deadline;
        bool isFull = maxParticipants > 0 && participants.length >= maxParticipants;
        bool hasParticipants = participants.length > 0;
        bool noWinnerYet = winner == address(0);
        bool isActive = status == RaffleStatus.ACTIVE;

        if (!isActive) return (false, "Raffle not active");
        if (!hasParticipants) return (false, "No participants");
        if (!noWinnerYet) return (false, "Winner already drawn");

        if (deadlinePassed) return (true, "Deadline passed");
        if (isFull) return (true, "Max participants reached");

        return (false, "Waiting for deadline or max participants");
    }
}
