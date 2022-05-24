// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import {GameItems} from "./GameItems.sol";

contract Player is Ownable {
    //===============Storage===============

    enum Faction {
        NONE,
        VAHNU,
        CONGLOMERATE,
        DOC
    }
    uint256[4] public totalFactionMembers;

    uint256 public random;

    struct PlayerData {
        bool characterFullofRewards;
        Faction faction;
        uint256 timelock;
    }

    mapping(address => PlayerData) players;

    GameItems gameItemsContract;

    //===============Chainlink Storage===============
    VRFCoordinatorV2Interface COORDINATOR;
    LinkTokenInterface LINKTOKEN;

    uint64 s_subscriptionId;
    address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;
    address link = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    // The gas lane to use, which specifies the maximum gas price to bump to.
    // For a list of available gas lanes on each network,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;

    // Depends on the number of requested values that you want sent to the
    // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
    // so 100,000 is a safe default for this example contract. Test and adjust
    // this limit based on the network that you select, the size of the request,
    // and the processing of the callback request in the fulfillRandomWords()
    // function.
    uint32 callbackGasLimit = 500000;

    // The default is 3, but you can set this higher.
    uint16 requestConfirmations = 3;

    // Retrieve 1 random values in one request.
    // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
    uint32 maxValues = 2;

    address s_owner;

    mapping(uint256 => uint256) randomIdToRequestor;

    //===============Functions=============
    constructor(uint64 subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {
        // Chainlink VRF
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        LINKTOKEN = LinkTokenInterface(link);
        s_owner = msg.sender;
        s_subscriptionId = subscriptionId;
    }

    function setGameItems(address _gameItemsAddress) external onlyOwner {
        gameItemsContract = GameItems(_gameItemsAddress);
    }

    function joinFaction(uint256 _faction) public {
        require(uint256(players[msg.sender].faction) == 0, "This player already has a faction.");
        require(_faction == 1 || _faction == 2 || _faction == 3, "Please select a valid faction.");
        if (_faction == 1) {
            players[msg.sender].faction = Faction.VAHNU;
            totalFactionMembers[1] += 1;
        } else if (_faction == 2) {
            players[msg.sender].faction = Faction.CONGLOMERATE;
            totalFactionMembers[2] += 1;
        } else if (_faction == 3) {
            players[msg.sender].faction = Faction.DOC;
            totalFactionMembers[3] += 1;
        }
    }

    function defect(uint256 _newFaction) external {
        require(_newFaction == 1 || _newFaction == 2 || _newFaction == 3, "Please select a valid faction.");
        uint256 currentfaction = getFaction(msg.sender);
        totalFactionMembers[currentfaction] -= 1;
        if (_newFaction == 1 && players[msg.sender].faction != Faction.VAHNU) {
            players[msg.sender].faction = Faction.VAHNU;
            totalFactionMembers[1] += 1;
        } else if (_newFaction == 2 && players[msg.sender].faction != Faction.CONGLOMERATE) {
            players[msg.sender].faction = Faction.CONGLOMERATE;
            totalFactionMembers[2] += 1;
        } else if (_newFaction == 3 && players[msg.sender].faction != Faction.DOC) {
            players[msg.sender].faction = Faction.DOC;
            totalFactionMembers[3] += 1;
        }
        // TODO burn all vault part NFTs this wallet has on it.
        // Joao: instead of burning they could be given away to their current faction
    }

    function mintCharacter() public {
        require(players[msg.sender].faction != Faction.NONE, "This Player has no faction yet.");
        require(
            gameItemsContract.balanceOf(msg.sender, getFaction(msg.sender)) == 0,
            "The Player can only mint 1 Character of each type."
        );
        gameItemsContract.mintCharacter(msg.sender, getFaction(msg.sender));
    }

    function joinAndMint(uint256 _faction) external {
        joinFaction(_faction);
        mintCharacter();
    }

    function goOnQuest() external {
        require(
            gameItemsContract.balanceOf(msg.sender, getFaction(msg.sender)) == 1,
            "The Player does not own a character of this faction."
        );
        require(players[msg.sender].timelock < block.timestamp, "The Player is already on a quest.");
        require(players[msg.sender].characterFullofRewards == false, "The Player has not claimed its rewards.");
        players[msg.sender].timelock = block.timestamp + 60;
        players[msg.sender].characterFullofRewards = true;
    }

    function claimQuestRewards() external returns (uint256 s_requestId) {
        require(
            players[msg.sender].characterFullofRewards == true,
            "The Player has to go on a quest first to claim its rewards."
        );
        require(players[msg.sender].timelock < block.timestamp, "The Player is still on a quest.");

        s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            maxValues
        );
        randomIdToRequestor[s_requestId] = msg.sender;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal virtual override {
        address player = randomIdToRequestor[requestId];

        random = (randomWords[0] % 1000) + 1;

        if (random >= 800) {
            gameItemsContract.mintVaultParts(msg.sender, 5);
        } else if (random < 800 && random >= 600) {
            gameItemsContract.mintVaultParts(msg.sender, 4);
        } else if (random < 600 && random >= 400) {
            gameItemsContract.mintVaultParts(msg.sender, 3);
        } else if (random < 400 && random >= 200) {
            gameItemsContract.mintVaultParts(msg.sender, 2);
        } else if (random < 200) {
            gameItemsContract.mintVaultParts(msg.sender, 1);
        }

        players[msg.sender].characterFullofRewards = false;
    }

    function getFaction(address _recipient) public view returns (uint256) {
        return uint256(players[_recipient].faction);
    }

    function getQuestIsLocked(address _recipient) external view returns (bool) {
        if (players[_recipient].timelock > block.timestamp) {
            return true;
        }
        return false;
    }

    function getHasRewards(address _recipient) external view returns (bool) {
        return players[_recipient].characterFullofRewards;
    }
}
