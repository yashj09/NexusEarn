"use client";

import { useState } from "react";
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
import { Clock } from "lucide-react";
import {
  formatUSD,
  formatAPY,
  formatChainName,
  formatRelativeTime,
} from "@/utils/formatters";
import type { YieldPosition } from "@/lib/types/yield.types";
import { Skeleton } from "@/components/ui/skeleton";
import { WithdrawModal } from "./modals/WithdrawModal";

interface YieldPositionsTableProps {
  positions: YieldPosition[];
  isLoading?: boolean;
}

export function YieldPositionsTable({
  positions,
  isLoading,
}: YieldPositionsTableProps) {
  const [selectedPosition, setSelectedPosition] =
    useState<YieldPosition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWithdraw = (position: YieldPosition) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Active Positions</h3>
        <p className="text-sm text-muted-foreground">
          Start earning yield by depositing stablecoins into protocols
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocol</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Token</TableHead>
              <TableHead className="text-right">Deposited</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead className="text-right">APY</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => {
              const profit = parseFloat(position.earnedYield);
              const profitPercent =
                (profit / parseFloat(position.depositedAmount)) * 100;

              return (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">
                    {position.protocol}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatChainName(position.chainId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{position.token}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatUSD(parseFloat(position.depositedAmount))}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatUSD(parseFloat(position.currentValue))}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-600 font-semibold">
                      +{formatUSD(profit)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({profitPercent.toFixed(2)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAPY(position.apy)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatRelativeTime(position.depositTimestamp)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWithdraw(position)}
                    >
                      Withdraw
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <WithdrawModal
        position={selectedPosition}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
