"use strict";
const { Router } = require("express");
const CustomError = require("./utils/validateError");
const CustomResponse = require("./utils/validateResponse");
const oracleService = require("./oracle.service");
const dalService = require("./dal.service");
const router = Router();
const ethers = require("ethers");
const { abi } = require("../abi");
const e = require("express");
require("dotenv").config();
const { generateEncryptionOfOneProof, encryptShowRandom } = require("./proof");

router.post("/execute", async (req, res) => {
  console.log("Executing task");

  try {
    var taskDefinitionId = Number(req.body.taskDefinitionId) || 0;
    console.log(`taskDefinitionId: ${taskDefinitionId}`);
    // console.log(req.body.ciphertext);
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
      const tx = await secretVoting.chooseWinner(res);
      await tx.wait();

      const cid = await dalService.publishJSONToIpfs({ result: res });
      await dalService.sendTask(cid, "done", taskDefinitionId);
      return res.status(200).send(
        new CustomResponse(
          {
            proofOfTask: cid,
            data: "done",
            taskDefinitionId: taskDefinitionId,
          },
          "Task executed successfully"
        )
      );
    }
    let keys = await secretVoting.getKeys();
    keys = keys.map((x) => BigInt(x.toString()));

    const abiCoder = new ethers.AbiCoder();

    // Decode the two byte arrays as a single bytes payload
    let userSubmission = abiCoder.decode(
      ["bytes", "bytes"],
      req.body.ciphertext
    );
    const randomNumber = ethers.toBigInt(req.body.randomNumber);
    userSubmission = userSubmission.map((x) => BigInt(x.toString()));
    userSubmission = {
      c1: userSubmission[0],
      c2: userSubmission[1],
    };
    const market = await secretVoting.market();
    console.log(market);
    let currentVote;
    if (market.c1.toString() != "0x") {
      const c1 = ethers.toBigInt(market.c1.toString());
      const c2 = ethers.toBigInt(market.c2.toString());
      // console.log(ethers);
      // console.log(c1, c2);
      currentVote = {
        c1,
        c2,
      };
    } else {
      currentVote = {
        c1: "0x",
        c2: "0x",
      };
    }

    let encryptedMessage;
    // import("threshold-elgamal")
    //   .then((elGamal) => {
    //     const commonPublicKey = elGamal.combinePublicKeys(keys);
    //     encryptedMessage = elGamal.encrypt(10, commonPublicKey);
    //   })
    //   .catch(console.error);

    // const c1Bytes = ethers.toBeHex(encryptedMessage.c1.toString());
    // const c2Bytes = ethers.toBeHex(encryptedMessage.c2.toString());
    // const idiot = new ethers.AbiCoder();
    // const combinedBytes = idiot.encode(
    //   ["bytes", "bytes"],
    //   [c1Bytes.toString(), c2Bytes.toString()]
    // );
    const { cipherProduct, proof } = await encryptAndEncode(
      keys,
      currentVote,
      userSubmission,
      randomNumber
    );
    const c1Bytes = ethers.toBeHex(cipherProduct.c1.toString());
    const c2Bytes = ethers.toBeHex(cipherProduct.c2.toString());
    console.log("CP", cipherProduct);
    // Assuming you want to encode both parts as bytes:
    const combinedBytes = abiCoder.encode(
      ["bytes", "bytes"],
      [c1Bytes, c2Bytes]
    );
    const tx = await secretVoting.modifyVote(combinedBytes.toString());
    await tx.wait();

    // const result = await oracleService.getPrice("ETHUSDT");
    // result.price = req.body.fakePrice || result.price;
    const aggregation = {
      c1: currentVote.c1.toString(),
      c2: currentVote.c2.toString(),
      c3: userSubmission.c1.toString(),
      c4: userSubmission.c2.toString(),
      T1: proof.T1.toString(),
      T2: proof.T2.toString(),
      c: proof.c.toString(),
      s: proof.s.toString(),
    };
    console.log(aggregation);
    const cid = await dalService.publishJSONToIpfs(aggregation);
    await dalService.sendTask(cid, userSubmission.toString(), taskDefinitionId);
    return res.status(200).send(
      new CustomResponse(
        {
          proofOfTask: cid,
          data: userSubmission.toString(),
          taskDefinitionId: taskDefinitionId,
        },
        "Task executed successfully"
      )
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send(new CustomError("Something went wrong", {}));
  }
});
async function encryptAndEncode(
  keys,
  currentVote,
  userSubmission,
  randomNumberUser
) {
  try {
    const elGamal = await import("threshold-elgamal");
    console.log("ENC", currentVote.c1);
    if (currentVote.c1 == "0x") {
      //No votes yet, set as 1
      const commonPublicKey = elGamal.combinePublicKeys(keys);
      const { publicKey, privateKey, prime, generator } =
        elGamal.generateParameters();

      const { encryptedMessage, randomNumber } = encryptShowRandom(
        1,
        commonPublicKey,
        prime,
        generator
      );
      console.log("E Encrypted message:", encryptedMessage);
      console.log("E User submission:", userSubmission);
      let cipherProduct = elGamal.multiplyEncryptedValues(
        encryptedMessage,
        userSubmission
      );

      const proof = generateEncryptionOfOneProof(
        userSubmission,
        cipherProduct,
        randomNumber,
        generator,
        commonPublicKey,
        prime
      );
      console.log(proof);
      // console.log(cipherProduct);
      return { cipherProduct, proof };
    } else {
      const commonPublicKey = elGamal.combinePublicKeys(keys);
      const { publicKey, privateKey, prime, generator } =
        elGamal.generateParameters();
      let cipherProduct = elGamal.multiplyEncryptedValues(
        currentVote,
        userSubmission
      );
      const proof = generateEncryptionOfOneProof(
        userSubmission,
        cipherProduct,
        randomNumberUser,
        generator,
        commonPublicKey,
        prime
      );
      return { cipherProduct, proof };
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
module.exports = router;
