// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRaffleFactory {
    function requestRandomnessForRaffle() external returns (uint256 requestId);
}

/**
 * @title Raffle
 * @notice Individual raffle contract with provably fair winner selection via Factory
 * @notice Supports multiple ticket purchases per wallet and permissionless winner drawing
 * @dev Requests randomness through RaffleFactory
 */
contract Raffle is ReentrancyGuard {
    // Raffle status enum
    enum RaffleStatus {
        UPCOMING,
        ACTIVE,
        ENDED,
        DRAWN,
        CANCELLED,
        CLAIMED
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
    uint256 public creatorCommissionBps; // 100 = 1%, 1000 = 10%

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
    event CreatorCommissionPaid(address indexed creator, uint256 amount);
    event RaffleCancelled();
    event RandomnessRequested(uint256 requestId);
    event RefundWithdrawn(address indexed participant, uint256 amount);

    // Errors
    error NotCreator();
    error RaffleNotActive();
    error RaffleEnded();
    error InsufficientPayment();
    error RaffleFull();
    error DeadlineNotReached();
    error NoParticipants();
    error NotEnoughParticipants();
    error WinnerAlreadyDrawn();
    error NotWinner();
    error PrizeAlreadyClaimed();
    error InvalidTicketCount();
    error OnlyFactory();
    error DeadlineMustBeInFuture();
    error EntryFeeMustBePositive();
    error InvalidFactoryAddress();
    error MaxParticipantsTooHigh();
    error MinParticipantsTooLow();
    error EntryFeeTooHigh();
    error DeadlineTooFar();
    error TransferFailed();
    error InvalidRequestId();
    error WinnerAlreadySet();
    error InvalidCommission();
    error DrawInProgress();
    error RaffleNotCancelled();
    error NoRefundAvailable();

    /**
     * @notice Create a new raffle
     * @param _title Raffle title
     * @param _description Raffle description
     * @param _prizeDescription Prize description
     * @param _entryFee Entry fee per ticket in wei
     * @param _deadline Deadline timestamp
     * @param _maxParticipants Maximum total tickets (0 = unlimited)
     * @param _creator Creator address (passed from factory)
     * @param _factory Factory contract address
     * @param _creatorCommissionBps Creator commission in basis points (0-1000, i.e. 0%-10%)
     */
    constructor(
        string memory _title,
        string memory _description,
        string memory _prizeDescription,
        uint256 _entryFee,
        uint256 _deadline,
        uint256 _maxParticipants,
        address _creator,
        address _factory,
        uint256 _creatorCommissionBps
    ) {
        // Deadline validation
        if (_deadline <= block.timestamp) revert DeadlineMustBeInFuture();
        if (_deadline > block.timestamp + 365 days) revert DeadlineTooFar();

        // Entry fee validation
        if (_entryFee == 0) revert EntryFeeMustBePositive();
        if (_entryFee > 100 ether) revert EntryFeeTooHigh();

        // Max participants validation (prevent gas DoS and ensure at least 2 participants)
        if (_maxParticipants == 1) revert MinParticipantsTooLow();
        if (_maxParticipants > 10000) revert MaxParticipantsTooHigh();

        // Factory validation
        if (_factory == address(0)) revert InvalidFactoryAddress();

        // Commission validation (0-10%)
        if (_creatorCommissionBps > 1000) revert InvalidCommission();

        title = _title;
        description = _description;
        prizeDescription = _prizeDescription;
        entryFee = _entryFee;
        deadline = _deadline;
        maxParticipants = _maxParticipants;
        creator = _creator; // Use passed creator address instead of tx.origin
        status = RaffleStatus.ACTIVE;
        factory = IRaffleFactory(_factory);
        creatorCommissionBps = _creatorCommissionBps;
    }

    /**
     * @notice Buy multiple tickets at once
     * @param _ticketCount Number of tickets to purchase
     * @dev Same wallet can buy multiple tickets for better odds
     */
    function joinRaffle(uint256 _ticketCount) external payable nonReentrant {
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
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            if (!success) revert TransferFailed();
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
        if (participants.length < 2) revert NotEnoughParticipants();
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
        if (_requestId != vrfRequestId) revert InvalidRequestId();
        if (winner != address(0)) revert WinnerAlreadySet();

        randomResult = _randomWord;
        winnerIndex = randomResult % participants.length;
        winner = participants[winnerIndex];
        status = RaffleStatus.DRAWN;

        emit WinnerDrawn(winner, winnerIndex, randomResult, _requestId);
    }

    /**
     * @notice Claim prize (winner only)
     * @dev Splits payout between winner and creator based on creatorCommissionBps
     */
    function claimPrize() external nonReentrant {
        if (msg.sender != winner) revert NotWinner();
        if (status != RaffleStatus.DRAWN) revert PrizeAlreadyClaimed();

        status = RaffleStatus.CLAIMED;
        uint256 prizeAmount = address(this).balance;

        // Calculate creator commission
        uint256 creatorAmount = (prizeAmount * creatorCommissionBps) / 10000;
        uint256 winnerAmount = prizeAmount - creatorAmount;

        emit PrizeClaimed(winner, winnerAmount);

        // Send winner their share
        (bool winnerSuccess, ) = payable(winner).call{value: winnerAmount}("");
        if (!winnerSuccess) revert TransferFailed();

        // Send creator their commission (if any)
        if (creatorAmount > 0) {
            emit CreatorCommissionPaid(creator, creatorAmount);
            (bool creatorSuccess, ) = payable(creator).call{value: creatorAmount}("");
            if (!creatorSuccess) revert TransferFailed();
        }
    }

    /**
     * @notice Cancel raffle (creator anytime before draw, anyone if underfilled after deadline)
     * @dev Uses pull pattern: sets status to CANCELLED, participants withdraw via withdrawRefund()
     */
    function cancelRaffle() external {
        bool isUnderfilled = block.timestamp >= deadline && participants.length < 2;
        if (msg.sender != creator && !isUnderfilled) revert NotCreator();

        // Block cancel during VRF pending (ENDED), after winner drawn (DRAWN), already cancelled, or claimed
        if (status == RaffleStatus.ENDED) revert DrawInProgress();
        if (status == RaffleStatus.DRAWN || status == RaffleStatus.CANCELLED || status == RaffleStatus.CLAIMED) {
            revert RaffleEnded();
        }

        status = RaffleStatus.CANCELLED;
        emit RaffleCancelled();
    }

    /**
     * @notice Withdraw refund after raffle cancellation (pull pattern)
     * @dev Each participant calls this individually — eliminates DoS, double-refund, and gas limit issues
     */
    function withdrawRefund() external nonReentrant {
        if (status != RaffleStatus.CANCELLED) revert RaffleNotCancelled();
        uint256 tickets = ticketCount[msg.sender];
        if (tickets == 0) revert NoRefundAvailable();

        // Zero out before transfer (checks-effects-interactions)
        ticketCount[msg.sender] = 0;
        uint256 refundAmount = tickets * entryFee;

        emit RefundWithdrawn(msg.sender, refundAmount);

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        if (!success) revert TransferFailed();
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
        address _winner,
        uint256 _creatorCommissionBps
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
            winner,
            creatorCommissionBps
        );
    }
}
