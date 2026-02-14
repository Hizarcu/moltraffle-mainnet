// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Raffle.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RaffleFactory
 * @notice Factory contract to create and manage multiple raffles
 * @dev Deploys new Raffle contracts and handles Chainlink VRF requests for all raffles.
 *      Acts as payment router: users approve Factory once, Factory routes USDC to Raffles.
 */
contract RaffleFactory is VRFConsumerBaseV2Plus, Pausable {
    using SafeERC20 for IERC20;

    // Chainlink VRF Configuration
    bytes32 public immutable keyHash;
    uint256 public immutable subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant CALLBACK_GAS_LIMIT = 300000;
    uint32 private constant NUM_WORDS = 1;

    // Platform fee configuration
    address public immutable platformOwner;
    IERC20 public immutable usdc;
    uint256 public constant CREATION_FEE = 1_000_000;   // $1 USDC (6 decimals)
    uint256 public constant PLATFORM_FEE_BPS = 200;     // 2% at claim time

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
        uint256 maxParticipants,
        uint256 creatorCommissionBps
    );

    event RaffleJoined(
        address indexed raffle,
        address indexed participant,
        uint256 ticketCount,
        uint256 totalCost
    );

    event RandomnessRequested(address indexed raffle, uint256 indexed requestId);
    event RandomnessFulfilled(address indexed raffle, uint256 indexed requestId, uint256 randomWord);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    // Errors
    error InsufficientCreationFee();
    error NotPlatformOwner();
    error WithdrawFailed();
    error OnlyRaffleContract();
    error InvalidRequestId();
    error InvalidRaffle();
    error InvalidTicketCount();

    /**
     * @notice Initialize factory with Chainlink VRF configuration and USDC address
     * @param _vrfCoordinator Chainlink VRF Coordinator address
     * @param _keyHash Chainlink VRF Key Hash
     * @param _subscriptionId Chainlink VRF Subscription ID
     * @param _usdc USDC token address
     */
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId,
        address _usdc
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        platformOwner = msg.sender;
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Create a new raffle (pulls $1 USDC creation fee)
     * @param _title Raffle title
     * @param _description Raffle description
     * @param _prizeDescription Prize description
     * @param _entryFee Entry fee in USDC (6 decimals)
     * @param _deadline Deadline timestamp
     * @param _maxParticipants Maximum participants (0 = unlimited)
     * @param _creatorCommissionBps Creator commission in basis points (0-1000)
     * @return raffleAddress Address of the newly created raffle
     */
    function createRaffle(
        string memory _title,
        string memory _description,
        string memory _prizeDescription,
        uint256 _entryFee,
        uint256 _deadline,
        uint256 _maxParticipants,
        uint256 _creatorCommissionBps
    ) external whenNotPaused returns (address raffleAddress) {
        // Pull $1 USDC creation fee
        usdc.safeTransferFrom(msg.sender, address(this), CREATION_FEE);

        // Create new raffle contract with USDC address
        Raffle newRaffle = new Raffle(
            _title,
            _description,
            _prizeDescription,
            _entryFee,
            _deadline,
            _maxParticipants,
            msg.sender,
            address(this),
            _creatorCommissionBps,
            address(usdc)
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
            _maxParticipants,
            _creatorCommissionBps
        );

        return raffleAddress;
    }

    /**
     * @notice Join a raffle by purchasing tickets (routes USDC from caller to Raffle)
     * @param _raffle Address of the raffle to join
     * @param _ticketCount Number of tickets to purchase
     * @dev Caller must have approved Factory for sufficient USDC
     */
    function joinRaffle(address _raffle, uint256 _ticketCount) external {
        if (!isRaffle[_raffle]) revert InvalidRaffle();
        if (_ticketCount == 0) revert InvalidTicketCount();

        // Calculate total cost
        uint256 entryFee = Raffle(_raffle).entryFee();
        uint256 totalCost = entryFee * _ticketCount;

        // Pull USDC from caller and send directly to Raffle
        usdc.safeTransferFrom(msg.sender, _raffle, totalCost);

        // Register tickets on the Raffle
        Raffle(_raffle).registerTickets(msg.sender, _ticketCount);

        emit RaffleJoined(_raffle, msg.sender, _ticketCount, totalCost);
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
     * @notice Withdraw accumulated USDC fees (platform owner only)
     */
    function withdrawFees() external {
        if (msg.sender != platformOwner) revert NotPlatformOwner();
        uint256 balance = usdc.balanceOf(address(this));
        usdc.safeTransfer(platformOwner, balance);
        emit FeesWithdrawn(platformOwner, balance);
    }

    /**
     * @notice Get accumulated USDC fees in the factory contract
     */
    function getAccumulatedFees() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
