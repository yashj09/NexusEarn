import { SUPPORTED_CHAINS } from "@avail-project/nexus-core";
import type { ProtocolName } from "../types/yield.types";

export interface ProtocolConfig {
  name: ProtocolName;
  displayName: string;
  supportedChains: number[];
  contracts: Record<number, `0x${string}`>;
  depositFunction: string;
  withdrawFunction: string;
  riskScore: number; // 1-10 scale
  auditStatus: boolean;
  website: string;
}

export const PROTOCOL_CONFIGS: Record<ProtocolName, ProtocolConfig> = {
  Aave: {
    name: "Aave",
    displayName: "Aave V3",
    supportedChains: [
      SUPPORTED_CHAINS.ETHEREUM,
      SUPPORTED_CHAINS.POLYGON,
      SUPPORTED_CHAINS.ARBITRUM,
    ],
    contracts: {
      [SUPPORTED_CHAINS.ETHEREUM]: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      [SUPPORTED_CHAINS.POLYGON]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
      [SUPPORTED_CHAINS.ARBITRUM]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    },
    depositFunction: "supply",
    withdrawFunction: "withdraw",
    riskScore: 2,
    auditStatus: true,
    website: "https://aave.com",
  },
  Compound: {
    name: "Compound",
    displayName: "Compound V3",
    supportedChains: [
      SUPPORTED_CHAINS.ETHEREUM,
      SUPPORTED_CHAINS.POLYGON,
      SUPPORTED_CHAINS.BASE,
    ],
    contracts: {
      [SUPPORTED_CHAINS.ETHEREUM]: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
      [SUPPORTED_CHAINS.POLYGON]: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
      [SUPPORTED_CHAINS.BASE]: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
    },
    depositFunction: "supply",
    withdrawFunction: "withdraw",
    riskScore: 3,
    auditStatus: true,
    website: "https://compound.finance",
  },
  Yearn: {
    name: "Yearn",
    displayName: "Yearn Finance",
    supportedChains: [
      SUPPORTED_CHAINS.ETHEREUM,
      SUPPORTED_CHAINS.POLYGON,
      SUPPORTED_CHAINS.ARBITRUM,
    ],
    contracts: {
      [SUPPORTED_CHAINS.ETHEREUM]: "0xdA816459F1AB5631232FE5e97a05BBBb94970c95",
      [SUPPORTED_CHAINS.POLYGON]: "0xBFdD2E9C8C6D1A1D5D87BfAc4cae4907D6dBB0d7",
      [SUPPORTED_CHAINS.ARBITRUM]: "0x239e14A19DFF93a17339DCC444f74406C17f8E67",
    },
    depositFunction: "deposit",
    withdrawFunction: "withdraw",
    riskScore: 4,
    auditStatus: true,
    website: "https://yearn.finance",
  },
  Curve: {
    name: "Curve",
    displayName: "Curve Finance",
    supportedChains: [
      SUPPORTED_CHAINS.ETHEREUM,
      SUPPORTED_CHAINS.POLYGON,
      SUPPORTED_CHAINS.ARBITRUM,
    ],
    contracts: {
      [SUPPORTED_CHAINS.ETHEREUM]: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      [SUPPORTED_CHAINS.POLYGON]: "0x445FE580eF8d70FF569aB36e80c647af338db351",
      [SUPPORTED_CHAINS.ARBITRUM]: "0x7f90122BF0700F9E7e1F688fe926940E8839F353",
    },
    depositFunction: "add_liquidity",
    withdrawFunction: "remove_liquidity",
    riskScore: 3,
    auditStatus: true,
    website: "https://curve.fi",
  },
  Beefy: {
    name: "Beefy",
    displayName: "Beefy Finance",
    supportedChains: [
      SUPPORTED_CHAINS.POLYGON,
      SUPPORTED_CHAINS.ARBITRUM,
      SUPPORTED_CHAINS.BASE,
    ],
    contracts: {
      [SUPPORTED_CHAINS.POLYGON]: "0x1A83524A07F4e36AcC87faaE3ded1cc95FFE4D33",
      [SUPPORTED_CHAINS.ARBITRUM]: "0xBfcbF6B01C19e213838EbfF58aA8d2A190eF77f8",
      [SUPPORTED_CHAINS.BASE]: "0x123...",
    },
    depositFunction: "deposit",
    withdrawFunction: "withdraw",
    riskScore: 5,
    auditStatus: true,
    website: "https://beefy.finance",
  },
};

// Helper to get protocol by chain
export function getProtocolsForChain(chainId: number): ProtocolConfig[] {
  return Object.values(PROTOCOL_CONFIGS).filter((protocol) =>
    protocol.supportedChains.includes(chainId)
  );
}

// Helper to get contract address
export function getProtocolContract(
  protocol: ProtocolName,
  chainId: number
): `0x${string}` | undefined {
  return PROTOCOL_CONFIGS[protocol]?.contracts[chainId];
}
