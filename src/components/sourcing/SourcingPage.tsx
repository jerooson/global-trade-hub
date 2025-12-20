import { useState } from "react";
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

  return (
    <div className="h-full flex">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="h-14 px-6 flex items-center border-b border-border">
          <h1 className="font-semibold">Product Sourcing</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface onResults={setResults} />
        </div>
      </div>

      {/* Results / Shortlist Panel */}
      <div className="w-[420px] flex flex-col bg-card/30">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "results" | "shortlist")} className="flex flex-col h-full">
          <div className="h-14 px-4 flex items-center border-b border-border">
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

          <TabsContent value="results" className="flex-1 overflow-hidden mt-0">
            <ManufacturerPanel results={results} onUseForPricing={handleUseForPricing} />
          </TabsContent>

          <TabsContent value="shortlist" className="flex-1 overflow-hidden mt-0">
            <ShortlistPanel onNavigateToPricing={onNavigateToPricing} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
