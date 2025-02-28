import hre from "hardhat";
import {
  generateParameters,
  encrypt,
  decrypt,
  combinePublicKeys,
} from "threshold-elgamal";
import dotenv from "dotenv";
dotenv.config();
async function main() {
  const accounts = await hre.ethers.getSigners();
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const secretVoting = await hre.ethers.getContractAt(
    "SecretVoting",
    process.env.CONTRACT_ADDRESS,
    wallet
  );
  let keys = await secretVoting.getKeys();
  keys = keys.map((x) => BigInt(x.toString()));
  const commonPublicKey = combinePublicKeys(keys);
  let secret = 10;
  const encryptedMessage = encrypt(secret, commonPublicKey);
  console.log(encryptedMessage);
  const c1Bytes = ethers.toBeHex(encryptedMessage.c1.toString());
  const c2Bytes = ethers.toBeHex(encryptedMessage.c2.toString());
  console.log(c1Bytes, c2Bytes);
  const idiot = new ethers.AbiCoder();
  const combinedBytes = idiot.encode(
    ["bytes", "bytes"],
    [c1Bytes.toString(), c2Bytes.toString()]
  );
  const tx = await secretVoting.modifyVote(combinedBytes.toString());
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
