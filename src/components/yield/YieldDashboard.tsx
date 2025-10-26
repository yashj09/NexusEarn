"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useYield } from "@/providers/YieldProvider";
import { useNexus } from "@/providers/NexusProvider";
import { YieldOpportunitiesTable } from "./YieldOpportunitiesTable";
import { YieldPositionsTable } from "./YieldPositionsTable";
import { RebalanceAnalysisCard } from "./RebalanceAnalysisCard";
import { StableBalanceCard } from "./StableBalanceCard";
import { YieldMetricsCards } from "./YieldMetricsCards";
import { GuardrailsConfig } from "./GuardrailsConfig";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from "lucide-react";
import { ENV } from "@/lib/config/env";

export function YieldDashboard() {
  const { isInitialized } = useNexus();
  const {
    opportunities,
    positions,
    stableBalances,
    analysis,
    isLoadingOpportunities,
    isLoadingPositions,
    refreshOpportunities,
    refreshPositions,
    refreshBalances,
    getTotalValue,
    getTotalYield,
    getIdleBalance,
  } = useYield();

  const [showSettings, setShowSettings] = useState(false);

  const handleRefreshAll = async () => {
    if (!ENV.USE_MOCK_DATA && isInitialized) {
      await Promise.all([
        refreshOpportunities(),
        refreshPositions(),
        refreshBalances(),
      ]);
    }
  };

  useEffect(() => {
    if (isInitialized && !ENV.USE_MOCK_DATA) {
      handleRefreshAll();
    }
  }, [isInitialized]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            CrossYield Dashboard
          </h1>
          <p className="text-muted-foreground">
            Adaptive multi-chain yield optimization powered by Avail Nexus
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefreshAll}
            disabled={isLoadingOpportunities || isLoadingPositions}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoadingOpportunities ? "animate-spin" : ""
              }`}
            />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mock Data Banner */}
      {ENV.USE_MOCK_DATA && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              📊 <strong>Demo Mode:</strong> Currently displaying mock data.
              Connect your wallet and set NEXT_PUBLIC_USE_MOCK_DATA=false in
              .env to see real balances and execute transactions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metrics Overview */}
      <YieldMetricsCards
        totalValue={getTotalValue()}
        totalYield={getTotalYield()}
        idleBalance={getIdleBalance()}
        positions={positions}
      />

      {/* Guardrails Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Guardrails Configuration</CardTitle>
            <CardDescription>
              Customize your risk tolerance and rebalancing parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuardrailsConfig />
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="positions">My Positions</TabsTrigger>
          <TabsTrigger value="rebalance">Rebalance</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Yield Opportunities</CardTitle>
              <CardDescription>
                Best APY opportunities across all supported chains and protocols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <YieldOpportunitiesTable
                opportunities={opportunities}
                isLoading={isLoadingOpportunities}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Yield Positions</CardTitle>
              <CardDescription>
                Your current deposits earning yield across protocols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <YieldPositionsTable
                positions={positions}
                isLoading={isLoadingPositions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rebalance" className="space-y-4">
          <RebalanceAnalysisCard analysis={analysis} />
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stableBalances.map((balance) => (
              <StableBalanceCard key={balance.token} balance={balance} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
