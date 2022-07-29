// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {Player} from "../Player.sol";

contract MockPlayer is Player {
    constructor(uint64 subscriptionId) Player(subscriptionId) {}

    function mockClaimQuestRewards(uint256 requestId) external {
        require(
            players[msg.sender].characterFullofRewards == true,
            "The Player has to go on a quest first to claim its rewards."
        );
        require(players[msg.sender].timelock < block.timestamp, "The Player is still on a quest.");

        randomIdToRequestor[requestId] = msg.sender;
    }

    function MockRandomnessFulfilment(uint256 requestId, uint256[] memory randomWords) external {
        fulfillRandomWords(requestId, randomWords);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal virtual override {
        address player = randomIdToRequestor[requestId];

        random = (randomWords[0] % 1000) + 1;
        players[player].characterFullofRewards = false;

        if (random >= 800) {
            gameItemsContract.mintVaultParts(player, 5);
        } else if (random < 800 && random >= 600) {
            gameItemsContract.mintVaultParts(player, 4);
        } else if (random < 600 && random >= 400) {
            gameItemsContract.mintVaultParts(player, 3);
        } else if (random < 400 && random >= 200) {
            gameItemsContract.mintVaultParts(player, 2);
        } else if (random < 200) {
            gameItemsContract.mintVaultParts(player, 1);
        }
    }
}
