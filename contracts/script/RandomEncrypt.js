import hre from "hardhat";
import { generateParameters, encrypt, decrypt } from "threshold-elgamal";
import { CONTRACT_ADDRESS } from "../address";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const accounts = await hre.ethers.getSigners();
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const secretVoting = await hre.ethers.getContractAt(
    "SecretVoting",
    "0x4005bDd73fBe00435859850893d851b9F4B92167",
    wallet
  );
  console.log(myContract);
  const { publicKey, privateKey, prime, generator } = generateParameters(2048);
  const market = await myContract.market();
  const c1 = ethers.toBigInt(market.c1.toString());
  const c2 = ethers.toBigInt(market.c2.toString());
  // console.log(ethers);
  // console.log(c1, c2);
  const combinedEncryptedMessage = {
    c1,
    c2,
  };
  const share = createDecryptionShare(
    combinedEncryptedMessage,
    participant1Keys.privateKey
  );
  console.log("Sending Partial Decrypyion Share...");
  let tx = await secretVoting.submitPartialDecript(share.toString());

  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
