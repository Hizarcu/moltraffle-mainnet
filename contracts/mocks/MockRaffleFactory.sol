// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Raffle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockRaffleFactory
 * @notice Mock factory for testing Raffle contract in isolation
 * @dev Implements IRaffleFactory interface so Raffle.claimPrize() works
 */
contract MockRaffleFactory {
    using SafeERC20 for IERC20;

    uint256 public nextRequestId = 1;
    address public platformOwner;
    uint256 public constant PLATFORM_FEE_BPS = 200; // 2%
    IERC20 public usdc;

    constructor(address _platformOwner, address _usdc) {
        platformOwner = _platformOwner;
        usdc = IERC20(_usdc);
    }

    function requestRandomnessForRaffle() external returns (uint256 requestId) {
        requestId = nextRequestId;
        nextRequestId++;
        return requestId;
    }

    function simulateFulfillment(
        address raffleAddress,
        uint256 requestId,
        uint256 randomWord
    ) external {
        Raffle(raffleAddress).fulfillRandomness(requestId, randomWord);
    }

    /// @notice Mimics Factory.joinRaffle for isolated Raffle tests
    function joinRaffle(address _raffle, address _participant, uint256 _ticketCount) external {
        uint256 entryFee = Raffle(_raffle).entryFee();
        uint256 totalCost = entryFee * _ticketCount;

        // Pull USDC from participant and send to raffle
        usdc.safeTransferFrom(_participant, _raffle, totalCost);

        // Register tickets
        Raffle(_raffle).registerTickets(_participant, _ticketCount);
    }
}
