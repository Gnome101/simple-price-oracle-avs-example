import hre from "hardhat";
import { generateParameters, encrypt, decrypt } from "threshold-elgamal";

async function main() {
  const accounts = await hre.ethers.getSigners();
  const { publicKey, privateKey, prime, generator } = generateParameters();
  const secret = 859;
  const encryptedMessage = encrypt(secret, publicKey, prime, generator);
  const decryptedMessage = decrypt(encryptedMessage, prime, privateKey);
  console.log(decryptedMessage);
  for (const account of accounts) {
    console.log(account.address);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
