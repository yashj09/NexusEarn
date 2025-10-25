import type {
  BridgeAndExecuteParams,
  BridgeAndExecuteResult,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail-project/nexus-core";

// Extended Nexus types for our use case
export interface YieldDepositParams
  extends Omit<BridgeAndExecuteParams, "execute"> {
  execute: {
    contractAddress: `0x${string}`;
    contractAbi: any[];
    functionName: "deposit" | "supply" | "mint";
    functionParams: readonly unknown[];
    tokenApproval?: {
      token: SUPPORTED_TOKENS;
      amount: string;
    };
  };
}

export interface YieldWithdrawParams {
  chainId: SUPPORTED_CHAINS_IDS;
  protocolAddress: `0x${string}`;
  token: SUPPORTED_TOKENS;
  amount: string;
  contractAbi: any[];
  functionName: "withdraw" | "redeem";
}
