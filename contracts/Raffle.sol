// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IRaffleFactory {
    function requestRandomnessForRaffle() external returns (uint256 requestId);
    function platformOwner() external view returns (address);
    function PLATFORM_FEE_BPS() external view returns (uint256);
}

/**
 * @title Raffle
 * @notice Individual raffle contract with provably fair winner selection via Factory
 * @notice Supports multiple ticket purchases per wallet and permissionless winner drawing
 * @dev Requests randomness through RaffleFactory. All payments in USDC.
 */
contract Raffle is ReentrancyGuard {
    using SafeERC20 for IERC20;

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

    // USDC token
    IERC20 public immutable usdc;

    // Events
    event ParticipantJoined(address indexed participant, uint256 ticketsBought, uint256 totalTickets, uint256 participantTicketCount);
    event WinnerDrawn(address indexed winner, uint256 winnerIndex, uint256 randomNumber, uint256 vrfRequestId);
    event PrizeClaimed(address indexed winner, uint256 amount);
    event CreatorCommissionPaid(address indexed creator, uint256 amount);
    event PlatformFeePaid(address indexed platform, uint256 amount);
    event RaffleCancelled();
    event RandomnessRequested(uint256 requestId);
    event RefundWithdrawn(address indexed participant, uint256 amount);

    // Errors
    error NotCreator();
    error RaffleNotActive();
    error RaffleEnded();
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
    error EntryFeeTooLow();
    error DeadlineTooFar();
    error InvalidRequestId();
    error WinnerAlreadySet();
    error InvalidCommission();
    error DrawInProgress();
    error RaffleNotCancelled();
    error NoRefundAvailable();
    error InvalidUSDCAddress();

    /**
     * @notice Create a new raffle
     * @param _title Raffle title
     * @param _description Raffle description
     * @param _prizeDescription Prize description
     * @param _entryFee Entry fee per ticket in USDC (6 decimals)
     * @param _deadline Deadline timestamp
     * @param _maxParticipants Maximum total tickets (0 = unlimited)
     * @param _creator Creator address (passed from factory)
     * @param _factory Factory contract address
     * @param _creatorCommissionBps Creator commission in basis points (0-1000, i.e. 0%-10%)
     * @param _usdc USDC token address
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
        uint256 _creatorCommissionBps,
        address _usdc
    ) {
        // Deadline validation
        if (_deadline <= block.timestamp) revert DeadlineMustBeInFuture();
        if (_deadline > block.timestamp + 365 days) revert DeadlineTooFar();

        // Entry fee validation (USDC 6 decimals: min $0.01 = 10000, max $10,000 = 10_000_000_000)
        if (_entryFee < 10000) revert EntryFeeTooLow();
        if (_entryFee > 10_000_000_000) revert EntryFeeTooHigh();

        // Max participants validation (prevent gas DoS and ensure at least 2 participants)
        if (_maxParticipants == 1) revert MinParticipantsTooLow();
        if (_maxParticipants > 10000) revert MaxParticipantsTooHigh();

        // Factory validation
        if (_factory == address(0)) revert InvalidFactoryAddress();

        // USDC validation
        if (_usdc == address(0)) revert InvalidUSDCAddress();

        // Commission validation (0-10%)
        if (_creatorCommissionBps > 1000) revert InvalidCommission();

        title = _title;
        description = _description;
        prizeDescription = _prizeDescription;
        entryFee = _entryFee;
        deadline = _deadline;
        maxParticipants = _maxParticipants;
        creator = _creator;
        status = RaffleStatus.ACTIVE;
        factory = IRaffleFactory(_factory);
        creatorCommissionBps = _creatorCommissionBps;
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Register tickets for a participant (called by Factory only)
     * @param _participant Address of the ticket buyer
     * @param _ticketCount Number of tickets purchased
     * @dev USDC already transferred to this contract by Factory before this call
     */
    function registerTickets(address _participant, uint256 _ticketCount) external {
        if (msg.sender != address(factory)) revert OnlyFactory();
        if (status != RaffleStatus.ACTIVE) revert RaffleNotActive();
        if (block.timestamp >= deadline) revert RaffleEnded();
        if (_ticketCount == 0) revert InvalidTicketCount();

        // Check max participants (if set)
        if (maxParticipants > 0) {
            if (participants.length + _ticketCount > maxParticipants) revert RaffleFull();
        }

        // Add each ticket as separate entry
        for (uint256 i = 0; i < _ticketCount; i++) {
            participants.push(_participant);
        }

        // Update ticket count for this wallet
        ticketCount[_participant] += _ticketCount;

        emit ParticipantJoined(_participant, _ticketCount, participants.length, ticketCount[_participant]);
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
     * @dev Three-way USDC split: platform fee (2%), creator commission, winner gets remainder
     */
    function claimPrize() external nonReentrant {
        if (msg.sender != winner) revert NotWinner();
        if (status != RaffleStatus.DRAWN) revert PrizeAlreadyClaimed();

        status = RaffleStatus.CLAIMED;
        uint256 prizeAmount = usdc.balanceOf(address(this));

        // 1. Platform fee (2%)
        uint256 platformFeeBps = factory.PLATFORM_FEE_BPS();
        uint256 platformFee = (prizeAmount * platformFeeBps) / 10000;
        address platformOwnerAddr = factory.platformOwner();

        // 2. Creator commission on remainder
        uint256 remainder = prizeAmount - platformFee;
        uint256 creatorAmount = (remainder * creatorCommissionBps) / 10000;
        uint256 winnerAmount = remainder - creatorAmount;

        // Transfer platform fee
        if (platformFee > 0) {
            usdc.safeTransfer(platformOwnerAddr, platformFee);
            emit PlatformFeePaid(platformOwnerAddr, platformFee);
        }

        // Transfer winner share
        emit PrizeClaimed(winner, winnerAmount);
        usdc.safeTransfer(winner, winnerAmount);

        // Transfer creator commission (if any)
        if (creatorAmount > 0) {
            emit CreatorCommissionPaid(creator, creatorAmount);
            usdc.safeTransfer(creator, creatorAmount);
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

        usdc.safeTransfer(msg.sender, refundAmount);
    }

    // View functions
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getTotalTickets() external view returns (uint256) {
        return participants.length;
    }

    function getPrizePool() external view returns (uint256) {
        return usdc.balanceOf(address(this));
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
