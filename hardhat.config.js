require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
const {
  PRIVATE_KEY,
  BASE_SEPOLIA_RPC_URL,
  BASE_RPC_URL,
  BASESCAN_API_KEY,
} = process.env;

const accounts = PRIVATE_KEY && PRIVATE_KEY.length === 66 ? [PRIVATE_KEY] : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      // runs=1 + viaIR brings the deployed bytecode under the 24576-byte
      // Spurious Dragon limit. This contract is deployed once per founder
      // and called many times, but the binary has to fit first.
      optimizer: { enabled: true, runs: 1 },
      viaIR: true,
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
      // Long blocks aren't needed for this contract; 72h challenge windows
      // are handled by ethers' `time.increase` in tests instead.
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts,
    },
    base: {
      url: BASE_RPC_URL || "https://mainnet.base.org",
      chainId: 8453,
      accounts,
    },
  },

  etherscan: {
    apiKey: {
      baseSepolia: BASESCAN_API_KEY || "placeholder",
      base: BASESCAN_API_KEY || "placeholder",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout: 60000,
  },
};
