# Makefile for contract deployment

.PHONY: install build test deploy-testnet deploy-mainnet verify clean

# Load environment variables
include .env
export

# Install dependencies
install:
	forge install

# Build contracts
build:
	forge build

# Run tests
test:
	forge test -vvv

# Run tests with gas report
test-gas:
	forge test --gas-report

# Deploy to Sepolia testnet
deploy-sepolia:
	forge script script/DeployTestnet.s.sol:DeployTestnet \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		-vvvv

# Deploy to Polygon Amoy testnet
deploy-amoy:
	forge script script/DeployTestnet.s.sol:DeployTestnet \
		--rpc-url https://rpc-amoy.polygon.technology \
		--broadcast \
		--verify \
		--etherscan-api-key $(POLYGONSCAN_API_KEY) \
		-vvvv

# Deploy to Arbitrum Sepolia
deploy-arb-sepolia:
	forge script script/DeployTestnet.s.sol:DeployTestnet \
		--rpc-url https://sepolia-rollup.arbitrum.io/rpc \
		--broadcast \
		--verify \
		--etherscan-api-key $(ARBISCAN_API_KEY) \
		-vvvv

# Verify contract on Etherscan
verify:
	forge verify-contract \
		--chain-id 11155111 \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		$(CONTRACT_ADDRESS) \
		src/CrossYieldVault.sol:CrossYieldVault

# Clean build artifacts
clean:
	forge clean

# Format code
format:
	forge fmt

# Local node for testing
anvil:
	anvil

# Deploy to local anvil
deploy-local:
	forge script script/DeployTestnet.s.sol:DeployTestnet \
		--rpc-url http://localhost:8545 \
		--broadcast