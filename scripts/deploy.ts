import { ContractTransaction, Contract } from 'ethers';
import { ethers } from 'hardhat';
import {
  Player__factory as PlayerFactory,
  GameItems__factory as GameItemsFactory,
  MothoraVault__factory as MothoraVaultFactory,
  Essence__factory as EssenceFactory,
  GameItems,
  Player,
  MothoraVault,
  Essence,
} from '../typechain-types';
import { wallets } from './walletsToAirdrop';

const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

export const deployContract = async <ContractType extends Contract>(instance: ContractType): Promise<ContractType> => {
  await waitForTx(instance.deployTransaction);
  return instance;
};

async function main() {
  let player: Player;
  let gameItems: GameItems;
  let vault: MothoraVault;
  let token: Essence;
  const signer = (await ethers.getSigners())[1];
  const subscriptionId = 371;
  console.log({ Account: signer.address });

  // Deploy Player Contract

  player = await deployContract(await new PlayerFactory(signer).deploy(subscriptionId));

  console.log({ 'Player contract deployed to': player.address });

  // Deploy GameItems Contract
  gameItems = await deployContract(
    await new GameItemsFactory(signer).deploy(
      'https://bafybeiex2io5lawckt4bgjjyhmvfy7yk72s4fmhuxj2rgehwzaa6lderkm.ipfs.dweb.link/',
      player.address
    )
  );
  console.log({ 'GameItems contract deployed to': gameItems.address });
  await waitForTx(await player.connect(signer).setGameItems(gameItems.address));

  // Deploy Essence Contract
  token = await deployContract(await new EssenceFactory(signer).deploy());

  console.log({ 'Essence contract deployed to': token.address });

  // Deploy MothoraVault Contract
  vault = await deployContract(
    await new MothoraVaultFactory(signer).deploy(token.address, gameItems.address, player.address, 300000, 10)
  );
  console.log({ 'MothoraVault contract deployed to': vault.address });

  await Promise.all(
    wallets.map(async (wallet) => {
      await waitForTx(await token.connect(signer).transfer(wallet, '5000'));
    })
  );

  console.log('Tokens airdroped');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
