import type {
  YieldOpportunity,
  YieldPosition,
  RebalanceIntent,
  StableBalance,
} from "@/lib/types/yield.types";
import { SUPPORTED_CHAINS } from "@avail-project/nexus-core";

/**
 * Mock Transaction Service - Simulates all blockchain transactions
 */
export class MockTransactionService {
  private static positions: YieldPosition[] = [];
  private static balances: Map<string, number> = new Map([
    ["USDC", 90],
    ["USDT", 40],
    ["DAI", 5],
  ]);

  /**
   * Simulate token approval
   */
  static async simulateApproval(
    token: string,
    amount: string
  ): Promise<{ success: boolean; txHash: string }> {
    console.log("🔄 [MOCK] Simulating token approval...");

    // Simulate network delay
    await this.delay(2000);

    const txHash = this.generateMockTxHash();
    console.log("✅ [MOCK] Approval successful:", txHash);

    return { success: true, txHash };
  }

  /**
   * Simulate deposit transaction
   */
  static async simulateDeposit(
    opportunity: YieldOpportunity,
    amount: string,
    userAddress: string
  ): Promise<{ success: boolean; txHash: string; position: YieldPosition }> {
    console.log("🔄 [MOCK] Simulating deposit...", {
      protocol: opportunity.protocol,
      amount,
      token: opportunity.token,
    });

    // Validate balance
    const currentBalance = this.balances.get(opportunity.token) || 0;
    const depositAmount = parseFloat(amount);

    if (depositAmount > currentBalance) {
      throw new Error("Insufficient balance");
    }

    // Simulate network delay
    await this.delay(3000);

    // Deduct from balance
    this.balances.set(opportunity.token, currentBalance - depositAmount);

    // Create position
    const position: YieldPosition = {
      id: `mock-pos-${Date.now()}`,
      protocol: opportunity.protocol,
      chainId: opportunity.chainId,
      token: opportunity.token,
      depositedAmount: amount,
      currentValue: amount, // Starts equal
      apy: opportunity.apy,
      earnedYield: "0",
      depositTimestamp: Date.now(),
      contractAddress: opportunity.contractAddress,
    };

    this.positions.push(position);

    const txHash = this.generateMockTxHash();
    console.log("✅ [MOCK] Deposit successful:", txHash);

    return { success: true, txHash, position };
  }

  /**
   * Simulate withdrawal transaction
   */
  static async simulateWithdraw(
    position: YieldPosition,
    amount: string
  ): Promise<{ success: boolean; txHash: string }> {
    console.log("🔄 [MOCK] Simulating withdrawal...", {
      protocol: position.protocol,
      amount,
      token: position.token,
    });

    // Find position
    const posIndex = this.positions.findIndex((p) => p.id === position.id);
    if (posIndex === -1) {
      throw new Error("Position not found");
    }

    const withdrawAmount = parseFloat(amount);
    const depositedAmount = parseFloat(position.depositedAmount);

    if (withdrawAmount > depositedAmount) {
      throw new Error("Withdrawal amount exceeds deposited amount");
    }

    // Simulate network delay
    await this.delay(3000);

    // Update position or remove if fully withdrawn
    if (withdrawAmount === depositedAmount) {
      this.positions.splice(posIndex, 1);
    } else {
      const remaining = depositedAmount - withdrawAmount;
      this.positions[posIndex] = {
        ...position,
        depositedAmount: remaining.toString(),
        currentValue: remaining.toString(),
      };
    }

    // Add back to balance (with earned yield)
    const currentBalance = this.balances.get(position.token) || 0;
    const earnedYield = parseFloat(position.earnedYield);
    this.balances.set(
      position.token,
      currentBalance + withdrawAmount + earnedYield
    );

    const txHash = this.generateMockTxHash();
    console.log("✅ [MOCK] Withdrawal successful:", txHash);

    return { success: true, txHash };
  }

