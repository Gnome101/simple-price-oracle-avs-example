require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-foundry");
/** @type import('hardhat/config').HardhatUserConfig */

require("dotenv").config();
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: process.env.BASE_RPC_URL,
      },
    },
    basesep: {
      url: process.env.BASE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
