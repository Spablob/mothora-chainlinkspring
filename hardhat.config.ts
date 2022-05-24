import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@openzeppelin/hardhat-upgrades';
import '@primitivefi/hardhat-marmite';
import '@typechain/hardhat';
import * as dotenv from 'dotenv';
import 'hardhat-gas-reporter';
import { HardhatUserConfig, task } from 'hardhat/config';
import 'solidity-coverage';

dotenv.config();
const GWEI = 1000 * 1000 * 1000;

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/' + process.env.INFURA_KEY,
      //url: 'https://eth-rinkeby.alchemyapi.io/v2/' + process.env.ALCHEMY_TOKEN,
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
      },
      gas: 2100000,
      gasPrice: 8000000000,
    },
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/' + process.env.ALCHEMY_TOKEN,
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
      },
      gasPrice: 65 * GWEI, // Para testnets apenas <!>
    },
    kovan: {
      url: 'https://eth-kovan.alchemyapi.io/v2/' + process.env.ALCHEMY_TOKEN,
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
      },
      gasPrice: 65 * GWEI, // Para testnets apenas <!>
    },
    goerli: {
      url: 'https://eth-goerli.alchemyapi.io/v2/' + process.env.ALCHEMY_TOKEN,
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
      },
      gasPrice: 65 * GWEI, // Para testnets apenas <!>
    },
    arbitrumRinkeby: {
      url: 'https://arb-rinkeby.g.alchemy.com/v2/' + process.env.ALCHEMY_TOKEN,
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
      },
    },
    emeraldTestnet: {
      url: 'https://testnet.emerald.oasis.dev',
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
      },
    },
    mumbai: {
      url: 'https://polygon-mumbai.g.alchemy.com/v2/' + process.env.ALCHEMY_MUMBAI_APP,
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
      },
      gasPrice: 1100000000,
    },
    hardhat: {
      // gasPrice: 0,
      // hardfork: "berlin",
      // forking: {
      //   url: "https://mainnet.infura.io/v3/" + process.env.INFURA_TOKEN,
      // },
    },
    hardhatevm: {
      hardfork: 'berlin',
      blockGasLimit: 9500000,
      gas: 9500000,
      gasPrice: 8000000000,
      chainId: 31337,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      url: 'http://localhost:8545',
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.13',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: process.env.REPORT_GAS === 'true',
    excludeContracts: [],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_TOKEN,
  },
  mocha: {
    timeout: 100000,
  },
};

task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

export default config;
