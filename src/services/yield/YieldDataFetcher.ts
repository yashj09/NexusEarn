import type {
  YieldOpportunity,
  YieldDataResponse,
  DeFiLlamaPoolsResponse,
} from "@/lib/types/yield.types";
import { PROTOCOL_CONFIGS } from "@/lib/config/protocols";
import { SUPPORTED_CHAINS } from "@avail-project/nexus-core";

export class YieldDataFetcher {
  private readonly DEFILLAMA_API = "https://yields.llama.fi/pools";
  private cache: Map<string, { data: YieldOpportunity[]; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch yield opportunities from DeFiLlama
   */
  async fetchYieldOpportunities(): Promise<YieldOpportunity[]> {
    const cacheKey = "yield_opportunities";
    const cached = this.cache.get(cacheKey);

    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log("📦 Returning cached yield data");
      return cached.data;
    }

    try {
      console.log("🔍 Fetching fresh yield data from DeFiLlama...");
      const response = await fetch(this.DEFILLAMA_API);
      const json: DeFiLlamaPoolsResponse = await response.json();

      const opportunities = this.parseYieldData(json.data);

      // Cache the results
      this.cache.set(cacheKey, { data: opportunities, timestamp: Date.now() });

      console.log(`✅ Fetched ${opportunities.length} yield opportunities`);
      return opportunities;
    } catch (error) {
      console.error("❌ Error fetching yield data:", error);
      // Return cached data if available, even if stale
      return cached?.data || [];
    }
  }

  /**
   * Parse DeFiLlama data into our format
   */
  private parseYieldData(data: YieldDataResponse[]): YieldOpportunity[] {
    const opportunities: YieldOpportunity[] = [];

    for (const pool of data) {
      // Filter for supported protocols and chains
      const protocolName = this.mapProtocolName(pool.project);
      if (!protocolName) continue;

      const chainId = this.mapChainName(pool.chain);
      if (!chainId) continue;

      const protocolConfig = PROTOCOL_CONFIGS[protocolName];
      const contractAddress = protocolConfig.contracts[chainId];
      if (!contractAddress) continue;

      // Filter for stablecoins only
      if (!this.isStablecoin(pool.symbol)) continue;

      // Only include if TVL > $100k and APY > 0
      if (pool.tvlUsd < 100000 || pool.apy <= 0) continue;

      opportunities.push({
        id: `${protocolName}-${chainId}-${pool.symbol}-${pool.pool}`,
        protocol: protocolName,
        chainId:
          chainId as import("@avail-project/nexus-core").SUPPORTED_CHAINS_IDS,
        token: this.mapTokenSymbol(pool.symbol),
        apy: pool.apy,
        tvl: pool.tvlUsd,
        riskScore: protocolConfig.riskScore,
        contractAddress,
        depositFunction: protocolConfig.depositFunction,
        withdrawFunction: protocolConfig.withdrawFunction,
        lastUpdated: Date.now(),
        metadata: {
          auditStatus: protocolConfig.auditStatus,
          timeInMarket: this.calculateTimeInMarket(pool.poolMeta),
          historicalExploits: 0, // Would need additional data source
        },
      });
    }

    return opportunities;
  }

  /**
   * Map DeFiLlama protocol names to our protocol names
   */
  private mapProtocolName(
    project: string
  ): "Aave" | "Compound" | "Yearn" | "Curve" | "Beefy" | null {
    const projectLower = project.toLowerCase();
    if (projectLower.includes("aave")) return "Aave";
    if (projectLower.includes("compound")) return "Compound";
    if (projectLower.includes("yearn")) return "Yearn";
    if (projectLower.includes("curve")) return "Curve";
    if (projectLower.includes("beefy")) return "Beefy";
    return null;
  }

  /**
   * Map DeFiLlama chain names to chain IDs
   */
  private mapChainName(chain: string): number | null {
    const chainLower = chain.toLowerCase();
    if (chainLower === "ethereum") return SUPPORTED_CHAINS.ETHEREUM;
    if (chainLower === "polygon") return SUPPORTED_CHAINS.POLYGON;
    if (chainLower === "arbitrum") return SUPPORTED_CHAINS.ARBITRUM;
    if (chainLower === "optimism") return SUPPORTED_CHAINS.OPTIMISM;
    if (chainLower === "base") return SUPPORTED_CHAINS.BASE;
    return null;
  }

  /**
   * Check if token is a stablecoin
   */
  private isStablecoin(symbol: string): boolean {
    const stableSymbols = ["USDC", "USDT", "DAI", "USDB", "USDE"];
    return stableSymbols.some((stable) =>
      symbol.toUpperCase().includes(stable)
    );
  }

  /**
   * Map token symbol to supported token
   */
  private mapTokenSymbol(
    symbol: string
  ): import("@/lib/types/yield.types").EXTENDED_TOKENS {
    if (symbol.includes("USDC")) return "USDC";
    if (symbol.includes("USDT")) return "USDT";
    if (symbol.includes("DAI")) return "DAI";
    return "USDC"; // default
  }

  /**
   * Calculate time in market (simplified)
   */
  private calculateTimeInMarket(poolMeta: string): number {
    // This would need real data - using placeholder
    return 365; // days
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
