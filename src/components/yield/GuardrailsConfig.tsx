"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useYield } from "@/providers/YieldProvider";
import { useState } from "react";

export function GuardrailsConfig() {
  const { guardrails, updateGuardrails } = useYield();

  const [config, setConfig] = useState(guardrails);

  const handleSave = () => {
    updateGuardrails(config);
    alert("Guardrails updated successfully!");
  };

  const handleReset = () => {
    setConfig(guardrails);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Max Slippage */}
        <div className="space-y-2">
          <Label htmlFor="maxSlippage">Max Slippage (%)</Label>
          <Input
            id="maxSlippage"
            type="number"
            step="0.1"
            value={config.maxSlippage}
            onChange={(e) =>
              setConfig({ ...config, maxSlippage: parseFloat(e.target.value) })
            }
          />
          <p className="text-xs text-muted-foreground">
            Maximum acceptable slippage during rebalancing
          </p>
        </div>

        {/* Min APY Delta */}
        <div className="space-y-2">
          <Label htmlFor="minAPYDelta">Min APY Improvement (%)</Label>
          <Input
            id="minAPYDelta"
            type="number"
            step="0.1"
            value={config.minAPYDelta}
            onChange={(e) =>
              setConfig({ ...config, minAPYDelta: parseFloat(e.target.value) })
            }
          />
          <p className="text-xs text-muted-foreground">
            Minimum APY improvement required to trigger rebalance
          </p>
        </div>

        {/* Max Protocol Allocation */}
        <div className="space-y-2">
          <Label htmlFor="maxAllocation">Max Single Protocol (%)</Label>
          <Input
            id="maxAllocation"
            type="number"
            value={config.maxSingleProtocolAllocation}
            onChange={(e) =>
              setConfig({
                ...config,
                maxSingleProtocolAllocation: parseInt(e.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Maximum percentage in a single protocol for diversification
          </p>
        </div>

        {/* Min Break Even Days */}
        <div className="space-y-2">
          <Label htmlFor="breakEven">Max Break-even Period (days)</Label>
          <Input
            id="breakEven"
            type="number"
            value={config.minBreakEvenDays}
            onChange={(e) =>
              setConfig({
                ...config,
                minBreakEvenDays: parseInt(e.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Maximum days to break even on rebalance costs
          </p>
        </div>

        {/* Risk Tolerance */}
        <div className="space-y-2">
          <Label htmlFor="riskTolerance">Risk Tolerance</Label>
          <Select
            value={config.riskTolerance}
            onValueChange={(value: any) =>
              setConfig({ ...config, riskTolerance: value })
            }
          >
            <SelectTrigger id="riskTolerance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Your overall risk appetite for yield strategies
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave}>Save Configuration</Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
