# Mothora - Chainlink Spring Hackathon 2022

Mothora is born out of our team’s belief that Web3 should become part of everyone’s daily life so that we all share in the rewards of the remarkable breakthroughs happening in this space. We want to abstract DeFi complexity and allow regular people to enjoy its rewards while immersing themselves in an enjoyable video game title.

## Problem

There are some questionable matters about Play-To-Earn (P2E) that we believe are limiting its wider adoption:

- Players often end up making a high effort to grind and taking repetitive actions in a P2E game that they do not really enjoy, in hopes of making more money.
- Most games are attracting players with rewards, not with game immersion. This incentivises the creation of a mercenary player base instead of loyal recurrent players that love the game.
- Most games are single-opponent which limits engagement factors such as world-level strategy/coordination.

## Solution

Mothora is a living breathing world that intends to break away from P2E and shift the emphasis to the ‘Play’ aspect: the so-called Play & Earn. This is achieved by fostering high degrees of coordination between players in an online RPG created in Unreal Engine 5.

The world is governed by the Essence, a natural occurrence that players of different factions must compete for to get the ultimate rewards.

In this **proof of concept**, it is demonstrated the possibiities of next gen game creation with GameFi elements in the modern Unreal Engine 5. A player can connect their wallet by scanning a QR code inside Unreal Engine with Wallet Connect and select their faction & character NFT to play. With these requirements, a player can host a multiplayer session and invite other players to join the same session (custom built plugins).
Players receive Essence tokens that they can stake within a vault. Each faction competes for a share of the vault's rewards by staking tokens in higher quantities/longer periods of time, or by obtaining Essence Shard NFTs from quests, with which they can boost the vault efficiency for their faction.

The game is round based and rounds can last for weeks as players compete for different rewards. The faction with the highest boost wins the season.

## Technologies used

The main tech we used for the game was Unreal Engine 5. Most assets used were created by us except the characters (which are purely for demonstratrion purposes). We also used Houdini, Cinema 4D and Blender to design some of the 3d assets seen in the video.

Regarding the contracts, these were developed in Solidity using hardhat and ethers.js. Tests were provided for the main functions exposed in the proof of concept.

Our contracts use the randomness powered by Chainlink VRF V2 integrated in the player quest rewards module. It is used to help determine the rewards the player gets from succesfuly completing a quest. We believe there is a lot of potential to use chainlink VRF in other areas of the Unreal game that require it.

Lastly, we employed a way to connect the Game Engine and the deployed contracts on Polygon Mumbai. The final result is the player being able to log in into the game using his favourite mobile wallet by simply pointing the camera at a game QR code and connecting using Wallet Connect. We have also developed a C++ Unreal Engine module for players to host multiplayer sessions and for other players to join these sessions, using Steam servers as the backend.

## What's Next

From a roadmap perspective, there are two main game modes we intend to build after this hackathon:

0. Version 0.5 - Add token sinks throught the game, including Crafting System, NFT marketplace and other in game services. Refine the multiplayer module.

1. Version 1.0 - Arena PvP - A closed map where two small teams face off on a short time window battle.

2. Version 2.0 - Battlegrounds PvP - An open map where three teams face off on a weeklong battle with a large number of players on each team that fight continuously across timezones for map control.
