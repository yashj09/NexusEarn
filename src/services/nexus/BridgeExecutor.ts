import type { NexusSDK } from "@avail-project/nexus-core";
import type {
  BridgeAndExecuteResult,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail-project/nexus-core";
import type {
  RebalanceIntent,
  ProtocolName,
  EXTENDED_TOKENS,
} from "@/lib/types/yield.types";
import { PROTOCOL_ABIS } from "@/lib/constants/abis";
import { PROTOCOL_CONFIGS } from "@/lib/config/protocols";
import { parseUnits } from "viem";

export class BridgeExecutor {
  private sdk: NexusSDK;

  constructor(sdk: NexusSDK) {
    this.sdk = sdk;
  }

  /**
   * Execute a yield deposit via bridge + execute
   */
  async executeYieldDeposit(
    intent: RebalanceIntent,
    userAddress: `0x${string}`,
    token: EXTENDED_TOKENS
  ): Promise<BridgeAndExecuteResult> {
    console.log("🚀 Executing yield deposit:", {
      from: intent.from.chainId,
      to: intent.to.chainId,
      protocol: intent.to.protocol,
      amount: intent.from.amount,
    });

    const protocolConfig = PROTOCOL_CONFIGS[intent.to.protocol];
    const protocolAbi = PROTOCOL_ABIS[intent.to.protocol];

    // Build function parameters based on protocol
    const functionParams = this.buildDepositParams(
      intent.to.protocol,
      token,
      intent.from.amount,
      intent.to.chainId,
      userAddress
    );

    try {
      // Execute bridge + deposit in one transaction
      const result = await this.sdk.bridgeAndExecute({
        toChainId: intent.to.chainId,
        token: this.toSupportedToken(token),
        amount: intent.from.amount,
        recipient: userAddress,
        execute: {
          contractAddress: intent.to.contractAddress,
          contractAbi: protocolAbi as any,
          functionName: protocolConfig.depositFunction,
          buildFunctionParams: () => functionParams,
          tokenApproval: {
            token: this.toSupportedToken(token),
            amount: intent.from.amount,
          },
        },
        waitForReceipt: true,
      });

      console.log(
        "✅ Yield deposit successful:",
        result.executeTransactionHash
      );
      return result;
    } catch (error) {
      console.error("❌ Yield deposit failed:", error);
      throw error;
    }
  }

  /**
   * Execute withdrawal from yield protocol
   */
  async executeYieldWithdraw(
    chainId: SUPPORTED_CHAINS_IDS,
    protocol: ProtocolName,
    contractAddress: `0x${string}`,
    token: EXTENDED_TOKENS,
    amount: string,
    userAddress: `0x${string}`
  ): Promise<any> {
    console.log("💰 Executing yield withdrawal:", {
      chainId,
      protocol,
      amount,
    });

    const protocolConfig = PROTOCOL_CONFIGS[protocol];
    const protocolAbi = PROTOCOL_ABIS[protocol];

    try {
      // Execute withdrawal directly on the chain
      const result = await this.sdk.execute({
        toChainId: chainId,
        contractAddress,
        contractAbi: protocolAbi as any,
        functionName: protocolConfig.withdrawFunction,
        buildFunctionParams: () => ({
          functionParams: this.buildWithdrawParams(
            protocol,
            token,
            amount,
            userAddress
          ),
        }),
        waitForReceipt: true,
      });

      console.log("✅ Yield withdrawal successful");
      return result;
    } catch (error) {
      console.error("❌ Yield withdrawal failed:", error);
      throw error;
    }
  }

  /**
   * Execute full rebalance (withdraw + bridge + deposit)
   */
  async executeRebalance(
    intent: RebalanceIntent,
    userAddress: `0x${string}`,
    token: EXTENDED_TOKENS
  ): Promise<{
    withdrawResult: any;
    depositResult: BridgeAndExecuteResult;
  }> {
    console.log("🔄 Executing full rebalance...");

    // Step 1: Withdraw from old protocol
    const withdrawResult = await this.executeYieldWithdraw(
      intent.from.chainId,
      intent.from.protocol,
      intent.from.contractAddress,
      token,
      intent.from.amount,
      userAddress
    );

    // Wait a bit for withdrawal to settle
    await this.delay(3000);

    // Step 2: Bridge + Deposit to new protocol
    const depositResult = await this.executeYieldDeposit(
      intent,
      userAddress,
      token
    );

    return {
      withdrawResult,
      depositResult,
    };
  }

  /**
   * Build deposit function parameters based on protocol
   */
  private buildDepositParams(
    protocol: ProtocolName,
    token: EXTENDED_TOKENS,
    amount: string,
    chainId: SUPPORTED_CHAINS_IDS,
    userAddress: `0x${string}`
  ): { functionParams: readonly unknown[] } {
    // Get token decimals (6 for USDC/USDT)
    const decimals = (token as string) === "DAI" ? 18 : 6;
    const amountWei = parseUnits(amount, decimals);

    // Token contract addresses (would need to import from nexus-core)
    const tokenAddress = this.getTokenAddress(token, chainId);

    switch (protocol) {
      case "Aave":
        // supply(asset, amount, onBehalfOf, referralCode)
        return {
          functionParams: [tokenAddress, amountWei, userAddress, 0] as const,
        };

      case "Compound":
        // supply(asset, amount)
        return {
          functionParams: [tokenAddress, amountWei] as const,
        };

      case "Yearn":
      case "Beefy":
        // deposit(amount, recipient)
        return {
          functionParams: [amountWei, userAddress] as const,
        };

      case "Curve":
        // add_liquidity([amounts], min_mint_amount)
        return {
          functionParams: [[amountWei], BigInt(0)] as const,
        };

      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }

  /**
   * Build withdraw function parameters
   */
  private buildWithdrawParams(
    protocol: ProtocolName,
    token: EXTENDED_TOKENS,
    amount: string,
    userAddress: `0x${string}`
  ): readonly unknown[] {
    const decimals = (token as string) === "DAI" ? 18 : 6;
    const amountWei = parseUnits(amount, decimals);

    switch (protocol) {
      case "Aave":
        // withdraw(asset, amount, to)
        return [
          this.getTokenAddress(token, 1),
          amountWei,
          userAddress,
        ] as const;

      case "Compound":
        // withdraw(asset, amount)
        return [this.getTokenAddress(token, 1), amountWei] as const;

      case "Yearn":
      case "Beefy":
        // withdraw(maxShares, recipient)
        return [amountWei, userAddress] as const;

      case "Curve":
        // remove_liquidity(amount, [min_amounts])
        return [amountWei, [BigInt(0), BigInt(0)]] as const;

      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }

  /**
   * Get token contract address for chain
   */
  private getTokenAddress(
    token: EXTENDED_TOKENS,
    chainId: number
  ): `0x${string}` {
    // Token addresses per chain (simplified - would import from nexus-core)
    const addresses: Record<string, Record<number, `0x${string}`>> = {
      USDC: {
        1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
        137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon
        42161: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // Arbitrum
      },
      USDT: {
        1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      },
      DAI: {
        1: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        137: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        42161: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      },
    };

    return addresses[token]?.[chainId] || addresses[token][1];
  }

  /**
   * Narrow EXTENDED_TOKENS to SUPPORTED_TOKENS for SDK calls
   */
  private toSupportedToken(token: EXTENDED_TOKENS): SUPPORTED_TOKENS {
    if ((token as string) === "DAI") {
      throw new Error("DAI is not supported by the bridge SDK yet");
    }
    return token as SUPPORTED_TOKENS;
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
