// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title MockVRFCoordinatorV2Plus
 * @notice Mock VRF Coordinator for testing
 */
contract MockVRFCoordinatorV2Plus {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) public requestIdToConsumer;

    event RandomWordsRequested(uint256 requestId, address consumer);

    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata req
    ) external returns (uint256 requestId) {
        requestId = nextRequestId;
        nextRequestId++;

        requestIdToConsumer[requestId] = msg.sender;

        emit RandomWordsRequested(requestId, msg.sender);

        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, address consumer) external {
        address actualConsumer = requestIdToConsumer[requestId];
        require(actualConsumer != address(0), "Invalid requestId");

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, requestId)));

        // Call rawFulfillRandomWords which is the external function in VRFConsumerBaseV2Plus
        (bool success, ) = actualConsumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );

        require(success, "Fulfillment failed");
    }
}
