// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Raffle.sol";

/**
 * @title RaffleFactory
 * @notice Factory contract to create and manage multiple raffles
 * @dev Deploys new Raffle contracts with Chainlink VRF configuration
 */
contract RaffleFactory {
    // Chainlink VRF Configuration (immutable for all raffles)
    address public immutable vrfCoordinator;
    bytes32 public immutable keyHash;
    uint256 public immutable subscriptionId;

    // All deployed raffles
    address[] public allRaffles;

    // Mapping from creator to their raffles
    mapping(address => address[]) public rafflesByCreator;

    // Mapping to check if address is a raffle
    mapping(address => bool) public isRaffle;

    // Events
    event RaffleCreated(
        address indexed raffleAddress,
        address indexed creator,
        string title,
        uint256 entryFee,
        uint256 deadline,
        uint256 maxParticipants
    );

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
    ) {
        require(_vrfCoordinator != address(0), "Invalid VRF Coordinator");

        vrfCoordinator = _vrfCoordinator;
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
        // Create new raffle contract
        Raffle newRaffle = new Raffle(
            _title,
            _description,
            _prizeDescription,
            _entryFee,
            _deadline,
            _maxParticipants,
            vrfCoordinator,
            keyHash,
            subscriptionId
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
