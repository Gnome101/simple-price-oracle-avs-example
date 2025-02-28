require("dotenv").config();
const dalService = require("./dal.service");
const oracleService = require("./oracle.service");
const ethers = require("ethers");
const { abi } = require("../abi");
require("dotenv").config();
const { verifyEncryptionOfOneProof } = require("./proof");

async function validate(proofOfTask, data) {
  try {
    console.log("Starting Validation");
    const taskResult = await dalService.getIPfsTask(proofOfTask);
    //In this case task result is the userSubmission
    // console.log(proofOfTask);
    // console.log(data);
    // console.log(taskResult);
    const userSubmission = taskResult.userSubmission;
    const userVote = taskResult.userVote;
    const proof = taskResult.proof;
    // var data = await oracleService.getPrice("ETHUSDT");
    const url = process.env.BASE_RPC_URL;
    const provider = new ethers.JsonRpcProvider(url);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const secretVoting = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      abi,
      wallet
    );
    let shares = await secretVoting.getDecryptionShares();
    shares = shares.map((x) => BigInt(x.toString()));
    console.log("Task Result", taskResult);
    console.log("Shares", shares);
    if (shares.length > 0) {
      const market = await secretVoting.market();
      console.log(market);
      let combinedEncryptedMessage;
      if (market.c1.toString() != "0x") {
        const c1 = ethers.toBigInt(market.c1.toString());
        const c2 = ethers.toBigInt(market.c2.toString());
        // console.log(ethers);
        // console.log(c1, c2);
        combinedEncryptedMessage = {
          c1,
          c2,
        };
      } else {
        combinedEncryptedMessage = {
          c1: "0x",
          c2: "0x",
        };
      }
      //This market should be over
      //Now we decrypt the result and send it to the contract
      const thresholdDecryptedMessage = await decrypt(
        shares,
        combinedEncryptedMessage
      );
      // const combinedDecryptionShares = combineDecryptionShares(shares);
      // const thresholdDecryptedMessage = thresholdDecrypt(
      //   combinedEncryptedMessage,
      //   combinedDecryptionShares
      // );
      console.log(thresholdDecryptedMessage);
      const x = thresholdDecryptedMessage / 2;
      const y = thresholdDecryptedMessage / 3;
      const res = x < y;
      return taskResult.result == res;
    }
    let keys = await secretVoting.getKeys();
    keys = keys.map((x) => BigInt(x.toString()));
    const abiCoder = new ethers.AbiCoder();
    const market = await secretVoting.market();
    const c1 = ethers.toBigInt(market.c1.toString());
    const c2 = ethers.toBigInt(market.c2.toString());
    let currentVote = {
      c1,
      c2,
    };
    const isApproved = await encryptAndEncode(
      keys,
      userVote,
      currentVote,
      userSubmission,
      proof
    );

    // console.log(c1.toString());
    // console.log("----------------------");
    // console.log(cipherProduct.c1.toString());

    return isApproved;
  } catch (err) {
    console.error(err?.message);
    return false;
  }
}

async function encryptAndEncode(
  keys,
  prevCurrentVote,
  currentVote,
  userSubmission,
  proof
) {
  try {
    const elGamal = await import("threshold-elgamal");
    const { prime, generator } = elGamal.generateParameters();
    const commonPublicKey = elGamal.combinePublicKeys(keys);
    const res = verifyEncryptionOfOneProof(
      userSubmission,
      currentVote,
      proof,
      generator,
      commonPublicKey,
      prime
    );
    return res;
    if (prevCurrentVote.c1 == "0x") {
      //No votes yet, set as 1
      const { prime, generator } = elGamal.generateParameters();
      const commonPublicKey = elGamal.combinePublicKeys(keys);

      console.log("V User submission:", userSubmission);
      console.log("V Current Vote:", currentVote);
      const res = verifyEncryptionOfOneProof(
        userSubmission,
        currentVote,
        proof,
        generator,
        commonPublicKey,
        prime
      );
      console.log("The FINAL TRUTH", res);
      // console.log(combinedBytes);
      return res;
    } else {
      const commonPublicKey = elGamal.combinePublicKeys(keys);

      combinedBytes = elGamal.multiplyEncryptedValues(
        currentVote,
        userSubmission
      );
      return combinedBytes;
    }

    return combinedBytes;
  } catch (error) {
    console.error(error);
  }
}
async function decrypt(shares, combinedEncryptedMessage) {
  try {
    const elGamal = await import("threshold-elgamal");
    const combinedDecryptionShares = elGamal.combineDecryptionShares(shares);
    const thresholdDecryptedMessage = elGamal.thresholdDecrypt(
      combinedEncryptedMessage,
      combinedDecryptionShares
    );
    return thresholdDecryptedMessage;
  } catch (error) {
    console.error(error);
  }
}
module.exports = {
  validate,
};
