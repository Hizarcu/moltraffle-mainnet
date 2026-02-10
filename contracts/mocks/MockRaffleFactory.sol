// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Raffle.sol";

/**
 * @title MockRaffleFactory
 * @notice Mock factory for testing Raffle contract
 */
contract MockRaffleFactory {
    uint256 public nextRequestId = 1;

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
}
