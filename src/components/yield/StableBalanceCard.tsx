"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatUSD, formatChainName } from "@/utils/formatters";
import type { StableBalance } from "@/lib/types/yield.types";
import { DollarSign } from "lucide-react";

interface StableBalanceCardProps {
  balance: StableBalance;
}

export function StableBalanceCard({ balance }: StableBalanceCardProps) {
  const activeValue = balance.breakdown
    .filter((b) => b.inYieldProtocol)
    .reduce((sum, b) => sum + b.valueUSD, 0);
  const utilizationRate =
    balance.totalValueUSD > 0 ? (activeValue / balance.totalValueUSD) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{balance.token}</CardTitle>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Balance */}
        <div>
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="text-2xl font-bold">
            {formatUSD(balance.totalValueUSD)}
          </p>
          <p className="text-sm text-muted-foreground">
            {balance.totalAmount} {balance.token}
          </p>
        </div>

        {/* Utilization */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Utilization</span>
            <span className="font-semibold">{utilizationRate.toFixed(1)}%</span>
          </div>
          <Progress value={utilizationRate} className="h-2" />
        </div>

        {/* Breakdown by Chain */}
        <div>
          <p className="text-sm font-medium mb-2">Chain Breakdown</p>
          <div className="space-y-2">
            {balance.breakdown.map((chainBalance) => (
              <div
                key={chainBalance.chainId}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {formatChainName(chainBalance.chainId)}
                  </Badge>
                  {chainBalance.inYieldProtocol && (
                    <Badge variant="secondary" className="text-xs">
                      {chainBalance.protocolName}
                    </Badge>
                  )}
                </div>
                <span className="font-semibold">
                  {formatUSD(chainBalance.valueUSD)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        {balance.isIdle && (
          <Badge variant="outline" className="w-full justify-center">
            💤 Idle - Start Earning!
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
