import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { GameItems } from '../typechain-types';
import { MockPlayer } from '../typechain-types';
import { MothoraVault } from '../typechain-types';
import { Essence } from '../typechain-types';
import { BigNumber } from 'bignumber.js';

describe('MockInteractions', async () => {
  let player: MockPlayer;
  let gameitems: GameItems;
  let vault: MothoraVault;
  let token: Essence;
  let accounts: SignerWithAddress[];
  const subscriptionId = 4948;

  before(async () => {
    accounts = await ethers.getSigners();

    // Deploy Player Contract
    const PlayerContractFactory = await ethers.getContractFactory('MockPlayer');
    player = await PlayerContractFactory.deploy(subscriptionId);
    await player.deployed();
    console.log({ 'Player contract deployed to': player.address });

    // Deploy GameItems Contract
    const GameItemsFactory = await ethers.getContractFactory('GameItems');
    gameitems = await GameItemsFactory.deploy(
      'https://bafybeiex2io5lawckt4bgjjyhmvfy7yk72s4fmhuxj2rgehwzaa6lderkm.ipfs.dweb.link/',
      player.address
    );
    await gameitems.deployed();
    console.log({ 'GameItems contract deployed to': gameitems.address });
    await player.setGameItems(gameitems.address);

    // Deploy Essence Contract
    const EssenceFactory = await ethers.getContractFactory('Essence');
    token = await EssenceFactory.deploy();
    await token.deployed();
    console.log({ 'Essence contract deployed to': token.address });

    // Deploy MothoraVault Contract
    const MothoraVaultFactory = await ethers.getContractFactory('MothoraVault');

    vault = await MothoraVaultFactory.deploy(token.address, gameitems.address, player.address, 15, 600);
    await vault.deployed();
    console.log({ 'MothoraVault contract deployed to': vault.address });
  });

  describe('Player joins a faction, defects, mints Character, goes on a quest and claims its rewards', async () => {
    it('It reverts if the player selects and invalid faction', async () => {
      await expect(player.connect(accounts[0]).joinFaction(4)).to.be.revertedWith('Please select a valid faction.');
    });

    it('Player joins the Vahnu.', async () => {
      await player.connect(accounts[0]).joinFaction(1);
      expect(await player.connect(accounts[0]).getFaction(accounts[0].address)).to.be.equal(1);
      expect(await player.totalFactionMembers(1)).to.be.equal(1);
    });

    it('It reverts if the player already has a faction', async () => {
      await expect(player.connect(accounts[0]).joinFaction(2)).to.be.revertedWith('This player already has a faction.');
    });

    it('Player defects to the Conglomerate', async () => {
      await player.connect(accounts[0]).defect(2);
      expect(await player.connect(accounts[0]).getFaction(accounts[0].address)).to.be.equal(2);
      expect(await player.totalFactionMembers(2)).to.be.equal(1);
      expect(await player.totalFactionMembers(1)).to.be.equal(0);
    });

    it('It reverts if player has no faction', async () => {
      await expect(player.connect(accounts[1]).mintCharacter()).to.be.revertedWith('This Player has no faction yet.');
    });

    it('Player mints a character', async () => {
      await player.connect(accounts[0]).mintCharacter();
      expect(await gameitems.balanceOf(accounts[0].address, 2)).to.be.equal(1);
    });

    it('It reverts if tries to mint twice.', async () => {
      await expect(player.connect(accounts[0]).mintCharacter()).to.be.revertedWith(
        'The Player can only mint 1 Character of each type.'
      );
    });

    it('It reverts if player tries to mint directly on GameItems Contract.', async () => {
      await expect(gameitems.connect(accounts[0]).mintCharacter(accounts[0].address, 2)).to.be.reverted;
    });

    it('It reverts if player does not have a character of its faction.', async () => {
      await expect(player.connect(accounts[1]).goOnQuest()).to.be.revertedWith(
        'The Player does not own a character of this faction.'
      );
    });

    it('Player goes on a Quest', async () => {
      await player.connect(accounts[0]).goOnQuest();
    });

    it('It reverts if player is already on a quest', async () => {
      await expect(player.connect(accounts[0]).goOnQuest()).to.be.revertedWith('The Player is already on a quest.');
    });

    it('It if lock time has passed but Player has not claimed its rewards', async () => {
      await ethers.provider.send('evm_increaseTime', [601]); // add 601 seconds
      await expect(player.connect(accounts[0]).goOnQuest()).to.be.revertedWith(
        'The Player has not claimed its rewards.'
      );
    });

    it('It reverts if Player tries to claim rewards without doing the quest', async () => {
      const requestId = 1;
      await expect(player.connect(accounts[1]).mockClaimQuestRewards(requestId)).to.be.revertedWith(
        'The Player has to go on a quest first to claim its rewards.'
      );
    });

    it('It reverts if Player tries to claim rewards while doing the quest', async () => {
      await player.connect(accounts[1]).joinFaction(3);
      await player.connect(accounts[1]).mintCharacter();
      await player.connect(accounts[1]).goOnQuest();
      const requestId = 1;

      await expect(player.connect(accounts[1]).mockClaimQuestRewards(requestId)).to.be.revertedWith(
        'The Player is still on a quest.'
      );
    });

    it('The Player Claims the rewards', async () => {
      const requestId = 1;
      const randomWords = [300];

      await player.connect(accounts[0]).mockClaimQuestRewards(requestId);
      await player.connect(accounts[0]).MockRandomnessFulfilment(requestId, randomWords);

      expect(await gameitems.balanceOf(accounts[0].address, 0)).to.be.least(0);
    });
  });

  describe('Player tries interact directly with GameItems.sol but is successfully blocked.', async () => {
    it('It reverts on minting a character or vaultpart', async () => {
      await expect(gameitems.connect(accounts[0]).mintCharacter(accounts[0].address, 0)).to.be.revertedWith(
        'Not player contract address.'
      );
      await expect(gameitems.connect(accounts[0]).mintVaultParts(accounts[0].address, 0)).to.be.revertedWith(
        'Not player contract address.'
      );
    });

    it('It reverts on setting a token  if not the owner', async () => {
      await expect(gameitems.connect(accounts[1]).setTokenUri(0, '')).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it('It reverts on re-setting a token uri by the owner', async () => {
      await expect(gameitems.connect(accounts[0]).setTokenUri(0, '')).to.be.revertedWith('Cannot set uri twice.');
    });
  });

  describe('Pulling Funds', async () => {
    it('It reverts pulling funds if not the owner', async () => {
      await expect(gameitems.connect(accounts[0]).setTokenUri(0, '')).to.be.revertedWith('Cannot set uri twice.');
    });

    it('Owner wallet sends tokens to Mothora Vault', async () => {
      await token.connect(accounts[0]).approve(accounts[0].address, ethers.constants.MaxUint256);
      await token.transferFrom(accounts[0].address, vault.address, 1000);
      expect(await token.balanceOf(vault.address)).to.be.equal(1000);
    });
  });

  describe('Player stake/unstakes tokens', async () => {
    it('It reverts if amount staked is <0', async () => {
      await expect(vault.connect(accounts[2]).stakeTokens(0)).to.be.revertedWith('Amount must be more than 0.');
      await expect(vault.connect(accounts[2]).stakeTokens(-1)).to.be.reverted;
    });

    it('It reverts if player tries to stake without having Essence Tokens', async () => {
      await token.connect(accounts[2]).approve(vault.address, ethers.constants.MaxUint256);
      await expect(vault.connect(accounts[2]).stakeTokens(1000)).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      );
    });

    it('Player buys Essence Tokens (simulation) and stakes them successfully', async () => {
      await token.transferFrom(accounts[0].address, accounts[2].address, 1000);
      expect(await token.connect(accounts[2]).balanceOf(accounts[2].address)).to.be.equal(1000);
      expect(await vault.connect(accounts[2]).playerIds(accounts[2].address)).to.be.equal(0);
      await vault.connect(accounts[2]).stakeTokens(1000);
      expect(await vault.connect(accounts[2]).stakedESSBalance(accounts[2].address)).to.be.equal(1000);
      expect(await vault.connect(accounts[2]).playerIds(accounts[2].address)).to.be.equal(1);
      expect(await token.connect(accounts[2]).balanceOf(accounts[2].address)).to.be.equal(0);
    });

    it('It reverts if amount staked is <=0', async () => {
      await expect(vault.connect(accounts[2]).unstakeTokens(0)).to.be.revertedWith('Amount must be more than 0.');
      await expect(vault.connect(accounts[2]).unstakeTokens(-1)).to.be.reverted;
    });

    it('It reverts if player tries to unstake without having Essence tokens staked', async () => {
      await expect(vault.connect(accounts[1]).unstakeTokens(1000)).to.be.revertedWith('Staking balance cannot be 0');
    });

    it('It reverts if player chooses an amount higher than its staked balance', async () => {
      await expect(vault.connect(accounts[2]).unstakeTokens(10000)).to.be.revertedWith(
        'Cannot unstake more than your staked balance'
      );
    });

    it('Player successfully unstakes', async () => {
      await vault.connect(accounts[2]).unstakeTokens(1000);
      expect(await vault.stakedESSBalance(accounts[2].address)).to.be.equal(0);
    });
  });

  describe('Contribute Vault Parts', async () => {
    it('It reverts if amount <0', async () => {
      await expect(vault.connect(accounts[0]).contributeVaultParts(0)).to.be.revertedWith('Amount must be more than 0');
      await expect(vault.connect(accounts[0]).contributeVaultParts(-1)).to.be.reverted;
    });

    it('It reverts if the amount is higher than players VP Balance', async () => {
      expect(await gameitems.connect(accounts[0]).balanceOf(accounts[0].address, 0)).to.be.least(0);
      await expect(vault.connect(accounts[0]).contributeVaultParts(6)).to.be.revertedWith(
        'The Player does not have enough Vault Parts'
      );
    });

    it('It successfully contributes vault parts', async () => {
      gameitems.connect(accounts[0]).setApprovalForAll(vault.address, true);
      await vault.connect(accounts[0]).contributeVaultParts(1);
      expect(await vault.connect(accounts[0]).playerStakedPartsBalance(accounts[0].address)).to.be.equal(1);
      expect(await vault.connect(accounts[0]).factionPartsBalance(2)).to.be.equal(1);
    });
  });

  describe('Vault distributes the rewards', async () => {
    it('It reverts if there are no staked tokens', async () => {
      await expect(vault.connect(accounts[0]).distributeRewards()).to.be.revertedWith('There are no tokens staked');
    });

    it('It distributes the epoch rewards according to excel example and players claim', async () => {
      // Setting up the player quests and vault parts contribution
      await player.connect(accounts[5]).joinFaction(1);
      await player.connect(accounts[5]).mintCharacter();
      await player.connect(accounts[5]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[5]).mockClaimQuestRewards(2);
      await player.connect(accounts[5]).MockRandomnessFulfilment(2, [550]);

      await player.connect(accounts[5]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[5]).mockClaimQuestRewards(3);
      await player.connect(accounts[5]).MockRandomnessFulfilment(3, [222]);
      await player.connect(accounts[5]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[5]).mockClaimQuestRewards(4);
      await player.connect(accounts[5]).MockRandomnessFulfilment(4, [20]);
      await player.connect(accounts[5]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[5]).mockClaimQuestRewards(5);
      await player.connect(accounts[5]).MockRandomnessFulfilment(5, [632]);
      await player.connect(accounts[5]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[5]).mockClaimQuestRewards(6);
      await player.connect(accounts[5]).MockRandomnessFulfilment(6, [132]);
      await gameitems.connect(accounts[5]).setApprovalForAll(vault.address, true);
      await vault.connect(accounts[5]).contributeVaultParts(await gameitems.balanceOf(accounts[5].address, 0));

      await player.connect(accounts[7]).joinFaction(2);
      await player.connect(accounts[7]).mintCharacter();
      await player.connect(accounts[7]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[7]).mockClaimQuestRewards(7);
      await player.connect(accounts[7]).MockRandomnessFulfilment(7, [1]);
      await player.connect(accounts[7]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[7]).mockClaimQuestRewards(8);
      await player.connect(accounts[7]).MockRandomnessFulfilment(8, [444]);
      await gameitems.connect(accounts[7]).setApprovalForAll(vault.address, true);
      await vault.connect(accounts[7]).contributeVaultParts(await gameitems.balanceOf(accounts[7].address, 0));

      await player.connect(accounts[8]).joinFaction(2);
      await player.connect(accounts[8]).mintCharacter();
      await player.connect(accounts[8]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[8]).mockClaimQuestRewards(9);
      await player.connect(accounts[8]).MockRandomnessFulfilment(9, [121]);
      await player.connect(accounts[8]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[8]).mockClaimQuestRewards(10);
      await player.connect(accounts[8]).MockRandomnessFulfilment(10, [55]);
      await gameitems.connect(accounts[8]).setApprovalForAll(vault.address, true);
      await vault.connect(accounts[8]).contributeVaultParts(await gameitems.balanceOf(accounts[8].address, 0));

      await player.connect(accounts[9]).joinFaction(2);
      await player.connect(accounts[9]).mintCharacter();
      await player.connect(accounts[9]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[9]).mockClaimQuestRewards(11);
      await player.connect(accounts[8]).MockRandomnessFulfilment(11, [876]);
      await player.connect(accounts[9]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[9]).mockClaimQuestRewards(12);
      await player.connect(accounts[9]).MockRandomnessFulfilment(12, [422]);
      await player.connect(accounts[9]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[9]).mockClaimQuestRewards(13);
      await player.connect(accounts[9]).MockRandomnessFulfilment(13, [999]);
      await player.connect(accounts[9]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[9]).mockClaimQuestRewards(14);
      await player.connect(accounts[9]).MockRandomnessFulfilment(14, [135]);
      await player.connect(accounts[9]).goOnQuest();
      await ethers.provider.send('evm_increaseTime', [61]);
      await player.connect(accounts[9]).mockClaimQuestRewards(15);
      await player.connect(accounts[9]).MockRandomnessFulfilment(15, [753]);
      await gameitems.connect(accounts[9]).setApprovalForAll(vault.address, true);
      await vault.connect(accounts[9]).contributeVaultParts(await gameitems.balanceOf(accounts[9].address, 0));

      // Staking and distributing

      await token.transferFrom(
        accounts[0].address,
        accounts[6].address,
        ethers.BigNumber.from('10000000000000000000000')
      );
      await token.connect(accounts[6]).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(accounts[6]).stakeTokens(ethers.BigNumber.from('10000000000000000000000'));

      await ethers.provider.send('evm_increaseTime', [60 * 35]);

      await token.transferFrom(
        accounts[0].address,
        accounts[9].address,
        ethers.BigNumber.from('10000000000000000000000')
      );
      await token.connect(accounts[9]).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(accounts[9]).stakeTokens(ethers.BigNumber.from('10000000000000000000000'));

      await ethers.provider.send('evm_increaseTime', [61 * 14]);

      await token.transferFrom(
        accounts[0].address,
        accounts[5].address,
        ethers.BigNumber.from('1000000000000000000000')
      );
      await token.connect(accounts[5]).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(accounts[5]).stakeTokens(ethers.BigNumber.from('1000000000000000000000'));

      await ethers.provider.send('evm_increaseTime', [61 * 11]);

      await token.transferFrom(accounts[0].address, accounts[7].address, ethers.BigNumber.from('50000000000000000000'));
      await token.connect(accounts[7]).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(accounts[7]).stakeTokens(ethers.BigNumber.from('50000000000000000000'));

      await token.transferFrom(accounts[0].address, accounts[8].address, ethers.BigNumber.from('50000000000000000000'));
      await token.connect(accounts[8]).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(accounts[8]).stakeTokens(ethers.BigNumber.from('50000000000000000000'));

      await vault.connect(accounts[0]).distributeRewards();

      // Claiming the rewards
      await vault.connect(accounts[5]).claimEpochRewards(false);
      await vault.connect(accounts[6]).claimEpochRewards(false);
      await vault.connect(accounts[7]).claimEpochRewards(false);
      await vault.connect(accounts[8]).claimEpochRewards(false);
      await vault.connect(accounts[9]).claimEpochRewards(false);

      // console logs
      console.log({ epochRewards: await vault.epochRewards() });
      console.log({ epochDuration: await vault.epochDuration() });
      console.log({ totalESSstaked: await vault.totalStakedBalance() });
      console.log({ maxedfactor1: await vault.maxedFactor1() });
      console.log({ maxedfactor2: await vault.maxedFactor2() });
      console.log({ maxedfactor3: await vault.maxedFactor3() });

      console.log({ factor1: await vault.factor1() });
      console.log({ factor2: await vault.factor2() });
      console.log({ factor3: await vault.factor3() });

      console.log({ 'rewardsToClaim 5': await vault.connect(accounts[5]).RewardsBalance(accounts[5].address) });
      console.log({ 'rewardsToClaim 6': await vault.connect(accounts[6]).RewardsBalance(accounts[6].address) });
      console.log({ 'rewardsToClaim 7': await vault.connect(accounts[7]).RewardsBalance(accounts[7].address) });
      console.log({ 'rewardsToClaim 8': await vault.connect(accounts[8]).RewardsBalance(accounts[8].address) });
      console.log({ 'rewardsToClaim 9': await vault.connect(accounts[9]).RewardsBalance(accounts[9].address) });

      console.log({ 'playerBal 5': await token.connect(accounts[5]).balanceOf(accounts[5].address) });
      console.log({ 'playerBal 6': await token.connect(accounts[6]).balanceOf(accounts[6].address) });
      console.log({ 'playerBal 7': await token.connect(accounts[7]).balanceOf(accounts[7].address) });
      console.log({ 'playerBal 8': await token.connect(accounts[8]).balanceOf(accounts[8].address) });
      console.log({ 'playerBal 9': await token.connect(accounts[9]).balanceOf(accounts[9].address) });
    });

    it('It reverts if the Owner tries to distribute more than once in the same epoch', async () => {
      await expect(vault.connect(accounts[0]).distributeRewards()).to.be.revertedWith(
        'The player has already claimed in this epoch'
      );
    });

    it('Owner distributes rewards again on the next epoch', async () => {
      await ethers.provider.send('evm_increaseTime', [601]); // add 601 seconds
      await vault.connect(accounts[0]).distributeRewards();

      console.log({ epochRewards: await vault.epochRewards() });
      console.log({ maxedfactor1: await vault.maxedFactor1() });
      console.log({ factor1: await vault.factor1() });
      console.log({ 'rewardsToClaim 5': await vault.connect(accounts[5]).RewardsBalance(accounts[5].address) });
      console.log({ 'rewardsToClaim 6': await vault.connect(accounts[6]).RewardsBalance(accounts[6].address) });
      console.log({ 'rewardsToClaim 7': await vault.connect(accounts[7]).RewardsBalance(accounts[7].address) });
      console.log({ 'rewardsToClaim 8': await vault.connect(accounts[8]).RewardsBalance(accounts[8].address) });
      console.log({ 'rewardsToClaim 9': await vault.connect(accounts[9]).RewardsBalance(accounts[9].address) });
    });
  });
});
