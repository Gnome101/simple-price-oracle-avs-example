import hre from "hardhat";
import {
  generateParameters,
  encrypt,
  combineDecryptionShares,
  thresholdDecrypt,
  decrypt,
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
  const market = await secretVoting.market();
  const c1 = ethers.toBigInt(market.c1.toString());
  const c2 = ethers.toBigInt(market.c2.toString());
  // console.log(ethers);
  // console.log(c1, c2);
  const combinedEncryptedMessage = {
    c1,
    c2,
  };
  console.log(combinedEncryptedMessage);
  let shares = await secretVoting.getDecryptionShares();
  shares = shares.map((x) => BigInt(x.toString()));
  console.log(shares);
  const combinedDecryptionShares = combineDecryptionShares(shares);

  // Decrypting the message using the combined decryption shares
  const thresholdDecryptedMessage = thresholdDecrypt(
    combinedEncryptedMessage,
    combinedDecryptionShares
  );
  console.log("Decrypted Result", thresholdDecryptedMessage);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
