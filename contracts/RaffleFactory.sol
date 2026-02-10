// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Raffle.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RaffleFactory
 * @notice Factory contract to create and manage multiple raffles
 * @dev Deploys new Raffle contracts and handles Chainlink VRF requests for all raffles
 */
contract RaffleFactory is VRFConsumerBaseV2Plus, Pausable {
    // Chainlink VRF Configuration
    bytes32 public immutable keyHash;
    uint256 public immutable subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant CALLBACK_GAS_LIMIT = 300000;
    uint32 private constant NUM_WORDS = 1;

    // Platform fee configuration
    address public immutable platformOwner;
    uint256 public constant CREATION_FEE_BPS = 100; // 1%
    uint256 public constant MIN_FEE = 0.0004 ether;
    uint256 public constant MAX_FEE = 0.05 ether;

    // All deployed raffles
    address[] public allRaffles;

    // Mapping from creator to their raffles
    mapping(address => address[]) public rafflesByCreator;

    // Mapping to check if address is a raffle
    mapping(address => bool) public isRaffle;

    // Mapping from VRF requestId to raffle address
    mapping(uint256 => address) public requestIdToRaffle;

    // Events
    event RaffleCreated(
        address indexed raffleAddress,
        address indexed creator,
        string title,
        uint256 entryFee,
        uint256 deadline,
        uint256 maxParticipants
    );

    event RandomnessRequested(address indexed raffle, uint256 indexed requestId);
    event RandomnessFulfilled(address indexed raffle, uint256 indexed requestId, uint256 randomWord);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    // Errors
    error InsufficientCreationFee();
    error NotPlatformOwner();
    error WithdrawFailed();
    error TransferFailed();
    error OnlyRaffleContract();
    error InvalidRequestId();

    /**
     * @notice Initialize factory with Chainlink VRF configuration
     * @param _vrfCoordinator Chainlink VRF Coordinator address
     * @param _keyHash Chainlink VRF Key Hash
     * @param _subscriptionId Chainlink VRF Subscription ID
     */
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        platformOwner = msg.sender;
    }

    /**
     * @notice Create a new raffle
     * @param _title Raffle title
     * @param _description Raffle description
     * @param _prizeDescription Prize description
     * @param _entryFee Entry fee in wei
     * @param _deadline Deadline timestamp
     * @param _maxParticipants Maximum participants (0 = unlimited)
     * @return raffleAddress Address of the newly created raffle
     */
    /**
     * @notice Calculate the creation fee for a raffle
     * @param _entryFee Entry fee per ticket in wei
     * @param _maxParticipants Maximum total tickets (0 = unlimited)
     * @return fee The creation fee in wei
     */
    function calculateCreationFee(uint256 _entryFee, uint256 _maxParticipants) public pure returns (uint256 fee) {
        if (_maxParticipants == 0) {
            return MAX_FEE;
        }
        fee = (_entryFee * _maxParticipants * CREATION_FEE_BPS) / 10000;
        if (fee < MIN_FEE) fee = MIN_FEE;
        if (fee > MAX_FEE) fee = MAX_FEE;
        return fee;
    }

    function createRaffle(
        string memory _title,
        string memory _description,
        string memory _prizeDescription,
        uint256 _entryFee,
        uint256 _deadline,
        uint256 _maxParticipants
    ) external payable whenNotPaused returns (address raffleAddress) {
        // Check creation fee
        uint256 requiredFee = calculateCreationFee(_entryFee, _maxParticipants);
        if (msg.value < requiredFee) revert InsufficientCreationFee();

        // Create new raffle contract (pass creator address and factory address)
        Raffle newRaffle = new Raffle(
            _title,
            _description,
            _prizeDescription,
            _entryFee,
            _deadline,
            _maxParticipants,
            msg.sender, // Pass creator address (fixes tx.origin vulnerability)
            address(this) // Pass factory address
        );

        raffleAddress = address(newRaffle);

        // Store raffle
        allRaffles.push(raffleAddress);
        rafflesByCreator[msg.sender].push(raffleAddress);
        isRaffle[raffleAddress] = true;

        emit RaffleCreated(
            raffleAddress,
            msg.sender,
            _title,
            _entryFee,
            _deadline,
            _maxParticipants
        );

        // Refund excess fee
        uint256 excess = msg.value - requiredFee;
        if (excess > 0) {
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            if (!success) revert TransferFailed();
        }

        return raffleAddress;
    }

    /**
     * @notice Request randomness for a raffle (called by Raffle contracts)
     * @return requestId VRF request ID
     */
    function requestRandomnessForRaffle() external returns (uint256 requestId) {
        if (!isRaffle[msg.sender]) revert OnlyRaffleContract();

        // Request randomness from Chainlink VRF
        requestId = s_vrfCoordinator.requestRandomWords(
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

        // Store mapping
        requestIdToRaffle[requestId] = msg.sender;

        emit RandomnessRequested(msg.sender, requestId);

        return requestId;
    }

    /**
     * @notice Callback function used by VRF Coordinator
     * @param _requestId VRF request ID
     * @param _randomWords Array of random values
     */
    function fulfillRandomWords(uint256 _requestId, uint256[] calldata _randomWords) internal override {
        address raffleAddress = requestIdToRaffle[_requestId];
        if (raffleAddress == address(0)) revert InvalidRequestId();

        uint256 randomWord = _randomWords[0];

        // Forward the random number to the raffle
        Raffle(raffleAddress).fulfillRandomness(_requestId, randomWord);

        emit RandomnessFulfilled(raffleAddress, _requestId, randomWord);
    }

    // View functions
    function getAllRaffles() external view returns (address[] memory) {
        return allRaffles;
    }

    function getRafflesByCreator(address _creator) external view returns (address[] memory) {
        return rafflesByCreator[_creator];
    }

    function getRaffleCount() external view returns (uint256) {
        return allRaffles.length;
    }

    function getCreatorRaffleCount(address _creator) external view returns (uint256) {
        return rafflesByCreator[_creator].length;
    }

    /**
     * @notice Pause raffle creation (emergency mechanism, platform owner only)
     * @dev Existing raffles continue to function normally
     */
    function pause() external {
        if (msg.sender != platformOwner) revert NotPlatformOwner();
        _pause();
    }

    /**
     * @notice Unpause raffle creation (platform owner only)
     */
    function unpause() external {
        if (msg.sender != platformOwner) revert NotPlatformOwner();
        _unpause();
    }

    /**
     * @notice Withdraw accumulated creation fees (platform owner only)
     */
    function withdrawFees() external {
        if (msg.sender != platformOwner) revert NotPlatformOwner();
        uint256 balance = address(this).balance;
        (bool success, ) = platformOwner.call{value: balance}("");
        if (!success) revert WithdrawFailed();
        emit FeesWithdrawn(platformOwner, balance);
    }

    /**
     * @notice Get accumulated fees in the factory contract
     */
    function getAccumulatedFees() external view returns (uint256) {
        return address(this).balance;
    }
}
