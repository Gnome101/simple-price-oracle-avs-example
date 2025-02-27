// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.20;

/*______     __      __                              __      __ 
 /      \   /  |    /  |                            /  |    /  |
/$$$$$$  | _$$ |_   $$ |____    ______   _______   _$$ |_   $$/   _______ 
$$ |  $$ |/ $$   |  $$      \  /      \ /       \ / $$   |  /  | /       |
$$ |  $$ |$$$$$$/   $$$$$$$  |/$$$$$$  |$$$$$$$  |$$$$$$/   $$ |/$$$$$$$/ 
$$ |  $$ |  $$ | __ $$ |  $$ |$$    $$ |$$ |  $$ |  $$ | __ $$ |$$ |
$$ \__$$ |  $$ |/  |$$ |  $$ |$$$$$$$$/ $$ |  $$ |  $$ |/  |$$ |$$ \_____ 
$$    $$/   $$  $$/ $$ |  $$ |$$       |$$ |  $$ |  $$  $$/ $$ |$$       |
 $$$$$$/     $$$$/  $$/   $$/  $$$$$$$/ $$/   $$/    $$$$/  $$/  $$$$$$$/
*/
/**
 * @author Othentic Labs LTD.
 * @notice Terms of Service: https://www.othentic.xyz/terms-of-service
 */

import "./IAvsLogic.sol";
import "./IAttestationCenter.sol";

/**
 * @title VotingMarket
 * @notice A contract for creating and resolving voting markets using threshold ElGamal encryption
 */
