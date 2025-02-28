// scripts/deploy_and_verify.js
import dotenv from "dotenv";
dotenv.config();
async function main() {
  // Get the deployer account from the Hardhat environment.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get the contract factory for your contract.
  const ContractFactory = await ethers.getContractFactory("SecretVoting");

  // Deploy the contract (pass constructor arguments if required).
  const contract =
    await ContractFactory.deploy(/* constructor arguments if any */);

  console.log("SecretVoting deployed to:", contract.target);

  // Optional: Wait for a bit to ensure that the deployment is fully recognized by the network.
  console.log("Waiting for 5 seconds for block confirmations...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Verify the contract on Etherscan using Hardhat's verification task.
  try {
    await run("verify:verify", {
      address: contract.target,
      constructorArguments: [
        /* constructor arguments here if any */
      ],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

// Execute the script, handling errors appropriately.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
