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
  const signer = (await ethers.getSigners())[1];
  console.log({ Account: signer.address });

  const vaultFactory = await ethers.getContractFactory('MothoraVault');
  vault = await vaultFactory.connect(signer).attach('0x0a9d696b831361ae7725F71164EB0Ae6cF98Aa9F');

  // Deploy Player Contract
  //await waitForTx(await vault.connect(signer).distributeRewards());

  async function execute1(delay: number) {
    console.log('#### Distributing Rewards ####');
    await waitForTx(await vault.connect(signer).distributeRewards());
    setTimeout(() => execute1(delay), delay);
  }
  execute1(11000);
}

main();
