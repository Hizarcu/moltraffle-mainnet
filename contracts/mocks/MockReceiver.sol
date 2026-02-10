// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Raffle.sol";

/**
 * @title MockReceiver
 * @notice Mock contract wallet that can receive ETH
 * @dev Tests that .call{} works for contract recipients
 */
contract MockReceiver {
    // Must have receive() to accept ETH
    receive() external payable {}

    function joinRaffle(address raffleAddress, uint256 ticketCount, uint256 value) external payable {
        Raffle(raffleAddress).joinRaffle{value: value}(ticketCount);
    }

    function claimPrize(address raffleAddress) external {
        Raffle(raffleAddress).claimPrize();
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
