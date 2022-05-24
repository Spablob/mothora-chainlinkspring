import { ContractTransaction, Contract } from 'ethers';
import { ethers } from 'hardhat';
import { MothoraVault } from '../typechain-types';
import { MothoraVault__factory as MothoraVaultFactory } from '../typechain-types';

const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

export const deployContract = async <ContractType extends Contract>(instance: ContractType): Promise<ContractType> => {
  await waitForTx(instance.deployTransaction);
  return instance;
};

async function main() {
  let vault: MothoraVault;
  const signer = (await ethers.getSigners())[0];
  console.log({ Account: signer.address });

  const vaultFactory = await ethers.getContractFactory('MothoraVault');

  vault = await vaultFactory.attach('0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9');

  // Deploy Player Contract
  await waitForTx(await vault.connect(signer).distributeRewards());
  console.log('rewards');
  let stakedBalance = await vault.totalStakedBalance();
  let epochRewards = await vault.epochRewards();
  let epochDuration = await vault.epochDuration();
  let lastDistributionTime = await vault.lastDistributionTime();
  let epochRewardsPercentage = await vault.epochRewardsPercentage();
  let epochStartTime = await vault.epochStartTime();
  let lastEpochTime = await vault.lastEpochTime();
  let playerId = await vault.playerId();
  let numerator = ethers.BigNumber.from('100000000000000000000000').mul('300000').mul(600);
  let denominator = ethers.BigNumber.from('31536000').mul('100');

  let divider = await vault.divider(numerator, denominator, 0);
  console.log({
    stakedBalance,
    epochRewards,
    epochDuration,
    lastDistributionTime,
    epochRewardsPercentage,
    epochStartTime,
    lastEpochTime,
    playerId,
    divider,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
