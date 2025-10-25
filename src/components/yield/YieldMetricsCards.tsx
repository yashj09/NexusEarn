"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet, PieChart } from "lucide-react";
import { formatUSD, formatAPY } from "@/utils/formatters";
import { calculateWeightedAPY } from "@/utils/calculations";
import type { YieldPosition } from "@/lib/types/yield.types";

interface YieldMetricsCardsProps {
  totalValue: number;
  totalYield: number;
  idleBalance: number;
  positions: YieldPosition[];
}

export function YieldMetricsCards({
  totalValue,
  totalYield,
  idleBalance,
  positions,
}: YieldMetricsCardsProps) {
  const weightedAPY = calculateWeightedAPY(positions);
  const activeValue = totalValue - idleBalance;
  const utilizationRate = totalValue > 0 ? (activeValue / totalValue) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatUSD(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            Across {positions.length} position
            {positions.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Total Yield Earned */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatUSD(totalYield)}
          </div>
          <p className="text-xs text-muted-foreground">Earned to date</p>
        </CardContent>
      </Card>

      {/* Weighted APY */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average APY</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatAPY(weightedAPY)}</div>
          <p className="text-xs text-muted-foreground">Weighted by balance</p>
        </CardContent>
      </Card>

      {/* Idle Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Idle Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatUSD(idleBalance)}</div>
          <p className="text-xs text-muted-foreground">
            {utilizationRate.toFixed(1)}% utilized
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
