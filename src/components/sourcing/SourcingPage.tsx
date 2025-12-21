import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "./ChatInterface";
import { ManufacturerPanel, ManufacturerResult } from "./ManufacturerPanel";
import { ShortlistPanel } from "./ShortlistPanel";
import { Building2, Star } from "lucide-react";
import { useShortlist } from "@/hooks/useShortlist";

interface SourcingPageProps {
  onNavigateToPricing: () => void;
  onSelectForPricing: (manufacturer: ManufacturerResult) => void;
}

export function SourcingPage({ onNavigateToPricing, onSelectForPricing }: SourcingPageProps) {
  const [results, setResults] = useState<ManufacturerResult[]>([]);
  const [activeTab, setActiveTab] = useState<"results" | "shortlist">("results");
  const { shortlist, addToShortlist, setSelectedForPricing } = useShortlist();

  const handleUseForPricing = (manufacturer: ManufacturerResult) => {
    addToShortlist(manufacturer);
    setSelectedForPricing(manufacturer);
    onSelectForPricing(manufacturer);
    onNavigateToPricing();
  };

  // Show panel only when there are results or shortlist items
  const showPanel = results.length > 0 || shortlist.length > 0;

  return (
    <div className="h-full flex">
      {/* Chat Interface */}
      <div className={cn(
        "flex flex-col h-full",
        showPanel ? "flex-1 border-r border-border" : "w-full"
      )}>
        <div className="h-14 px-6 flex items-center border-b border-border flex-shrink-0">
          <h1 className="font-semibold">Product Sourcing</h1>
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatInterface onResults={setResults} />
        </div>
      </div>

      {/* Results / Shortlist Panel - Only show when there are results or shortlist items */}
      {showPanel && (
        <div className="w-[420px] flex flex-col bg-card/30 h-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "results" | "shortlist")} className="flex flex-col h-full">
          <div className="h-14 px-4 flex items-center border-b border-border flex-shrink-0">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="results" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Results
                {results.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {results.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="shortlist" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Shortlist
                {shortlist.length > 0 && (
                  <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded-full">
                    {shortlist.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="results" className="flex-1 overflow-hidden mt-0 min-h-0">
            <ManufacturerPanel results={results} onUseForPricing={handleUseForPricing} />
          </TabsContent>

          <TabsContent value="shortlist" className="flex-1 overflow-hidden mt-0 min-h-0">
            <ShortlistPanel onNavigateToPricing={onNavigateToPricing} />
          </TabsContent>
        </Tabs>
      </div>
      )}
    </div>
  );
}
