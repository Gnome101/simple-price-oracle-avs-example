import hre from "hardhat";
import { generateParameters, encrypt, decrypt } from "threshold-elgamal";
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
  console.log("Making a market...");
  let tx = await secretVoting.MakeMarket("fun", 25, 100);
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
