// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
// Import your contract (update the path as needed)
import "../src/SecretVoting.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_HEX");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy your contract
        SecretVoting secretVoting = new SecretVoting /* constructor args if needed */();

        vm.stopBroadcast();

        // Call verification after deployment
        verifyContract(address(secretVoting));
    }

    function verifyContract(address contractAddress) internal {
        // Convert the address to a string
        string memory addrStr = addressToString(contractAddress);
        string memory etherscanApiKey = vm.envString("ETHERSCAN_API_KEY");

        // Build the command array for the FFI call
        string[] memory cmd = new string[](9);
        cmd[0] = "forge";
        cmd[1] = "verify-contract";
        cmd[2] = "--chain-id";
        cmd[3] = "84532"; // Base Sepolia chain ID
        cmd[4] = addrStr;
        cmd[5] = "src/SecretVoting.sol:SecretVoting"; // Update to your contract's path and name
        cmd[6] = "--etherscan-api-key";
        cmd[7] = etherscanApiKey;
        cmd[8] = "--watch";

        // Execute the command via FFI
        vm.ffi(cmd);
    }

    /// @notice Converts an address to its hexadecimal string representation.
    function addressToString(
        address _addr
    ) internal pure returns (string memory) {
        bytes20 value = bytes20(_addr);
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }
}
