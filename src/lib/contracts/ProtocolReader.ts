import { getPublicClient } from "@/lib/contracts/viem";
import { PROTOCOL_CONFIGS } from "@/lib/config/protocols";
import {
  AAVE_POOL_ABI,
  COMPOUND_COMET_ABI,
  YEARN_VAULT_ABI,
} from "@/lib/constants/abis";
import {
  getTokenAddress,
  getTokenDecimals,
} from "@/lib/constants/tokenAddresses";
import type {
  YieldPosition,
  ProtocolName,
  EXTENDED_TOKENS,
} from "@/lib/types/yield.types";
import type { SUPPORTED_CHAINS_IDS } from "@avail-project/nexus-core";

/**
 * Read user positions from on-chain protocols
 */
export class ProtocolReader {
  /**
   * Get user's balance in Aave protocol
   */
  async getAavePosition(
    chainId: SUPPORTED_CHAINS_IDS,
    userAddress: `0x${string}`,
    token: EXTENDED_TOKENS
  ): Promise<YieldPosition | null> {
    try {
      const publicClient = getPublicClient(chainId);
      const protocolAddress = PROTOCOL_CONFIGS.Aave.contracts[chainId];
      const tokenAddress = getTokenAddress(token, chainId);

      if (!protocolAddress) return null;

      // Get user account data from Aave
      const accountData = await publicClient.readContract({
        address: protocolAddress,
        abi: AAVE_POOL_ABI,
        functionName: "getUserAccountData",
        args: [userAddress],
      });

      const data = accountData as readonly [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint
      ];
      const totalCollateral = data[0];
      const totalDebt = data[1];
      const depositedAmount = totalCollateral - totalDebt;

      if (depositedAmount === BigInt(0)) return null;

      // Convert to human-readable format
      const decimals = getTokenDecimals(token);
      const depositedStr = (Number(depositedAmount) / 10 ** decimals).toFixed(
        2
      );
      const currentStr = (Number(totalCollateral) / 10 ** decimals).toFixed(2);
      const earnedStr = (
        Number(totalCollateral - depositedAmount) /
        10 ** decimals
      ).toFixed(2);

      // Get current APY (would need additional contract call or oracle)
      const apy = 5.2; // Placeholder - fetch from protocol

      return {
        id: `aave-${chainId}-${token}-${userAddress}`,
        protocol: "Aave",
        chainId,
        token,
        depositedAmount: depositedStr,
        currentValue: currentStr,
        apy,
        earnedYield: earnedStr,
        depositTimestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // Placeholder
        contractAddress: protocolAddress,
      };
    } catch (error) {
      console.error("Error fetching Aave position:", error);
      return null;
    }
  }

  /**
   * Get user's balance in Compound protocol
   */
  async getCompoundPosition(
    chainId: SUPPORTED_CHAINS_IDS,
    userAddress: `0x${string}`,
    token: EXTENDED_TOKENS
  ): Promise<YieldPosition | null> {
    try {
      const publicClient = getPublicClient(chainId);
      const protocolAddress = PROTOCOL_CONFIGS.Compound.contracts[chainId];

      if (!protocolAddress) return null;

      // Get user balance from Compound
      const balance = await publicClient.readContract({
        address: protocolAddress,
        abi: COMPOUND_COMET_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      });

      if (balance === BigInt(0)) return null;

      const decimals = getTokenDecimals(token);
      const depositedStr = (Number(balance) / 10 ** decimals).toFixed(2);

      // Compound shows 1:1 balance (includes earned interest)
      const currentStr = depositedStr;
      const earnedStr = "0"; // Would need to track initial deposit

      const apy = 4.8; // Placeholder

      return {
        id: `compound-${chainId}-${token}-${userAddress}`,
        protocol: "Compound",
        chainId,
        token,
        depositedAmount: depositedStr,
        currentValue: currentStr,
        apy,
        earnedYield: earnedStr,
        depositTimestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
        contractAddress: protocolAddress,
      };
    } catch (error) {
      console.error("Error fetching Compound position:", error);
      return null;
    }
  }

  /**
   * Get user's balance in Yearn protocol
   */
  async getYearnPosition(
    chainId: SUPPORTED_CHAINS_IDS,
    userAddress: `0x${string}`,
    token: EXTENDED_TOKENS
  ): Promise<YieldPosition | null> {
    try {
      const publicClient = getPublicClient(chainId);
      const protocolAddress = PROTOCOL_CONFIGS.Yearn.contracts[chainId];

      if (!protocolAddress) return null;

      // Get user shares
      const shares = await publicClient.readContract({
        address: protocolAddress,
        abi: YEARN_VAULT_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      });

      if (shares === BigInt(0)) return null;

      // Get price per share to calculate value
      const pricePerShare = await publicClient.readContract({
        address: protocolAddress,
        abi: YEARN_VAULT_ABI,
        functionName: "pricePerShare",
        args: [],
      });

      const decimals = getTokenDecimals(token);
      const totalValue =
        (shares * (pricePerShare as bigint)) / BigInt(10 ** decimals);
      const currentStr = (Number(totalValue) / 10 ** decimals).toFixed(2);

      // Placeholder for deposited amount (would need to track)
      const depositedStr = (Number(totalValue) * 0.95).toFixed(2);
      const earnedStr = (Number(currentStr) - Number(depositedStr)).toFixed(2);

      const apy = 6.1; // Placeholder

      return {
        id: `yearn-${chainId}-${token}-${userAddress}`,
        protocol: "Yearn",
        chainId,
        token,
        depositedAmount: depositedStr,
        currentValue: currentStr,
        apy,
        earnedYield: earnedStr,
        depositTimestamp: Date.now() - 45 * 24 * 60 * 60 * 1000,
        contractAddress: protocolAddress,
      };
    } catch (error) {
      console.error("Error fetching Yearn position:", error);
      return null;
    }
  }

  /**
   * Get all positions for a user across all protocols
   */
  async getAllPositions(
    userAddress: `0x${string}`,
    chains: SUPPORTED_CHAINS_IDS[],
    tokens: EXTENDED_TOKENS[]
  ): Promise<YieldPosition[]> {
    const positions: YieldPosition[] = [];

    for (const chainId of chains) {
      for (const token of tokens) {
        // Check Aave
        const aavePos = await this.getAavePosition(chainId, userAddress, token);
        if (aavePos) positions.push(aavePos);

        // Check Compound
        const compoundPos = await this.getCompoundPosition(
          chainId,
          userAddress,
          token
        );
        if (compoundPos) positions.push(compoundPos);

        // Check Yearn
        const yearnPos = await this.getYearnPosition(
          chainId,
          userAddress,
          token
        );
        if (yearnPos) positions.push(yearnPos);
      }
    }

    return positions;
  }
}
