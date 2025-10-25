/**
 * Custom error classes for better error handling
 */

export class ContractError extends Error {
  constructor(message: string, public readonly contractAddress: string) {
    super(message);
    this.name = "ContractError";
  }
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly txHash?: string,
    public readonly chainId?: number
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

export class InsufficientBalanceError extends Error {
  constructor(
    message: string,
    public readonly required: string,
    public readonly available: string
  ) {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export class GuardrailError extends Error {
  constructor(
    message: string,
    public readonly failedRule: string,
    public readonly value: any,
    public readonly threshold: any
  ) {
    super(message);
    this.name = "GuardrailError";
  }
}

export class NetworkError extends Error {
  constructor(message: string, public readonly chainId: number) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Error handler utility
 */
export function handleError(error: unknown): string {
  if (error instanceof ContractError) {
    return `Contract error at ${error.contractAddress}: ${error.message}`;
  }

  if (error instanceof TransactionError) {
    return `Transaction failed${error.txHash ? ` (${error.txHash})` : ""}: ${
      error.message
    }`;
  }

  if (error instanceof InsufficientBalanceError) {
    return `Insufficient balance: need ${error.required}, have ${error.available}`;
  }

  if (error instanceof GuardrailError) {
    return `Guardrail ${error.failedRule} failed: ${error.message}`;
  }

  if (error instanceof NetworkError) {
    return `Network error on chain ${error.chainId}: ${error.message}`;
  }

  if (error instanceof Error) {
    // Handle common wallet errors
    if (error.message.includes("User rejected")) {
      return "Transaction was rejected by user";
    }
    if (error.message.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }
    return error.message;
  }

  return "An unknown error occurred";
}
