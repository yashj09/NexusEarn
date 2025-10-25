import type { NexusSDK } from "@avail-project/nexus-core";
import type { UserAsset } from "@avail-project/nexus-core";
import type {
  StableBalance,
  ChainBalance,
  YieldPosition,
} from "@/lib/types/yield.types";

export class BalanceTracker {
  private sdk: NexusSDK;

  constructor(sdk: NexusSDK) {
    this.sdk = sdk;
  }

  /**
   * Get unified stablecoin balances across all chains
   */
  async getStableBalances(): Promise<StableBalance[]> {
    console.log("📊 Fetching unified stablecoin balances...");

    try {
      // Get all balances from Nexus SDK
      const allBalances = await this.sdk.getUnifiedBalances();

      // Filter for stablecoins only
      const stableTokens = ["USDC", "USDT", "DAI"];
      const stableBalances: StableBalance[] = [];

      for (const asset of allBalances) {
        if (stableTokens.includes(asset.symbol)) {
          const breakdown = this.parseBalanceBreakdown(asset);

          stableBalances.push({
            token: asset.symbol as "USDC" | "USDT" | "DAI",
            totalAmount: asset.balance,
            totalValueUSD:
              typeof asset.balanceInFiat === "number"
                ? asset.balanceInFiat
                : parseFloat(asset.balanceInFiat || "0"),
            breakdown,
            isIdle: this.checkIfIdle(breakdown),
          });
        }
      }

      console.log(`✅ Found ${stableBalances.length} stablecoin balances`);
      return stableBalances;
    } catch (error) {
      console.error("❌ Error fetching balances:", error);
      return [];
    }
  }

  /**
   * Get total idle stablecoin balance
   */
  async getTotalIdleBalance(): Promise<number> {
    const balances = await this.getStableBalances();
    return balances
      .filter((b) => b.isIdle)
      .reduce((sum, b) => sum + b.totalValueUSD, 0);
  }

  /**
   * Get balance for specific token
   */
  async getTokenBalance(
    token: import("@/lib/types/yield.types").EXTENDED_TOKENS
  ): Promise<StableBalance | null> {
    const balances = await this.getStableBalances();
    return balances.find((b) => b.token === token) || null;
  }

  /**
   * Parse balance breakdown per chain
   */
  private parseBalanceBreakdown(asset: UserAsset): ChainBalance[] {
    if (!asset.breakdown) return [];

    return asset.breakdown.map((chainBalance) => ({
      chainId: chainBalance.chain
        .id as import("@avail-project/nexus-core").SUPPORTED_CHAINS_IDS,
      chainName: chainBalance.chain.name,
      amount: chainBalance.balance,
      valueUSD:
        typeof chainBalance.balanceInFiat === "number"
          ? chainBalance.balanceInFiat
          : parseFloat(chainBalance.balanceInFiat || "0"),
      inYieldProtocol: false, // Would need to check on-chain
      protocolName: undefined,
    }));
  }

  /**
   * Check if balance is idle (not in any yield protocol)
   */
  private checkIfIdle(breakdown: ChainBalance[]): boolean {
    // All balances are idle if none are in yield protocols
    return breakdown.every((b) => !b.inYieldProtocol);
  }

  /**
   * Fetch current yield positions from on-chain data
   * This would require querying each protocol's contract
   */
  async fetchYieldPositions(
    userAddress: `0x${string}`
  ): Promise<YieldPosition[]> {
    console.log("📈 Fetching yield positions for:", userAddress);

    // This is a placeholder - would need to:
    // 1. Query each protocol contract on each chain
    // 2. Get user's deposited amounts
    // 3. Calculate current value with accrued interest
    // 4. Return positions array

    const positions: YieldPosition[] = [];

    // Example structure (would be populated from on-chain data)
    // positions.push({
    //   id: 'aave-eth-usdc-1',
    //   protocol: 'Aave',
    //   chainId: 1,
    //   token: 'USDC',
    //   depositedAmount: '1000',
    //   currentValue: '1050',
    //   apy: 5.2,
    //   earnedYield: '50',
    //   depositTimestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
    //   contractAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    // });

    console.log(`✅ Found ${positions.length} yield positions`);
    return positions;
  }

  /**
   * Get total value locked in yield protocols
   */
  async getTotalYieldValue(userAddress: `0x${string}`): Promise<number> {
    const positions = await this.fetchYieldPositions(userAddress);
    return positions.reduce(
      (sum, pos) => sum + parseFloat(pos.currentValue),
      0
    );
  }
}
