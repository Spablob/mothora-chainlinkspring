import { ContractTransaction, Contract } from 'ethers';
import { ethers } from 'hardhat';
import { MothoraVault__factory as MothoraVaultFactory, MothoraVault } from '../typechain-types';

const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

export const deployContract = async <ContractType extends Contract>(instance: ContractType): Promise<ContractType> => {
  await waitForTx(instance.deployTransaction);
  return instance;
};

async function main() {
  let vault: MothoraVault;
  const signer = (await ethers.getSigners())[0];
  console.log({ Account: signer.address });

  // Deploy MothoraVault Contract
  vault = await deployContract(
    await new MothoraVaultFactory(signer).deploy(
      '0x920B18Cd1913EDA0B0b1D96D6E67C077acC30ddC',
      '0x347cB30791AA4B18EaD167f8181005cBBB6081e1',
      '0x7126019a24083daDFEa72A091903cFf991bC01E6',
      300000,
      10
    )
  );
  console.log({ 'MothoraVault contract deployed to': vault.address });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
