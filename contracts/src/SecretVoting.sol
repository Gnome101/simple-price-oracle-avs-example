// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IAvsLogic} from "./IAvsLogic.sol";
import {IAttestationCenter} from "./IAttestationCenter.sol";
struct Market {
    string description;
    uint256 keyRegistrationExpiration;
    uint256 expiration;
    bytes c1;
    bytes c2;
    string[] publicKeys;
    string[] partialDecripts;
    bool isFinalized;
    bool winner;
}

contract SecretVoting is IAvsLogic {
    Market public market;

    function getMarket() public view returns (Market memory) {
        return market;
    }

    function MakeMarket(
        string calldata marketDescription,
        uint256 registrationDelay,
        uint256 marketLength
    ) public {
        market = Market({
            description: marketDescription,
            keyRegistrationExpiration: block.timestamp + registrationDelay,
            expiration: block.timestamp + registrationDelay + marketLength,
            c1: "",
            c2: "",
            publicKeys: new string[](0),
            partialDecripts: new string[](0),
            isFinalized: false,
            winner: false
        });
    }

    function submitKey(string calldata publicKey) public {
        // require(
        //     block.timestamp < market.keyRegistrationExpiration,
        //     "Key registration period has expired"
        // );
        market.publicKeys.push(publicKey);
    }

    function getKeys() public view returns (string[] memory) {
        return market.publicKeys;
    }

    function submitPartialDecript(string calldata partialDecript) public {
        // require(block.timestamp > market.expiration, "Market has not ended");
        market.partialDecripts.push(partialDecript);
    }

    function modifyVote(bytes calldata newVote) public {
        (market.c1, market.c2) = abi.decode(newVote, (bytes, bytes));
    }

    function getDecryptionShares() public view returns (string[] memory) {
        return market.partialDecripts;
    }

    function chooseWinner(bool winner) public {
        require(market.isFinalized == false, "Market is already finalized");
        require(market.partialDecripts.length > 0, "No decryption shares");
        market.winner = winner;
        market.isFinalized = true;
    }

    function afterTaskSubmission(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        bool _isApproved,
        bytes calldata _tpSignature,
        uint256[2] calldata _taSignature,
        uint256[] calldata _operatorIds
    ) external {
        // (market.c1, market.c2) = abi.decode(_taskInfo.data, (bytes, bytes));
    }

    function beforeTaskSubmission(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        bool _isApproved,
        bytes calldata _tpSignature,
        uint256[2] calldata _taSignature,
        uint256[] calldata _operatorIds
    ) external {}
}
