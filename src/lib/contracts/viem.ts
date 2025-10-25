import { createPublicClient, createWalletClient, custom, http } from "viem";
import { mainnet, polygon, arbitrum, optimism, base } from "viem/chains";
import { SUPPORTED_CHAINS } from "@avail-project/nexus-core";
import { ENV } from "@/lib/config/env";

/**
 * Chain configuration map
 */
const CHAIN_MAP = {
  [SUPPORTED_CHAINS.ETHEREUM]: mainnet,
  [SUPPORTED_CHAINS.POLYGON]: polygon,
  [SUPPORTED_CHAINS.ARBITRUM]: arbitrum,
  [SUPPORTED_CHAINS.OPTIMISM]: optimism,
  [SUPPORTED_CHAINS.BASE]: base,
};

/**
 * Create public client for reading blockchain data
 */
export function getPublicClient(chainId: number) {
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  return createPublicClient({
    chain,
    transport: http(
      ENV.RPC_URLS[chain.name.toLowerCase() as keyof typeof ENV.RPC_URLS]
    ),
  });
}

/**
 * Create wallet client for writing transactions
 */
export function getWalletClient(chainId: number, provider: any) {
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  return createWalletClient({
    chain,
    transport: custom(provider),
  });
}