  /**
   * Simulate rebalance transaction
   */
  static async simulateRebalance(
    intent: RebalanceIntent,
    userAddress: string
  ): Promise<{
    success: boolean;
    withdrawTxHash: string;
    depositTxHash: string;
  }> {
    console.log("🔄 [MOCK] Simulating rebalance...", {
      from: intent.from.protocol,
      to: intent.to.protocol,
      amount: intent.from.amount,
    });

    // Step 1: Withdraw from old position
    console.log("📤 [MOCK] Step 1/3: Withdrawing from", intent.from.protocol);
    await this.delay(2000);

    const fromPosition = this.positions.find(
      (p) =>
        p.protocol === intent.from.protocol && p.chainId === intent.from.chainId
    );

    if (fromPosition) {
      const withdrawResult = await this.simulateWithdraw(
        fromPosition,
        intent.from.amount
      );
    }

    // Step 2: Bridge (if needed)
    if (intent.from.chainId !== intent.to.chainId) {
      console.log("🌉 [MOCK] Step 2/3: Bridging to", intent.to.chainId);
      await this.delay(2000);
    } else {
      console.log("⚡ [MOCK] Step 2/3: Same chain, skipping bridge");
    }

    // Step 3: Deposit to new protocol
    console.log("📥 [MOCK] Step 3/3: Depositing to", intent.to.protocol);
    await this.delay(2000);

    const newOpportunity: YieldOpportunity = {
      id: `mock-opp-${Date.now()}`,
      protocol: intent.to.protocol,
      chainId: intent.to.chainId,
      token: "USDC", // Inferred
      apy: intent.to.expectedAPY,
      tvl: 1000000,
      riskScore: 3,
      contractAddress: intent.to.contractAddress,
      depositFunction: "deposit",
      withdrawFunction: "withdraw",
      lastUpdated: Date.now(),
      metadata: {
        auditStatus: true,
        timeInMarket: 365,
        historicalExploits: 0,
      },
    };

    // Temporarily add balance back for deposit simulation
    const token = "USDC";
    const currentBalance = this.balances.get(token) || 0;

    const depositResult = await this.simulateDeposit(
      newOpportunity,
      intent.from.amount,
      userAddress
    );

    const withdrawTxHash = this.generateMockTxHash();
    const depositTxHash = depositResult.txHash;

    console.log("✅ [MOCK] Rebalance successful!");
    console.log("   Withdraw TX:", withdrawTxHash);
    console.log("   Deposit TX:", depositTxHash);

    return {
      success: true,
      withdrawTxHash,
      depositTxHash,
    };
  }

  /**
   * Get current mock positions
   */
  static getPositions(): YieldPosition[] {
    // Simulate yield accrual
    return this.positions.map((pos) => {
      const daysSinceDeposit =
        (Date.now() - pos.depositTimestamp) / (1000 * 60 * 60 * 24);
      const earnedYield =
        ((parseFloat(pos.depositedAmount) * pos.apy) / 100 / 365) *
        daysSinceDeposit;

      return {
        ...pos,
        currentValue: (parseFloat(pos.depositedAmount) + earnedYield).toFixed(
          2
        ),
        earnedYield: earnedYield.toFixed(2),
      };
    });
  }

  /**
   * Get current mock balances
   */
  static getBalances(): Map<string, number> {
    return new Map(this.balances);
  }

  /**
   * Reset mock data
   */
  static reset() {
    this.positions = [];
    this.balances = new Map([
      ["USDC", 12500],
      ["USDT", 5000],
      ["DAI", 2500],
    ]);
    console.log("🔄 [MOCK] Data reset to initial state");
  }

  /**
   * Initialize with mock positions
   */
  static initialize(positions: YieldPosition[]) {
    this.positions = [...positions];
    console.log("🎭 [MOCK] Initialized with", positions.length, "positions");
  }

  /**
   * Helper: Generate mock transaction hash
   */
  private static generateMockTxHash(): string {
    const hash =
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
    return hash;
  }

  /**
   * Helper: Delay simulation
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get balance for token
   */
  static getBalance(token: string): number {
    return this.balances.get(token) || 0;
  }

  /**
   * Check if sufficient balance
   */
  static hasSufficientBalance(token: string, amount: string): boolean {
    const balance = this.getBalance(token);
    return parseFloat(amount) <= balance;
  }
}