contract VotingMarket is IAvsLogic {
    // Reference to attestation center for operator management
    address public attestationCenter;

    enum MarketState {
        Created,
        KeyRegistration,
        Active,
        Tallying,
        Resolved
    }

    struct Market {
        uint256 id;
        string description;
        uint256 creationTime;
        uint256 keyRegistrationEndTime;
        uint256 votingEndTime;
        MarketState state;
        string[] options;
        string encryptedVotesIpfsHash; // IPFS hash containing all encrypted votes
        string resultIpfsHash; // IPFS hash containing final results
        mapping(address => string) operatorPublicKeys; // Serialized public keys from operators
        address[] operators; // List of operators who submitted keys
    }

    // Market ID counter
    uint256 private nextMarketId = 1;

    // Mapping from market ID to Market struct
    mapping(uint256 => Market) public markets;

    // Events for tracking market lifecycle
    event MarketCreated(
        uint256 indexed marketId,
        string description,
        uint256 keyRegistrationEndTime,
        uint256 votingEndTime
    );
    event OperatorKeyRegistered(
        uint256 indexed marketId,
        address operator,
        string publicKey
    );
    event MarketStateChanged(uint256 indexed marketId, MarketState newState);
    event VotesSubmitted(
        uint256 indexed marketId,
        string encryptedVotesIpfsHash
    );
    event MarketResolved(uint256 indexed marketId, string resultIpfsHash);

    /**
     * @notice Constructor sets the attestation center address
     * @param _attestationCenter Address of the attestation center contract
     */
    constructor(address _attestationCenter) {
        attestationCenter = _attestationCenter;
    }

    /**
     * @notice Create a new voting market
     * @param _description Description of the market
     * @param _keyRegistrationDuration Duration of key registration phase in seconds
     * @param _votingDuration Duration of voting phase in seconds
     * @param _options Array of voting options
     * @return marketId The ID of the newly created market
     */
    function createMarket(
        string calldata _description,
        uint256 _keyRegistrationDuration,
        uint256 _votingDuration,
        string[] calldata _options
    ) external returns (uint256) {
        require(_options.length >= 2, "Must have at least 2 options");
        require(
            _keyRegistrationDuration > 0,
            "Key registration duration must be > 0"
        );
        require(_votingDuration > 0, "Voting duration must be > 0");

        uint256 marketId = nextMarketId++;
        Market storage market = markets[marketId];

        market.id = marketId;
        market.description = _description;
        market.creationTime = block.timestamp;
        market.keyRegistrationEndTime =
            block.timestamp +
            _keyRegistrationDuration;
        market.votingEndTime = market.keyRegistrationEndTime + _votingDuration;
        market.state = MarketState.KeyRegistration;
        market.options = _options;

        emit MarketCreated(
            marketId,
            _description,
            market.keyRegistrationEndTime,
            market.votingEndTime
        );
        return marketId;
    }

    /**
     * @notice Register an operator's public key for a market
     * @param _marketId The market ID
     * @param _publicKey The operator's serialized ElGamal public key
     */
    function registerOperatorKey(
        uint256 _marketId,
        string calldata _publicKey
    ) external {
        Market storage market = markets[_marketId];

        require(market.id > 0, "Market does not exist");
        require(
            market.state == MarketState.KeyRegistration,
            "Not in key registration phase"
        );
        require(
            block.timestamp < market.keyRegistrationEndTime,
            "Key registration period ended"
        );
        require(
            bytes(market.operatorPublicKeys[msg.sender]).length == 0,
            "Operator already registered"
        );

        // Store the operator's public key
        market.operatorPublicKeys[msg.sender] = _publicKey;
        market.operators.push(msg.sender);

        emit OperatorKeyRegistered(_marketId, msg.sender, _publicKey);
    }

    /**
     * @notice Transition market to active state after key registration period
     * @param _marketId The market ID
     */
    function activateMarket(uint256 _marketId) external {
        Market storage market = markets[_marketId];

        require(market.id > 0, "Market does not exist");
        require(
            market.state == MarketState.KeyRegistration,
            "Not in key registration phase"
        );
        require(
            block.timestamp >= market.keyRegistrationEndTime,
            "Key registration period not ended"
        );
        require(market.operators.length > 0, "No operators registered");

        market.state = MarketState.Active;

        emit MarketStateChanged(_marketId, MarketState.Active);
    }

    /**
     * @notice Submit encrypted votes for a market
     * @param _marketId The market ID
     * @param _encryptedVotesIpfsHash IPFS hash pointing to the encrypted votes
     */
    function submitVotes(
        uint256 _marketId,
        string calldata _encryptedVotesIpfsHash
    ) external {
        Market storage market = markets[_marketId];

        require(market.id > 0, "Market does not exist");
        require(market.state == MarketState.Active, "Market not active");
        require(block.timestamp < market.votingEndTime, "Voting period ended");

        market.encryptedVotesIpfsHash = _encryptedVotesIpfsHash;

        emit VotesSubmitted(_marketId, _encryptedVotesIpfsHash);
    }

    /**
     * @notice Transition market to tallying state after voting period
     * @param _marketId The market ID
     */
    function startTallying(uint256 _marketId) external {
        Market storage market = markets[_marketId];

        require(market.id > 0, "Market does not exist");
        require(market.state == MarketState.Active, "Not in active phase");
        require(
            block.timestamp >= market.votingEndTime,
            "Voting period not ended"
        );
        require(
            bytes(market.encryptedVotesIpfsHash).length > 0,
            "No votes submitted"
        );

        market.state = MarketState.Tallying;

        emit MarketStateChanged(_marketId, MarketState.Tallying);
    }

    /**
     * @notice Resolve the market with final tally results
     * @param _marketId The market ID
     * @param _resultIpfsHash IPFS hash pointing to the final tally results
     */
    function resolveMarket(
        uint256 _marketId,
        string calldata _resultIpfsHash
    ) external {
        Market storage market = markets[_marketId];

        require(market.id > 0, "Market does not exist");
        require(market.state == MarketState.Tallying, "Not in tallying phase");

        market.resultIpfsHash = _resultIpfsHash;
        market.state = MarketState.Resolved;

        emit MarketResolved(_marketId, _resultIpfsHash);
        emit MarketStateChanged(_marketId, MarketState.Resolved);
    }

    /**
     * @notice Get the list of operators for a market
     * @param _marketId The market ID
     * @return addresses Array of operator addresses
     */
    function getMarketOperators(
        uint256 _marketId
    ) external view returns (address[] memory) {
        return markets[_marketId].operators;
    }

    /**
     * @notice Get an operator's public key for a market
     * @param _marketId The market ID
     * @param _operator The operator's address
     * @return publicKey The operator's public key
     */
    function getOperatorPublicKey(
        uint256 _marketId,
        address _operator
    ) external view returns (string memory) {
        return markets[_marketId].operatorPublicKeys[_operator];
    }

    /**
     * @notice Get market options
     * @param _marketId The market ID
     * @return options Array of market options
     */
    function getMarketOptions(
        uint256 _marketId
    ) external view returns (string[] memory) {
        return markets[_marketId].options;
    }

    /**
     * @notice Implementation for IAvsLogic interface
     */
    function afterTaskSubmission(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        bool _isApproved,
        bytes calldata _tpSignature,
        uint256[2] calldata _taSignature,
        uint256[] calldata _operatorIds
    ) external {
        require(msg.sender == attestationCenter, "Not allowed");
        // This can be used to process task submissions and update state
    }

    /**
     * @notice Implementation for IAvsLogic interface
     */
    function beforeTaskSubmission(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        bool _isApproved,
        bytes calldata _tpSignature,
        uint256[2] calldata _taSignature,
        uint256[] calldata _operatorIds
    ) external {
        // This can be used for validation before task submission
    }
}
