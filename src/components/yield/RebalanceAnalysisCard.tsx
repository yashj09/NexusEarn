"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import {
  formatUSD,
  formatAPY,
  formatDays,
  formatChainName,
} from "@/utils/formatters";
import type { RebalanceAnalysis } from "@/lib/types/yield.types";
import { useYield } from "@/providers/YieldProvider";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { MOCK_REBALANCE_ANALYSIS, USE_MOCK_DATA } from "@/lib/mock/mockData";

interface RebalanceAnalysisCardProps {
  analysis: RebalanceAnalysis | null;
}

export function RebalanceAnalysisCard({
  analysis: propsAnalysis,
}: RebalanceAnalysisCardProps) {
  const { calculateRebalance, executeRebalance, isCalculating } = useYield();
  const [executingIntent, setExecutingIntent] = useState<string | null>(null);

  // Use mock data if needed
  const analysis = USE_MOCK_DATA ? MOCK_REBALANCE_ANALYSIS : propsAnalysis;

  const handleCalculate = async () => {
    if (!USE_MOCK_DATA) {
      await calculateRebalance();
    }
  };

  const handleExecute = async (intentId: string) => {
    if (USE_MOCK_DATA) {
      alert("Demo mode: Would execute rebalance in production");
      return;
    }

    setExecutingIntent(intentId);
    try {
      await executeRebalance(intentId);
      alert("Rebalance executed successfully!");
    } catch (error) {
      console.error("Rebalance failed:", error);
      alert("Rebalance failed. Please try again.");
    } finally {
      setExecutingIntent(null);
    }
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rebalance Analysis</CardTitle>
          <CardDescription>
            Analyze your portfolio to find optimal rebalancing opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to Optimize</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Click below to analyze your positions and discover better yield
            opportunities
          </p>
          <Button onClick={handleCalculate} disabled={isCalculating} size="lg">
            {isCalculating
              ? "Analyzing..."
              : "Analyze Rebalancing Opportunities"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rebalance Summary</CardTitle>
          <CardDescription>
            Found {analysis.recommendedActions} recommended rebalancing action
            {analysis.recommendedActions !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current APY</p>
              <p className="text-2xl font-bold">
                {formatAPY(analysis.totalCurrentAPY)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Projected APY</p>
              <p className="text-2xl font-bold text-green-600">
                {formatAPY(analysis.totalProjectedAPY)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">APY Improvement</p>
              <p className="text-2xl font-bold text-green-600">
                +
                {formatAPY(
                  analysis.totalProjectedAPY - analysis.totalCurrentAPY
                )}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-lg font-semibold">
                {formatUSD(parseFloat(analysis.totalCostUSD))}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Yearly Gain</p>
              <p className="text-lg font-semibold text-green-600">
                {formatUSD(parseFloat(analysis.totalYearlyGainUSD))}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Yearly Gain</p>
              <p className="text-lg font-semibold text-green-600">
                {formatUSD(parseFloat(analysis.netYearlyGainUSD))}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleCalculate}
              variant="outline"
              disabled={isCalculating}
            >
              Recalculate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rebalance Intents */}
      {analysis.rebalanceIntents.map((intent, index) => (
        <Card key={intent.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Rebalance Opportunity #{index + 1}
              </CardTitle>
              <Badge
                variant={
                  intent.guardrailsStatus.every((g) => g.passed)
                    ? "default"
                    : "destructive"
                }
              >
                {intent.guardrailsStatus.every((g) => g.passed)
                  ? "Approved"
                  : "Blocked"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From -> To */}
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">From</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{intent.from.protocol}</Badge>
                  <Badge variant="secondary">
                    {formatChainName(intent.from.chainId)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatUSD(parseFloat(intent.from.amount))}
                </p>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground" />

              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">To</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{intent.to.protocol}</Badge>
                  <Badge variant="secondary">
                    {formatChainName(intent.to.chainId)}
                  </Badge>
                </div>
                <p className="text-sm text-green-600 font-semibold">
                  {formatAPY(intent.to.expectedAPY)} APY
                </p>
              </div>
            </div>

            <Separator />

            {/* Cost Breakdown */}
            <div>
              <p className="text-sm font-medium mb-2">Cost Breakdown</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Fee:</span>
                  <span>
                    {formatUSD(parseFloat(intent.estimatedCost.gasFee))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bridge Fee:</span>
                  <span>
                    {formatUSD(parseFloat(intent.estimatedCost.bridgeFee))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slippage:</span>
                  <span>
                    {formatUSD(parseFloat(intent.estimatedCost.slippage))}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Cost:</span>
                  <span>
                    {formatUSD(parseFloat(intent.estimatedCost.totalCostUSD))}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Net Benefit */}
            <div>
              <p className="text-sm font-medium mb-2">Expected Returns</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Yearly Gain:</span>
                  <span className="text-green-600 font-semibold">
                    {formatUSD(parseFloat(intent.netBenefit.yearlyGainUSD))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Break-even Period:
                  </span>
                  <span className="font-semibold">
                    {formatDays(intent.netBenefit.breakEvenDays)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Net Yearly Gain:</span>
                  <span className="text-green-600 font-bold text-lg">
                    {formatUSD(parseFloat(intent.netBenefit.netYearlyGainUSD))}
                  </span>
                </div>
              </div>
            </div>

            {/* Guardrails */}
            <div>
              <p className="text-sm font-medium mb-2">Guardrail Checks</p>
              <div className="space-y-1">
                {intent.guardrailsStatus.map((check, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {check.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={
                        check.passed ? "text-muted-foreground" : "text-red-600"
                      }
                    >
                      {check.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full"
              onClick={() => handleExecute(intent.id)}
              disabled={
                !intent.guardrailsStatus.every((g) => g.passed) ||
                executingIntent === intent.id
              }
            >
              {executingIntent === intent.id
                ? "Executing..."
                : intent.guardrailsStatus.every((g) => g.passed)
                ? "Execute Rebalance"
                : "Blocked by Guardrails"}
            </Button>
          </CardContent>
        </Card>
      ))}

      {analysis.rebalanceIntents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Portfolio Optimized</h3>
            <p className="text-sm text-muted-foreground">
              Your positions are already in the best available protocols. Check
              back later for new opportunities.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
