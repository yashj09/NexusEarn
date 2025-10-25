/**
 * Environment configuration with validation
 */
export const ENV = {
  // Network
  NETWORK: process.env.NEXT_PUBLIC_NETWORK || "testnet",
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",

  // RPC URLs
  RPC_URLS: {
    ethereum:
      process.env.NEXT_PUBLIC_RPC_URL_ETHEREUM ||
      "https://eth-sepolia.g.alchemy.com/v2/demo",
    polygon:
      process.env.NEXT_PUBLIC_RPC_URL_POLYGON ||
      "https://polygon-amoy.g.alchemy.com/v2/demo",
    arbitrum:
      process.env.NEXT_PUBLIC_RPC_URL_ARBITRUM ||
      "https://arb-sepolia.g.alchemy.com/v2/demo",
  },

  // Contract Addresses
  CONTRACTS: {
    VAULT: {
      ethereum: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ETH || "",
      polygon: process.env.NEXT_PUBLIC_VAULT_CONTRACT_POLYGON || "",
    },
    STRATEGY_MANAGER: {
      ethereum: process.env.NEXT_PUBLIC_STRATEGY_MANAGER_ETH || "",
    },
  },

  // API Keys
  WALLETCONNECT_PROJECT_ID:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  ETHERSCAN_API_KEY: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "",

  // External APIs
  DEFILLAMA_API:
    process.env.NEXT_PUBLIC_DEFILLAMA_API || "https://yields.llama.fi",

  // Avail
  AVAIL: {
    RPC: process.env.NEXT_PUBLIC_AVAIL_RPC || "wss://turing-rpc.avail.so/ws",
    APP_ID: parseInt(process.env.NEXT_PUBLIC_AVAIL_APP_ID || "1"),
  },
} as const;

// Validation
export function validateEnv() {
  const errors: string[] = [];

  if (!ENV.WALLETCONNECT_PROJECT_ID && !ENV.USE_MOCK_DATA) {
    errors.push("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required");
  }

  if (errors.length > 0) {
    console.error("Environment validation errors:", errors);
    if (!ENV.USE_MOCK_DATA) {
      throw new Error("Invalid environment configuration");
    }
  }

  return true;
}
