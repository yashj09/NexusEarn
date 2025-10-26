"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { formatUSD, formatAPY, formatChainName } from "@/utils/formatters";
import type { YieldOpportunity } from "@/lib/types/yield.types";
import { useDeposit } from "@/hooks/yield/useDeposit";
import { useYield } from "@/providers/YieldProvider";

interface DepositModalProps {
  opportunity: YieldOpportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({
  opportunity,
  open,
  onOpenChange,
}: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isValidAmount, setIsValidAmount] = useState(false);

  const { stableBalances, refreshPositions, refreshBalances } = useYield();
  const {
    deposit,
    isDepositing,
    isApproving,
    needsApproval,
    txHash,
    error,
    reset,
  } = useDeposit();

  // Get available balance
  const availableBalance =
    stableBalances.find((b) => b.token === opportunity?.token)?.totalAmount ||
    "0";

  // Validate amount
  useEffect(() => {
    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(availableBalance);
    setIsValidAmount(
      amount !== "" &&
        !isNaN(amountNum) &&
        amountNum > 0 &&
        amountNum <= balanceNum
    );
  }, [amount, availableBalance]);

  const handleDeposit = async () => {
    if (!opportunity || !isValidAmount) return;

    const success = await deposit(opportunity, amount);

    if (success) {
      // Refresh data
      await Promise.all([refreshPositions(), refreshBalances()]);

      // Reset and close after delay
      setTimeout(() => {
        reset();
        setAmount("");
        onOpenChange(false);
      }, 3000);
    }
  };

  const handleSetMax = () => {
    setAmount(availableBalance);
  };

  const handleClose = () => {
    if (!isDepositing && !isApproving) {
      reset();
      setAmount("");
      onOpenChange(false);
    }
  };

  if (!opportunity) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deposit to {opportunity.protocol}</DialogTitle>
          <DialogDescription>
            Earn {formatAPY(opportunity.apy)} APY on {opportunity.token}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Opportunity Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Protocol</p>
              <p className="font-semibold">{opportunity.protocol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chain</p>
              <Badge variant="outline">
                {formatChainName(opportunity.chainId)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">APY</p>
              <p className="font-semibold text-green-600">
                {formatAPY(opportunity.apy)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Token</p>
              <Badge>{opportunity.token}</Badge>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Amount</Label>
              <span className="text-sm text-muted-foreground">
                Available: {availableBalance} {opportunity.token}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isDepositing || isApproving}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSetMax}
                disabled={isDepositing || isApproving}
              >
                MAX
              </Button>
            </div>
            {!isValidAmount && amount !== "" && (
              <p className="text-sm text-red-500">
                Invalid amount or insufficient balance
              </p>
            )}
          </div>

          {/* Estimated Returns */}
          {isValidAmount && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
              <p className="text-sm font-medium">Estimated Returns</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Daily</p>
                  <p className="font-semibold text-green-600">
                    +
                    {formatUSD(
                      (parseFloat(amount) * opportunity.apy) / 100 / 365
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Yearly</p>
                  <p className="font-semibold text-green-600">
                    +{formatUSD((parseFloat(amount) * opportunity.apy) / 100)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isApproving && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Approving {opportunity.token}... Please confirm in your wallet.
              </AlertDescription>
            </Alert>
          )}

          {isDepositing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Depositing {amount} {opportunity.token}... Transaction in
                progress.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {txHash && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between">
                <span>Deposit successful!</span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() =>
                    window.open(`https://etherscan.io/tx/${txHash}`, "_blank")
                  }
                >
                  View Transaction <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDepositing || isApproving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={!isValidAmount || isDepositing || isApproving}
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : isDepositing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Depositing...
              </>
            ) : needsApproval ? (
              "Approve & Deposit"
            ) : (
              "Deposit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
