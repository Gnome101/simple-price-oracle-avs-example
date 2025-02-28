// operator-service.js
const { ethers } = require("ethers");
const {
  generateKeys,
  combinePublicKeys,
  createDecryptionShare,
  combineDecryptionShares,
  thresholdDecrypt,
  serializeEncryptedMessage,
  deserializeEncryptedMessage,
} = require("threshold-elgamal");

class OperatorService {
  constructor(config) {
    this.providerUrl = config.rpc;
    this.privateKey = config.privateKey;
    this.votingMarketAddress = config.votingMarketAddress;
    this.votingMarketAbi = config.votingMarketAbi;

    this.provider = new ethers.JsonRpcProvider(this.providerUrl);
    this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    this.contract = new ethers.Contract(
      this.votingMarketAddress,
      this.votingMarketAbi,
      this.wallet
    );

    // Store participant keys for markets
    this.participantKeys = {};
  }

  // Generate keys for a specific market
  async generateMarketKeys(marketId, participantIndex, totalParticipants) {
    // Generate key pair for threshold encryption
    const keyShare = generateKeys(participantIndex, totalParticipants);

    // Store keys for this market
    this.participantKeys[marketId] = {
      privateKey: keyShare.privateKey,
      publicKey: keyShare.publicKey,
      participantIndex,
    };

    // Serialize the public key for on-chain storage
    const serializedPublicKey = keyShare.publicKey.toString();

    // Register with the contract
    const tx = await this.contract.registerOperatorKey(
      marketId,
      serializedPublicKey
    );
    await tx.wait();

    console.log(`Registered public key for market ${marketId}`);
    return serializedPublicKey;
  }

  // Calculate combined public key for a market
  async getCombinedPublicKey(marketId) {
    // Get all operators for this market
    const operators = await this.contract.getMarketOperators(marketId);

    // Get their public keys
    const publicKeyPromises = operators.map((operator) =>
      this.contract.getOperatorPublicKey(marketId, operator)
    );

    const serializedPublicKeys = await Promise.all(publicKeyPromises);

    // Convert to BigInt
    const publicKeys = serializedPublicKeys.map((key) => BigInt(key));

    // Combine the public keys
    const combinedKey = combinePublicKeys(publicKeys);

    return combinedKey.toString();
  }

  // Activate market with combined public key
  async activateMarket(marketId) {
    const combinedKey = await this.getCombinedPublicKey(marketId);
    const tx = await this.contract.activateMarket(marketId, combinedKey);
    await tx.wait();
    console.log(
      `Activated market ${marketId} with combined public key: ${combinedKey}`
    );
  }

  // Create a decryption share for tallying
  async createDecryptionShare(marketId, encryptedVotes) {
    const marketKeys = this.participantKeys[marketId];
    if (!marketKeys) {
      throw new Error(`No keys found for market ${marketId}`);
    }

    // Create a decryption share for each option
    const decryptionShares = {};

    for (const [optionIndex, encryptedVote] of Object.entries(encryptedVotes)) {
      const deserialized = deserializeEncryptedMessage(encryptedVote);
      const share = createDecryptionShare(deserialized, marketKeys.privateKey);
      decryptionShares[optionIndex] = share.toString();
    }

    return decryptionShares;
  }

  // Start tallying process
  async startTallying(marketId) {
    const tx = await this.contract.startTallying(marketId);
    await tx.wait();
    console.log(`Started tallying for market ${marketId}`);
  }

  // Submit final results
  async submitResults(marketId, results, resultIpfsHash) {
    const tx = await this.contract.resolveMarket(marketId, resultIpfsHash);
    await tx.wait();
    console.log(`Resolved market ${marketId} with results:`, results);
  }
}

module.exports = OperatorService;
