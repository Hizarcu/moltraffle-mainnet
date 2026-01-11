// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Raffle.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title RaffleFactory
 * @notice Factory contract to create and manage multiple raffles
 * @dev Deploys new Raffle contracts and handles Chainlink VRF requests for all raffles
 */
contract RaffleFactory is VRFConsumerBaseV2Plus {
    // Chainlink VRF Configuration
    bytes32 public immutable keyHash;
    uint256 public immutable subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant CALLBACK_GAS_LIMIT = 300000;
    uint32 private constant NUM_WORDS = 1;

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
    function createRaffle(
        string memory _title,
        string memory _description,
        string memory _prizeDescription,
        uint256 _entryFee,
        uint256 _deadline,
        uint256 _maxParticipants
    ) external returns (address raffleAddress) {
        // Create new raffle contract (pass factory address)
        Raffle newRaffle = new Raffle(
            _title,
            _description,
            _prizeDescription,
            _entryFee,
            _deadline,
            _maxParticipants,
            address(this) // Pass factory address instead of VRF coordinator
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

        return raffleAddress;
    }

    /**
     * @notice Request randomness for a raffle (called by Raffle contracts)
     * @return requestId VRF request ID
     */
    function requestRandomnessForRaffle() external returns (uint256 requestId) {
        require(isRaffle[msg.sender], "Only raffle contracts can request");

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
        require(raffleAddress != address(0), "Invalid request ID");

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
}
