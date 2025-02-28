// test/SecretVoting.test.js

import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import {
  encrypt,
  generateKeys,
  combinePublicKeys,
  createDecryptionShare,
  combineDecryptionShares,
  thresholdDecrypt,
  multiplyEncryptedValues,
  serializeEncryptedMessage,
} from "threshold-elgamal";

describe("SecretVoting", function () {
  let SecretVoting, secretVoting;
  let owner, voter1, voter2;
  const numOptions = 2;
  let prime, generator, publicKey, privateKey;
  let commonPublicKey;
  let participant1Keys;
  let participant2Keys;
  let participant3Keys;
  before(async function () {
    // Generate encryption parameters using threshold-elgamal.
    // These parameters (prime, generator, publicKey, privateKey) will be used for off-chain encryption/decryption.
    const threshold = 3; // A scenario for 3 participants with a threshold of 3

    // Each participant generates their public key share and private key individually
    participant1Keys = generateKeys(1, threshold);
    participant2Keys = generateKeys(2, threshold);
    participant3Keys = generateKeys(3, threshold);

    [owner, voter1, voter2] = await ethers.getSigners();

    // Deploy the SecretVoting contract with the prime as the modulus and numOptions.
    SecretVoting = await ethers.getContractFactory("SecretVoting");
    secretVoting = await SecretVoting.deploy();
    console.log(participant1Keys.publicKey);
  });
  it("can make a market", async function () {
    await secretVoting.MakeMarket("fun", 10, 100);

    const market = await secretVoting.market();
    expect(market.description).to.equal("fun");
  });
  it("should allow a voter to cast a vote and aggregate the encryption correctly", async function () {
    await secretVoting.MakeMarket("fun", 10, 100);

    await secretVoting.submitKey(participant1Keys.publicKey.toString());
    await secretVoting.submitKey(participant2Keys.publicKey.toString());
    await secretVoting.submitKey(participant3Keys.publicKey.toString());
    console.log("hi");
    const secret = 859;
    // Combine the public keys to form a single public key
    console.log([
      participant1Keys.publicKey,
      participant2Keys.publicKey,
      participant3Keys.publicKey,
    ]);
    let keys = await secretVoting.getKeys();
    keys = keys.map((x) => BigInt(x.toString()));
    commonPublicKey = combinePublicKeys(keys);
    const encryptedMessage = encrypt(secret, commonPublicKey);
    console.log("A", encryptedMessage.c1.toString());
    const c1Bytes = ethers.toBeHex(encryptedMessage.c1.toString());
    const c2Bytes = ethers.toBeHex(encryptedMessage.c2.toString());
    const idiot = new ethers.AbiCoder();
    const combinedBytes = idiot.encode(
      ["bytes", "bytes"],
      [c1Bytes.toString(), c2Bytes.toString()]
    );
    await secretVoting.modifyVote(combinedBytes.toString());

    const market = await secretVoting.market();
    const c1 = ethers.toBigInt(market.c1.toString());
    const c2 = ethers.toBigInt(market.c2.toString());
    // console.log(ethers);
    // console.log(c1, c2);
    const combinedEncryptedMessage = {
      c1,
      c2,
    };

    const share1 = createDecryptionShare(
      combinedEncryptedMessage,
      participant1Keys.privateKey
    );
    await secretVoting.submitPartialDecript(share1.toString());
    const share2 = createDecryptionShare(
      encryptedMessage,
      participant2Keys.privateKey
    );
    await secretVoting.submitPartialDecript(share2.toString());
    const share3 = createDecryptionShare(
      encryptedMessage,
      participant3Keys.privateKey
    );
    await secretVoting.submitPartialDecript(share3.toString());
    let shares = await secretVoting.getDecryptionShares();
    console.log(shares.map((x) => BigInt(x.toString())));
    shares = shares.map((x) => BigInt(x.toString()));
    console.log(typeof shares[0]);
    const combinedDecryptionShares = combineDecryptionShares(shares);

    // Decrypting the message using the combined decryption shares
    const thresholdDecryptedMessage = thresholdDecrypt(
      encryptedMessage,
      combinedDecryptionShares
    );
    console.log("Amount", thresholdDecryptedMessage);
    // const decryptedMessage = thresholdDecrypt(
    //   combinedEncryptedMessage,
    //   prime, // modulus
    //   privateKey,
    // const decryptionShare1 = createDecryptionShare(
    //   1,
    //   privateKey,
    //   publicKey,
    //   prime
    // );
  });
});
