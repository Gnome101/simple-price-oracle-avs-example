import hre from "hardhat";
import axios from "axios";
import {
  generateParameters,
  encrypt,
  decrypt,
  combinePublicKeys,
} from "threshold-elgamal";
import dotenv from "dotenv";
dotenv.config();
// const { encryptShowRandom } = require("./proof");

import { modPow, modInv } from "bigint-mod-arith";

async function main() {
  // Set up provider, wallet, and contract instance
  const accounts = await hre.ethers.getSigners();
  const provider = new hre.ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const secretVoting = await hre.ethers.getContractAt(
    "SecretVoting",
    process.env.CONTRACT_ADDRESS,
    wallet
  );

  // Retrieve and combine public keys from the contract
  let keys = await secretVoting.getKeys();
  keys = keys.map((x) => BigInt(x.toString()));
  const commonPublicKey = combinePublicKeys(keys);
  const { prime, generator } = generateParameters();
  // Encrypt the secret value
  const secret = 10;

  const { encryptedMessage, randomNumber } = encryptShowRandom(
    secret,
    commonPublicKey,
    prime,
    generator
  );
  console.log("Encrypted message:", encryptedMessage);

  // Convert the encryption components to hexadecimal strings
  const c1Bytes = hre.ethers.toBeHex(encryptedMessage.c1.toString());
  const c2Bytes = hre.ethers.toBeHex(encryptedMessage.c2.toString());
  const abiCoder = new hre.ethers.AbiCoder();

  // Encode the two byte arrays as a single bytes payload
  const combinedBytes = abiCoder.encode(
    ["bytes", "bytes"],
    [c1Bytes.toString(), c2Bytes.toString()]
  );

  // Send a POST request with the ciphertext to the specified endpoint
  try {
    const response = await axios.post("http://localhost:4003/task/execute", {
      ciphertext: combinedBytes.toString(),
      randomNumber: randomNumber.toString(),
    });
    console.log("Response from server:", response.data);
  } catch (error) {
    console.error("Error sending POST request:", error);
  }
}
function encryptShowRandom(secret, publicKey, prime, generator) {
  if (secret >= Number(prime)) {
    throw new Error("Message is too large for direct encryption");
  }
  const randomNumber = getRandomBigIntegerInRange(1n, prime - 1n);

  const c1 = modPow(generator, randomNumber, prime);
  const messageBigInt = BigInt(secret);
  const c2 = (modPow(publicKey, randomNumber, prime) * messageBigInt) % prime;

  return { encryptedMessage: { c1, c2 }, randomNumber };
}
function getRandomBigIntegerInRange(min, max) {
  const range = max - min + 1n;
  // Determine the number of bits needed for the range
  const bitsNeeded = range.toString(2).length;
  // Generate a random bigint within the calculated bits
  let num = randomBigint(bitsNeeded);
  // Adjust the number to the range
  num = num % range;
  // Add the minimum to align with the desired range
  return min + num;
}

function randomBigint(bits) {
  // Ensure bits is positive and greater than zero to avoid infinite loop
  if (bits <= 0) {
    throw new RangeError("Bit length must be greater than 0");
  }

  // Calculate the number of hexadecimal digits needed
  const hexDigits = Math.ceil(bits / 4);

  // The first hex digit must be between 8 and F (inclusive) to ensure the MSB is set
  const firstDigit = (8 + Math.floor(Math.random() * 8)).toString(16);

  // Generate the remaining hex digits randomly
  const remainingDigits = Array(hexDigits - 1)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

  // Combine, convert to BigInt, and return
  return BigInt(`0x${firstDigit}${remainingDigits}`);
}
main().catch((error) => {
  console.error("Error in main:", error);
  process.exitCode = 1;
});
