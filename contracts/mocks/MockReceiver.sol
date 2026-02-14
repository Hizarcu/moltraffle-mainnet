// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Raffle.sol";
import "../RaffleFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockReceiver
 * @notice Mock contract wallet for testing
 * @dev Tests that contract wallets can interact with the platform via Factory
 */
contract MockReceiver {
    function approveUSDC(address usdc, address spender, uint256 amount) external {
        IERC20(usdc).approve(spender, amount);
    }

    function joinRaffleViaFactory(address factory, address raffle, uint256 ticketCount) external {
        RaffleFactory(factory).joinRaffle(raffle, ticketCount);
    }

    function claimPrize(address raffleAddress) external {
        Raffle(raffleAddress).claimPrize();
    }

    function getUSDCBalance(address usdc) external view returns (uint256) {
        return IERC20(usdc).balanceOf(address(this));
    }
}
