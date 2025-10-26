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
import { formatUSD, formatChainName } from "@/utils/formatters";
import type { YieldPosition } from "@/lib/types/yield.types";
import { useWithdraw } from "@/hooks/yield/useWithdraw";
import { useYield } from "@/providers/YieldProvider";

interface WithdrawModalProps {
  position: YieldPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawModal({
  position,
  open,
  onOpenChange,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [isValidAmount, setIsValidAmount] = useState(false);

  const { refreshPositions, refreshBalances } = useYield();
  const { withdraw, isWithdrawing, txHash, error, reset } = useWithdraw();

  // Validate amount
  useEffect(() => {
    if (!position) return;

    const amountNum = parseFloat(amount);
    const depositedNum = parseFloat(position.depositedAmount);
    setIsValidAmount(
      amount !== "" &&
        !isNaN(amountNum) &&
        amountNum > 0 &&
        amountNum <= depositedNum
    );
  }, [amount, position]);

  const handleWithdraw = async () => {
    if (!position || !isValidAmount) return;

    const success = await withdraw(position, amount);

    if (success) {
      await Promise.all([refreshPositions(), refreshBalances()]);

      setTimeout(() => {
        reset();
        setAmount("");
        onOpenChange(false);
      }, 3000);
    }
  };

  const handleSetMax = () => {
    if (position) {
      setAmount(position.depositedAmount);
    }
  };

  const handleClose = () => {
    if (!isWithdrawing) {
      reset();
      setAmount("");
      onOpenChange(false);
    }
  };

  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw from {position.protocol}</DialogTitle>
          <DialogDescription>
            Withdraw your {position.token} from the protocol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Position Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Protocol</p>
              <p className="font-semibold">{position.protocol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chain</p>
              <Badge variant="outline">
                {formatChainName(position.chainId)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deposited</p>
              <p className="font-semibold">
                {formatUSD(parseFloat(position.depositedAmount))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="font-semibold text-green-600">
                {formatUSD(parseFloat(position.currentValue))}
              </p>
            </div>
          </div>

          {/* Earned Yield */}
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-green-600">
              +{formatUSD(parseFloat(position.earnedYield))}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Withdraw Amount</Label>
              <span className="text-sm text-muted-foreground">
                Available: {position.depositedAmount} {position.token}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isWithdrawing}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSetMax}
                disabled={isWithdrawing}
              >
                MAX
              </Button>
            </div>
            {!isValidAmount && amount !== "" && (
              <p className="text-sm text-red-500">
                Invalid amount or exceeds available balance
              </p>
            )}
          </div>

          {/* Status Messages */}
          {isWithdrawing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Withdrawing {amount} {position.token}... Transaction in
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
                <span>Withdrawal successful!</span>
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
            disabled={isWithdrawing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={!isValidAmount || isWithdrawing}
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              "Withdraw"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
