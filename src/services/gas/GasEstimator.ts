import { getPublicClient } from "@/lib/contracts/viem";
import { parseUnits, formatUnits } from "viem";
import type { SUPPORTED_CHAINS_IDS } from "@avail-project/nexus-core";

/**
 * Gas estimation service for transactions
 */
export class GasEstimator {
  /**
   * Get current gas price for chain
   */
  async getGasPrice(chainId: SUPPORTED_CHAINS_IDS): Promise<{
    gasPrice: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    const publicClient = getPublicClient(chainId);

    try {
      // Get EIP-1559 gas prices
      const feeData = await publicClient.estimateFeesPerGas();

      return {
        gasPrice: feeData.gasPrice || parseUnits("50", 9), // 50 gwei fallback
        maxFeePerGas: feeData.maxFeePerGas || parseUnits("50", 9),
        maxPriorityFeePerGas:
          feeData.maxPriorityFeePerGas || parseUnits("2", 9),
      };
    } catch (error) {
      console.error("Error getting gas price:", error);
      // Fallback values
      return {
        gasPrice: parseUnits("50", 9),
        maxFeePerGas: parseUnits("50", 9),
        maxPriorityFeePerGas: parseUnits("2", 9),
      };
    }
  }

  /**
   * Estimate gas for contract call
   */
  async estimateGas(
    chainId: SUPPORTED_CHAINS_IDS,
    contractAddress: `0x${string}`,
    abi: any[],
    functionName: string,
    args: readonly unknown[],
    from: `0x${string}`
  ): Promise<bigint> {
    const publicClient = getPublicClient(chainId);

    try {
      const gasEstimate = await publicClient.estimateContractGas({
        address: contractAddress,
        abi,
        functionName,
        args,
        account: from,
      });

      // Add 20% buffer for safety
      return (gasEstimate * 120n) / 100n;
    } catch (error) {
      console.error("Error estimating gas:", error);
      // Return conservative estimate
      return parseUnits("500000", 0); // 500k gas units
    }
  }

  /**
   * Calculate transaction cost in USD
   */
  async estimateTransactionCostUSD(
    chainId: SUPPORTED_CHAINS_IDS,
    gasUnits: bigint,
    ethPriceUSD: number = 3000
  ): Promise<string> {
    const { maxFeePerGas } = await this.getGasPrice(chainId);

    // Total cost in wei
    const costWei = gasUnits * maxFeePerGas;

    // Convert to ETH
    const costETH = parseFloat(formatUnits(costWei, 18));

    // Convert to USD
    const costUSD = costETH * ethPriceUSD;

    return costUSD.toFixed(2);
  }

  /**
   * Estimate bridge transaction cost
   */
  async estimateBridgeCost(
    fromChainId: SUPPORTED_CHAINS_IDS,
    toChainId: SUPPORTED_CHAINS_IDS,
    amount: string,
    ethPriceUSD: number = 3000
  ): Promise<{
    gasCost: string;
    bridgeFee: string;
    totalCost: string;
  }> {
    // Estimate gas for source chain
    const sourceGas = parseUnits("150000", 0); // ~150k gas for approval + bridge
    const gasCost = await this.estimateTransactionCostUSD(
      fromChainId,
      sourceGas,
      ethPriceUSD
    );

    // Bridge fee (0.1% of amount)
    const bridgeFeePercent = 0.001;
    const bridgeFee = (parseFloat(amount) * bridgeFeePercent).toFixed(2);

    // Total cost
    const totalCost = (parseFloat(gasCost) + parseFloat(bridgeFee)).toFixed(2);

    return {
      gasCost,
      bridgeFee,
      totalCost,
    };
  }

  /**
   * Estimate rebalance cost (withdraw + bridge + deposit)
   */
  async estimateRebalanceCost(
    fromChainId: SUPPORTED_CHAINS_IDS,
    toChainId: SUPPORTED_CHAINS_IDS,
    amount: string,
    ethPriceUSD: number = 3000
  ): Promise<{
    withdrawGas: string;
    bridgeCost: string;
    depositGas: string;
    totalCost: string;
  }> {
    // Withdraw gas estimate
    const withdrawGas = parseUnits("200000", 0); // ~200k gas
    const withdrawCost = await this.estimateTransactionCostUSD(
      fromChainId,
      withdrawGas,
      ethPriceUSD
    );

    // Bridge cost
    const bridgeCost = await this.estimateBridgeCost(
      fromChainId,
      toChainId,
      amount,
      ethPriceUSD
    );

    // Deposit gas estimate
    const depositGas = parseUnits("250000", 0); // ~250k gas
    const depositCost = await this.estimateTransactionCostUSD(
      toChainId,
      depositGas,
      ethPriceUSD
    );

    // Total cost
    const totalCost = (
      parseFloat(withdrawCost) +
      parseFloat(bridgeCost.totalCost) +
      parseFloat(depositCost)
    ).toFixed(2);

    return {
      withdrawGas: withdrawCost,
      bridgeCost: bridgeCost.totalCost,
      depositGas: depositCost,
      totalCost,
    };
  }

  /**
   * Get ETH price from oracle (simplified)
   */
  async getETHPrice(): Promise<number> {
    try {
      // In production, use Chainlink oracle or API
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.error("Error fetching ETH price:", error);
      return 3000; // Fallback price
    }
  }
}
