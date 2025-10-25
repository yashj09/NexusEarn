// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CrossYieldVault.sol";
import "../src/YieldStrategyManager.sol";

/**
 * @title DeployTestnet
 * @notice Deploy contracts to testnet (Sepolia, Amoy, etc.)
 */
contract DeployTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying from:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy CrossYieldVault
        console.log("\n=== Deploying CrossYieldVault ===");
        CrossYieldVault vault = new CrossYieldVault();
        console.log("CrossYieldVault deployed at:", address(vault));

        // 2. Deploy YieldStrategyManager
        console.log("\n=== Deploying YieldStrategyManager ===");
        YieldStrategyManager manager = new YieldStrategyManager();
        console.log("YieldStrategyManager deployed at:", address(manager));

        // 3. Setup - Sepolia Testnet Token Addresses
        console.log("\n=== Setting up supported tokens ===");

        // Sepolia USDC (example - use actual testnet addresses)
        address USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
        address USDT = 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0;
        address DAI = 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357;

        vault.addSupportedToken(USDC);
        vault.addSupportedToken(USDT);
        vault.addSupportedToken(DAI);
        console.log("Added supported tokens");

        // 4. Setup Protocol Addresses (Aave V3 Sepolia)
        console.log("\n=== Setting up protocols ===");
        address AAVE_POOL_SEPOLIA = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;

        vault.setProtocol(USDC, AAVE_POOL_SEPOLIA);
        vault.setProtocol(USDT, AAVE_POOL_SEPOLIA);
        vault.setProtocol(DAI, AAVE_POOL_SEPOLIA);
        console.log("Set protocol addresses");

        // 5. Configure Strategy Manager
        console.log("\n=== Configuring Strategy Manager ===");
        manager.addSupportedProtocol(AAVE_POOL_SEPOLIA);
        manager.addSupportedToken(USDC);
        manager.addSupportedToken(USDT);
        manager.addSupportedToken(DAI);
        console.log("Configured strategy manager");

        vm.stopBroadcast();

        // 6. Print summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Sepolia Testnet");
        console.log("Deployer:", deployer);
        console.log("CrossYieldVault:", address(vault));
        console.log("YieldStrategyManager:", address(manager));
        console.log("\n=== Next Steps ===");
        console.log("1. Verify contracts on Etherscan");
        console.log("2. Update .env with contract addresses:");
        console.log("   NEXT_PUBLIC_VAULT_CONTRACT_ETH=", address(vault));
        console.log("   NEXT_PUBLIC_STRATEGY_MANAGER_ETH=", address(manager));
        console.log("3. Test deposits and withdrawals");
        console.log("4. Deploy to other testnets (Amoy, Arbitrum Sepolia)");
    }
}
