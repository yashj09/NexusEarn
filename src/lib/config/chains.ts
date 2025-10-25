import {
  SUPPORTED_CHAINS,
  type SUPPORTED_CHAINS_IDS,
} from "@avail-project/nexus-core";

export interface ChainConfig {
  id: SUPPORTED_CHAINS_IDS;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAIN_CONFIGS: Partial<Record<SUPPORTED_CHAINS_IDS, ChainConfig>> =
  {
    [SUPPORTED_CHAINS.ETHEREUM]: {
      id: SUPPORTED_CHAINS.ETHEREUM,
      name: "Ethereum",
      rpcUrl: "https://eth.llamarpc.com",
      explorerUrl: "https://etherscan.io",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    },
    [SUPPORTED_CHAINS.POLYGON]: {
      id: SUPPORTED_CHAINS.POLYGON,
      name: "Polygon",
      rpcUrl: "https://polygon.llamarpc.com",
      explorerUrl: "https://polygonscan.com",
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    },
    [SUPPORTED_CHAINS.ARBITRUM]: {
      id: SUPPORTED_CHAINS.ARBITRUM,
      name: "Arbitrum",
      rpcUrl: "https://arb1.arbitrum.io/rpc",
      explorerUrl: "https://arbiscan.io",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    },
    [SUPPORTED_CHAINS.OPTIMISM]: {
      id: SUPPORTED_CHAINS.OPTIMISM,
      name: "Optimism",
      rpcUrl: "https://mainnet.optimism.io",
      explorerUrl: "https://optimistic.etherscan.io",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    },
    [SUPPORTED_CHAINS.BASE]: {
      id: SUPPORTED_CHAINS.BASE,
      name: "Base",
      rpcUrl: "https://mainnet.base.org",
      explorerUrl: "https://basescan.org",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    },
  };
