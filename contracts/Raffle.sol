// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRaffleFactory {
    function requestRandomnessForRaffle() external returns (uint256 requestId);
}

/**
 * @title Raffle
 * @notice Individual raffle contract with provably fair winner selection via Factory
 * @notice Supports multiple ticket purchases per wallet and permissionless winner drawing
 * @dev Requests randomness through RaffleFactory
 */
contract Raffle {
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

    // Participants - stores ticket entries (same address can appear multiple times)
    address[] public participants; // Each entry = 1 ticket
    mapping(address => uint256) public ticketCount; // Tracks tickets per wallet

    // Winner selection
    address public winner;
    uint256 public winnerIndex;
    uint256 public randomResult;
    uint256 public vrfRequestId;

    // Factory address (handles VRF requests)
    IRaffleFactory public immutable factory;

    // Events
    event ParticipantJoined(address indexed participant, uint256 ticketsBought, uint256 totalTickets, uint256 participantTicketCount);
    event WinnerDrawn(address indexed winner, uint256 winnerIndex, uint256 randomNumber, uint256 vrfRequestId);
    event PrizeClaimed(address indexed winner, uint256 amount);
    event RaffleCancelled();
    event RandomnessRequested(uint256 requestId);

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
    error OnlyFactory();

    /**
     * @notice Create a new raffle
     * @param _title Raffle title
     * @param _description Raffle description
     * @param _prizeDescription Prize description
     * @param _entryFee Entry fee per ticket in wei
     * @param _deadline Deadline timestamp
     * @param _maxParticipants Maximum total tickets (0 = unlimited)
     * @param _factory Factory contract address
     */
    constructor(
        string memory _title,
        string memory _description,
        string memory _prizeDescription,
        uint256 _entryFee,
        uint256 _deadline,
        uint256 _maxParticipants,
        address _factory
    ) {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_entryFee > 0, "Entry fee must be greater than 0");
        require(_factory != address(0), "Invalid factory address");

        title = _title;
        description = _description;
        prizeDescription = _prizeDescription;
        entryFee = _entryFee;
        deadline = _deadline;
        maxParticipants = _maxParticipants;
        creator = tx.origin; // Creator is the original caller
        status = RaffleStatus.ACTIVE;
        factory = IRaffleFactory(_factory);
    }

    /**
     * @notice Buy multiple tickets at once
     * @param _ticketCount Number of tickets to purchase
     * @dev Same wallet can buy multiple tickets for better odds
     */
    function joinRaffle(uint256 _ticketCount) external payable {
        if (status != RaffleStatus.ACTIVE) revert RaffleNotActive();
        if (block.timestamp >= deadline) revert RaffleEnded();
        if (_ticketCount == 0) revert InvalidTicketCount();

        uint256 totalCost = entryFee * _ticketCount;
        if (msg.value < totalCost) revert InsufficientPayment();

        // Check max participants (if set)
        if (maxParticipants > 0) {
            if (participants.length + _ticketCount > maxParticipants) revert RaffleFull();
        }

        // Add each ticket as separate entry
        for (uint256 i = 0; i < _ticketCount; i++) {
            participants.push(msg.sender);
        }

        // Update ticket count for this wallet
        ticketCount[msg.sender] += _ticketCount;

        emit ParticipantJoined(msg.sender, _ticketCount, participants.length, ticketCount[msg.sender]);

        // Refund excess payment
        uint256 refund = msg.value - totalCost;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
    }

    /**
     * @notice Draw winner using Chainlink VRF (via Factory)
     * @dev Can be called by anyone after deadline is reached or max participants is reached
     */
    function drawWinner() public returns (uint256 requestId) {
        // Allow anyone to draw after conditions are met
        if (block.timestamp < deadline && (maxParticipants == 0 || participants.length < maxParticipants)) {
            revert DeadlineNotReached();
        }
        if (participants.length == 0) revert NoParticipants();
        if (winner != address(0)) revert WinnerAlreadyDrawn();

        status = RaffleStatus.ENDED;

        // Request randomness from factory
        requestId = factory.requestRandomnessForRaffle();
        vrfRequestId = requestId;

        emit RandomnessRequested(requestId);

        return requestId;
    }

    /**
     * @notice Receive random number from factory and select winner
     * @param _requestId VRF request ID
     * @param _randomWord Random number from Chainlink VRF
     */
    function fulfillRandomness(uint256 _requestId, uint256 _randomWord) external {
        if (msg.sender != address(factory)) revert OnlyFactory();
        require(_requestId == vrfRequestId, "Invalid request ID");
        require(winner == address(0), "Winner already set");

        randomResult = _randomWord;
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

        status = RaffleStatus.CANCELLED; // Prevent re-claiming
        uint256 prizeAmount = address(this).balance;

        emit PrizeClaimed(winner, prizeAmount);

        payable(winner).transfer(prizeAmount);
    }

    /**
     * @notice Cancel raffle and refund all participants (creator only, before drawing)
     */
    function cancelRaffle() external {
        if (msg.sender != creator) revert NotCreator();
        if (status == RaffleStatus.DRAWN || status == RaffleStatus.CANCELLED) {
            revert RaffleEnded();
        }

        status = RaffleStatus.CANCELLED;
        emit RaffleCancelled();

        // Refund all participants
        uint256 refundPerTicket = entryFee;
        address[] memory participantsSnapshot = participants; // Gas optimization

        // Use ticketCount mapping for efficient refunds
        address lastRefunded = address(0);
        for (uint256 i = 0; i < participantsSnapshot.length; i++) {
            address participant = participantsSnapshot[i];

            // Only refund once per unique address
            if (participant != lastRefunded) {
                uint256 tickets = ticketCount[participant];
                uint256 refundAmount = tickets * refundPerTicket;
                payable(participant).transfer(refundAmount);
                lastRefunded = participant;
            }
        }
    }

    // View functions
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getTotalTickets() external view returns (uint256) {
        return participants.length;
    }

    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserTicketCount(address _user) external view returns (uint256) {
        return ticketCount[_user];
    }

    function getRaffleDetails() external view returns (
        string memory _title,
        string memory _description,
        uint256 _entryFee,
        uint256 _deadline,
        uint256 _maxParticipants,
        uint256 _currentParticipants,
        RaffleStatus _status,
        address _creator,
        address _winner
    ) {
        return (
            title,
            description,
            entryFee,
            deadline,
            maxParticipants,
            participants.length,
            status,
            creator,
            winner
        );
    }
}
