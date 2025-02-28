require("dotenv").config();
const axios = require("axios");

var ipfsHost = "";
const ethers = require("ethers");

function init() {
  ipfsHost = process.env.IPFS_HOST;
}

async function getIPfsTask(cid) {
  const { data } = await axios.get(ipfsHost + cid);
  let userSubmission, userVote;
  if (data.c1 == "0x") {
    userVote = {
      c1: "0x",
      c2: "0x",
    };
  } else {
    userVote = {
      c1: ethers.toBigInt(data.c1),
      c2: ethers.toBigInt(data.c2),
    };
  }
  if (data.c3 == "0x") {
    userSubmission = {
      c1: "0x",
      c2: "0x",
    };
  } else {
    userSubmission = {
      c1: ethers.toBigInt(data.c3),
      c2: ethers.toBigInt(data.c4),
    };
  }
  return {
    userVote,
    userSubmission,
    proof: {
      T1: ethers.toBigInt(data.T1),
      T2: ethers.toBigInt(data.T2),
      c: ethers.toBigInt(data.c),
      s: ethers.toBigInt(data.s),
    },
  };
}

module.exports = {
  init,
  getIPfsTask,
};
