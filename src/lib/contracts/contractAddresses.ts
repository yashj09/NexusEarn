import { ENV } from "@/lib/config/env";

/**
 * Deployed contract addresses
 * UPDATE THESE AFTER DEPLOYMENT
 */
export const CONTRACT_ADDRESSES = {
  // CrossYield Vault
  VAULT: {
    ethereum:
      ENV.CONTRACTS.VAULT.ethereum ||
      "0x0000000000000000000000000000000000000000",
    polygon:
      ENV.CONTRACTS.VAULT.polygon ||
      "0x0000000000000000000000000000000000000000",
  },

  // Strategy Manager
  STRATEGY_MANAGER: {
    ethereum:
      ENV.CONTRACTS.STRATEGY_MANAGER.ethereum ||
      "0x0000000000000000000000000000000000000000",
  },
} as const;

/**
 * Check if contracts are deployed
 */
export function areContractsDeployed(): boolean {
  return (
    CONTRACT_ADDRESSES.VAULT.ethereum !==
      "0x0000000000000000000000000000000000000000" || ENV.USE_MOCK_DATA
  );
}
