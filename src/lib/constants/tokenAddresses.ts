import { SUPPORTED_CHAINS } from "@avail-project/nexus-core";
import type { SUPPORTED_CHAINS_IDS } from "@avail-project/nexus-core";
import type { EXTENDED_TOKENS } from "../types/yield.types";

/**
 * Token contract addresses per chain
 * SOURCE: Official token deployments
 */
export const TOKEN_ADDRESSES: Record<
  EXTENDED_TOKENS,
  Partial<Record<SUPPORTED_CHAINS_IDS, `0x${string}`>>
> = {
  // USDC Addresses
  USDC: {
    [SUPPORTED_CHAINS.ETHEREUM]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet
    [SUPPORTED_CHAINS.POLYGON]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Polygon PoS
    [SUPPORTED_CHAINS.ARBITRUM]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum One
    [SUPPORTED_CHAINS.OPTIMISM]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism
    [SUPPORTED_CHAINS.BASE]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  },

  // USDT Addresses
  USDT: {
    [SUPPORTED_CHAINS.ETHEREUM]: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    [SUPPORTED_CHAINS.POLYGON]: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    [SUPPORTED_CHAINS.ARBITRUM]: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    [SUPPORTED_CHAINS.OPTIMISM]: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    [SUPPORTED_CHAINS.BASE]: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  },

  // DAI Addresses
  DAI: {
    [SUPPORTED_CHAINS.ETHEREUM]: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    [SUPPORTED_CHAINS.POLYGON]: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    [SUPPORTED_CHAINS.ARBITRUM]: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    [SUPPORTED_CHAINS.OPTIMISM]: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    [SUPPORTED_CHAINS.BASE]: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  },

  // ETH (Native or Wrapped)
  ETH: {
    [SUPPORTED_CHAINS.ETHEREUM]: "0x0000000000000000000000000000000000000000", // Native
    [SUPPORTED_CHAINS.POLYGON]: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
    [SUPPORTED_CHAINS.ARBITRUM]: "0x0000000000000000000000000000000000000000", // Native
    [SUPPORTED_CHAINS.OPTIMISM]: "0x0000000000000000000000000000000000000000", // Native
    [SUPPORTED_CHAINS.BASE]: "0x0000000000000000000000000000000000000000", // Native
  },
};

/**
 * Get token address for specific chain
 */
export function getTokenAddress(
  token: EXTENDED_TOKENS,
  chainId: SUPPORTED_CHAINS_IDS
): `0x${string}` {
  const address = TOKEN_ADDRESSES[token]?.[chainId];
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new Error(`Token ${token} not supported on chain ${chainId}`);
  }
  return address;
}

/**
 * Get token decimals
 */
export function getTokenDecimals(token: EXTENDED_TOKENS): number {
  const decimals: Record<EXTENDED_TOKENS, number> = {
    USDC: 6,
    USDT: 6,
    DAI: 18,
    ETH: 18,
  };
  return decimals[token];
}

/**
 * Check if token is supported on chain
 */
export function isTokenSupportedOnChain(
  token: EXTENDED_TOKENS,
  chainId: SUPPORTED_CHAINS_IDS
): boolean {
  const address = TOKEN_ADDRESSES[token]?.[chainId];
  return !!address && address !== "0x0000000000000000000000000000000000000000";
}
