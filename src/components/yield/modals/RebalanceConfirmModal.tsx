"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  formatUSD,
  formatAPY,
  formatDays,
  formatChainName,
} from "@/utils/formatters";
import type { RebalanceIntent } from "@/lib/types/yield.types";
import { useRebalanceExecutor } from "@/hooks/yield/useRebalanceExecutor";

interface RebalanceConfirmModalProps {
  intent: RebalanceIntent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RebalanceConfirmModal({
  intent,
  open,
  onOpenChange,
  onSuccess,
}: RebalanceConfirmModalProps) {
  const [understoodRisks, setUnderstoodRisks] = useState(false);
  const [acceptedCosts, setAcceptedCosts] = useState(false);

  const { execute, isExecuting, txHash, error, stage, reset } =
    useRebalanceExecutor();

  const handleExecute = async () => {
    if (!intent) return;

    const success = await execute(intent);

    if (success) {
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 3000);
    }
  };

  const handleClose = () => {
    if (!isExecuting) {
      reset();
      setUnderstoodRisks(false);
      setAcceptedCosts(false);
      onOpenChange(false);
    }
  };

  if (!intent) return null;

  const canExecute = understoodRisks && acceptedCosts && !isExecuting;
  const apyImprovement =
    intent.to.expectedAPY - parseFloat(intent.from.amount) * 0.05; // Simplified

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Confirm Rebalance</DialogTitle>
          <DialogDescription>
            Review the details before executing this rebalancing operation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From -> To Flow */}
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">From</p>
              <div className="space-y-1">
                <p className="font-semibold">{intent.from.protocol}</p>
                <Badge variant="outline">
                  {formatChainName(intent.from.chainId)}
                </Badge>
                <p className="text-lg font-bold">
                  {formatUSD(parseFloat(intent.from.amount))}
                </p>
              </div>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

            <div className="flex-1 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">To</p>
              <div className="space-y-1">
                <p className="font-semibold">{intent.to.protocol}</p>
                <Badge variant="outline">
                  {formatChainName(intent.to.chainId)}
                </Badge>
                <p className="text-lg font-bold text-green-600">
                  {formatAPY(intent.to.expectedAPY)} APY
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cost Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold">Cost Breakdown</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Gas Fees:</span>
                <span className="font-semibold">
                  {formatUSD(parseFloat(intent.estimatedCost.gasFee))}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Bridge Fee:</span>
                <span className="font-semibold">
                  {formatUSD(parseFloat(intent.estimatedCost.bridgeFee))}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Slippage:</span>
                <span className="font-semibold">
                  {formatUSD(parseFloat(intent.estimatedCost.slippage))}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-primary/10 rounded">
                <span className="font-semibold">Total Cost:</span>
                <span className="font-bold">
                  {formatUSD(parseFloat(intent.estimatedCost.totalCostUSD))}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Expected Returns */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold">Expected Returns</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Yearly Gain</p>
                <p className="text-xl font-bold text-green-600">
                  +{formatUSD(parseFloat(intent.netBenefit.yearlyGainUSD))}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Break-even</p>
                <p className="text-xl font-bold">
                  {formatDays(intent.netBenefit.breakEvenDays)}
                </p>
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Net Yearly Gain (After Costs)
              </p>
              <p className="text-2xl font-bold text-green-600">
                +{formatUSD(parseFloat(intent.netBenefit.netYearlyGainUSD))}
              </p>
            </div>
          </div>

          <Separator />

          {/* Confirmations */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="risks"
                checked={understoodRisks}
                onCheckedChange={(checked) =>
                  setUnderstoodRisks(checked as boolean)
                }
                disabled={isExecuting}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="risks"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I understand the risks
                </Label>
                <p className="text-sm text-muted-foreground">
                  Rebalancing involves smart contract interactions and bridge
                  transactions. Funds may be at risk.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="costs"
                checked={acceptedCosts}
                onCheckedChange={(checked) =>
                  setAcceptedCosts(checked as boolean)
                }
                disabled={isExecuting}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="costs"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I accept the costs
                </Label>
                <p className="text-sm text-muted-foreground">
                  Total cost of{" "}
                  {formatUSD(parseFloat(intent.estimatedCost.totalCostUSD))}{" "}
                  will be deducted from my balance.
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {isExecuting && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Executing Rebalance...</p>
                  <p className="text-sm">{stage}</p>
                </div>
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
                <span>Rebalance successful!</span>
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
            disabled={isExecuting}
          >
            Cancel
          </Button>
          <Button onClick={handleExecute} disabled={!canExecute}>
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              "Execute Rebalance"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
