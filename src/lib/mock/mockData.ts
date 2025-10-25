import type {
  YieldOpportunity,
  YieldPosition,
  StableBalance,
  RebalanceAnalysis,
} from "@/lib/types/yield.types";
import { SUPPORTED_CHAINS } from "@avail-project/nexus-core";

export const MOCK_YIELD_OPPORTUNITIES: YieldOpportunity[] = [
  {
    id: "aave-eth-usdc-1",
    protocol: "Aave",
    chainId: SUPPORTED_CHAINS.ETHEREUM,
    token: "USDC",
    apy: 5.2,
    tvl: 1500000000,
    riskScore: 2,
    contractAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    depositFunction: "supply",
    withdrawFunction: "withdraw",
    lastUpdated: Date.now(),
    metadata: {
      auditStatus: true,
      timeInMarket: 365,
      historicalExploits: 0,
    },
  },
  {
    id: "compound-polygon-usdc-1",
    protocol: "Compound",
    chainId: SUPPORTED_CHAINS.POLYGON,
    token: "USDC",
    apy: 4.8,
    tvl: 800000000,
    riskScore: 3,
    contractAddress: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
    depositFunction: "supply",
    withdrawFunction: "withdraw",
    lastUpdated: Date.now(),
    metadata: {
      auditStatus: true,
      timeInMarket: 730,
      historicalExploits: 0,
    },
  },
  {
    id: "yearn-arbitrum-usdc-1",
    protocol: "Yearn",
    chainId: SUPPORTED_CHAINS.ARBITRUM,
    token: "USDC",
    apy: 6.1,
    tvl: 300000000,
    riskScore: 4,
    contractAddress: "0x239e14A19DFF93a17339DCC444f74406C17f8E67",
    depositFunction: "deposit",
    withdrawFunction: "withdraw",
    lastUpdated: Date.now(),
    metadata: {
      auditStatus: true,
      timeInMarket: 1095,
      historicalExploits: 0,
    },
  },
  {
    id: "aave-polygon-usdt-1",
    protocol: "Aave",
    chainId: SUPPORTED_CHAINS.POLYGON,
    token: "USDT",
    apy: 4.5,
    tvl: 500000000,
    riskScore: 2,
    contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    depositFunction: "supply",
    withdrawFunction: "withdraw",
    lastUpdated: Date.now(),
    metadata: {
      auditStatus: true,
      timeInMarket: 365,
      historicalExploits: 0,
    },
  },
  {
    id: "curve-eth-dai-1",
    protocol: "Curve",
    chainId: SUPPORTED_CHAINS.ETHEREUM,
    token: "DAI",
    apy: 3.9,
    tvl: 1200000000,
    riskScore: 3,
    contractAddress: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
    depositFunction: "add_liquidity",
    withdrawFunction: "remove_liquidity",
    lastUpdated: Date.now(),
    metadata: {
      auditStatus: true,
      timeInMarket: 1460,
      historicalExploits: 0,
    },
  },
];

export const MOCK_YIELD_POSITIONS: YieldPosition[] = [
  {
    id: "position-1",
    protocol: "Aave",
    chainId: SUPPORTED_CHAINS.ETHEREUM,
    token: "USDC",
    depositedAmount: "5000",
    currentValue: "5210",
    apy: 4.2,
    earnedYield: "210",
    depositTimestamp: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    contractAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  },
  {
    id: "position-2",
    protocol: "Compound",
    chainId: SUPPORTED_CHAINS.POLYGON,
    token: "USDC",
    depositedAmount: "3000",
    currentValue: "3095",
    apy: 3.8,
    earnedYield: "95",
    depositTimestamp: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    contractAddress: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
  },
];

export const MOCK_STABLE_BALANCES: StableBalance[] = [
  {
    token: "USDC",
    totalAmount: "12500",
    totalValueUSD: 12500,
    breakdown: [
      {
        chainId: SUPPORTED_CHAINS.ETHEREUM,
        chainName: "Ethereum",
        amount: "8000",
        valueUSD: 8000,
        inYieldProtocol: true,
        protocolName: "Aave",
      },
      {
        chainId: SUPPORTED_CHAINS.POLYGON,
        chainName: "Polygon",
        amount: "2500",
        valueUSD: 2500,
        inYieldProtocol: false,
      },
      {
        chainId: SUPPORTED_CHAINS.ARBITRUM,
        chainName: "Arbitrum",
        amount: "2000",
        valueUSD: 2000,
        inYieldProtocol: false,
      },
    ],
    isIdle: false,
  },
  {
    token: "USDT",
    totalAmount: "5000",
    totalValueUSD: 5000,
    breakdown: [
      {
        chainId: SUPPORTED_CHAINS.ETHEREUM,
        chainName: "Ethereum",
        amount: "3000",
        valueUSD: 3000,
        inYieldProtocol: false,
      },
      {
        chainId: SUPPORTED_CHAINS.POLYGON,
        chainName: "Polygon",
        amount: "2000",
        valueUSD: 2000,
        inYieldProtocol: false,
      },
    ],
    isIdle: true,
  },
  {
    token: "DAI",
    totalAmount: "2500",
    totalValueUSD: 2500,
    breakdown: [
      {
        chainId: SUPPORTED_CHAINS.ETHEREUM,
        chainName: "Ethereum",
        amount: "2500",
        valueUSD: 2500,
        inYieldProtocol: false,
      },
    ],
    isIdle: true,
  },
];

export const MOCK_REBALANCE_ANALYSIS: RebalanceAnalysis = {
  currentPositions: MOCK_YIELD_POSITIONS,
  opportunities: MOCK_YIELD_OPPORTUNITIES,
  rebalanceIntents: [
    {
      id: "intent-1",
      from: {
        chainId: SUPPORTED_CHAINS.ETHEREUM,
        protocol: "Aave",
        amount: "5000",
        contractAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      },
      to: {
        chainId: SUPPORTED_CHAINS.ARBITRUM,
        protocol: "Yearn",
        expectedAPY: 6.1,
        contractAddress: "0x239e14A19DFF93a17339DCC444f74406C17f8E67",
      },
      estimatedCost: {
        gasFee: "15.00",
        bridgeFee: "5.00",
        slippage: "2.50",
        totalCostUSD: "22.50",
      },
      netBenefit: {
        yearlyGainUSD: "95.00",
        netYearlyGainUSD: "72.50",
        breakEvenDays: 86,
      },
      guardrailsStatus: [
        {
          rule: "MAX_SLIPPAGE",
          passed: true,
          value: 0.05,
          threshold: 0.5,
          message: "Slippage: 0.05% (max: 0.5%)",
        },
        {
          rule: "MIN_APY_DELTA",
          passed: true,
          value: 1.9,
          threshold: 1.0,
          message: "APY improvement: 1.90% (min: 1.0%)",
        },
      ],
      status: "pending",
    },
  ],
  totalCurrentAPY: 4.0,
  totalProjectedAPY: 5.5,
  totalCostUSD: "22.50",
  totalYearlyGainUSD: "95.00",
  netYearlyGainUSD: "72.50",
  recommendedActions: 1,
  timestamp: Date.now(),
};

// Mock mode flag (set to false when backend is ready)
export const USE_MOCK_DATA = true;
