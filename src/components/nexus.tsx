import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NexusUnifiedBalance from "./unified-balance";
import NexusBridge from "./bridge";
import { YieldDashboard } from "./yield/YieldDashboard";

export default function Nexus() {
  return (
    <div className="flex items-center justify-center w-full flex-col gap-6 z-10">
      <Tabs defaultValue="yield" className="w-full items-center max-w-7xl">
        <TabsList>
          <TabsTrigger value="yield">CrossYield</TabsTrigger>
          <TabsTrigger value="balance">Unified Balance</TabsTrigger>
          <TabsTrigger value="bridge">Send Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="yield" className="w-full">
          <YieldDashboard />
        </TabsContent>

        <TabsContent value="balance" className="w-full items-center">
          <NexusUnifiedBalance />
        </TabsContent>

        <TabsContent
          value="bridge"
          className="w-full items-center bg-transparent"
        >
          <NexusBridge />
        </TabsContent>
      </Tabs>
    </div>
  );
}
