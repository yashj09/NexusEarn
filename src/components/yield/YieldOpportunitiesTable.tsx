"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import {
  formatUSD,
  formatAPY,
  formatLargeNumber,
  formatChainName,
  formatRiskLabel,
  getRiskColor,
} from "@/utils/formatters";
import type { YieldOpportunity } from "@/lib/types/yield.types";
import { Skeleton } from "@/components/ui/skeleton";

interface YieldOpportunitiesTableProps {
  opportunities: YieldOpportunity[];
  isLoading?: boolean;
}

export function YieldOpportunitiesTable({
  opportunities,
  isLoading,
}: YieldOpportunitiesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Opportunities Found</h3>
        <p className="text-sm text-muted-foreground">
          Check back later or refresh to see new yield opportunities
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Protocol</TableHead>
            <TableHead>Chain</TableHead>
            <TableHead>Token</TableHead>
            <TableHead className="text-right">APY</TableHead>
            <TableHead className="text-right">TVL</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.slice(0, 10).map((opportunity) => (
            <TableRow key={opportunity.id}>
              <TableCell className="font-medium">
                {opportunity.protocol}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {formatChainName(opportunity.chainId)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{opportunity.token}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-green-600">
                  {formatAPY(opportunity.apy)}
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                ${formatLargeNumber(opportunity.tvl)}
              </TableCell>
              <TableCell>
                <span className={getRiskColor(opportunity.riskScore)}>
                  {formatRiskLabel(opportunity.riskScore)}
                </span>
              </TableCell>
              <TableCell>
                {opportunity.metadata.auditStatus && (
                  <Badge variant="outline" className="text-green-600">
                    Audited
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
