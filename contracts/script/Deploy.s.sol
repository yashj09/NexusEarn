// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CrossYieldVault.sol";
import "../src/YieldStrategyManager.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy CrossYieldVault
        CrossYieldVault vault = new CrossYieldVault();
        console.log("CrossYieldVault deployed at:", address(vault));

        // Deploy YieldStrategyManager
        YieldStrategyManager manager = new YieldStrategyManager();
        console.log("YieldStrategyManager deployed at:", address(manager));

        // Setup supported tokens (Ethereum Mainnet addresses)
        address USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        address USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
        address DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

        vault.addSupportedToken(USDC);
        vault.addSupportedToken(USDT);
        vault.addSupportedToken(DAI);

        // Setup Aave V3 protocol (Ethereum)
        address AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
        vault.setProtocol(USDC, AAVE_POOL);
        vault.setProtocol(USDT, AAVE_POOL);
        vault.setProtocol(DAI, AAVE_POOL);

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("Next steps:");
        console.log("1. Verify contracts on Etherscan");
        console.log("2. Update frontend with contract addresses");
        console.log("3. Test deposits and withdrawals");
    }
}
