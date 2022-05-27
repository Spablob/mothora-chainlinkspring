## Inspiration

**Mothora** is born out of our team’s belief that Web3 should become part of everyone’s daily life so that we all share in the rewards of the remarkable breakthroughs happening in this space. We want to abstract DeFi complexity and allow regular people to enjoy its rewards while immersing themselves in an online RPG game. 

## Overview

**Problem**

There are some questionable matters about Play-To-Earn (P2E) that we believe are limiting its wider adoption:

- Players often end up making a high effort to grind and taking repetitive actions in a P2E game that they do not really enjoy, in hopes of making more money.
- Most games are attracting players with rewards, not with game immersion. This incentivizes the creation of a mercenary player base instead of loyal recurrent players that love the game.
- Most games are single-opponent which limits engagement factors such as world-level strategy/coordination.

**Solution**

Mothora is a living breathing world that intends to break away from P2E and shift the emphasis to the ‘Play’ aspect: the so-called Play & Earn. This is achieved by fostering high degrees of coordination between players in an online RPG created in Unreal Engine 5.

The world is governed by the Essence, a natural occurrence that players of different factions must compete for to get the ultimate rewards.

This is a game of intellect, strategy, and social coordination, with a constant meta tension shaping the actions of the players. Players succeed by:

- Thinking ahead and coordinating
- Cooperating with battle companions and guild members
- Understanding well the intricacies of the combat mechanics
- Being knowledgeable in the core economic elements

Mothora follows a model that incentivizes honing skills in battle and the employment of different world-level strategies to maximize in-game rewards. This has the additional benefit of boosting the social component of the game, the degree of interdependence of players, and the sense of belonging to a real evolving community.

## What we built

There are 5 main components to the development of the Proof-of-Concept:

1) **Smart contracts** - Main Interactions:

- Join a Faction and mint the Character
- Stake, Unstake, Reward calculation, and Claiming rewards
- Allows going on a quest, which rewards users with NFTs that increase token rewards

2) **Chainlink Implementation** The game requires access to true randomness to effectively work. The contracts are requesting random numbers from Chainlink.

3) **Unreal Engine environment** - Built the 3D world where the player makes its in-game actions

4) **Unreal Engine multiplayer** - Allows for multiple characters on the same server in real-time

5) **Unreal Engine <-> Web 3 Integration** - Built the connection between the Smart contracts and the Unreal Engine Environment that allows the player to trigger blockchain transactions from within the game window


## What's next for Mothora

It is our goal to build the full-fledged Mothora game. 

From a roadmap perspective, there are two main game modes we intend to build:

1) Version 1.0 - Arena - A closed map where two small teams face off in a MOBA-style game on a short time window battle.

2) Version 2.0 - Battlegrounds - An open map where three teams face off on a weeklong battle with a large number of players on each team that fight continuously across timezones for map control.
