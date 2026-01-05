import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatInterface } from "./ChatInterface";
import { ManufacturerPanel, ManufacturerResult } from "./ManufacturerPanel";
import { ShortlistPanel } from "./ShortlistPanel";
import { Building2, Star, PanelRight, PanelRightClose, RotateCcw } from "lucide-react";
import { useShortlist } from "@/hooks/useShortlist";
import { useChat } from "@/hooks/useChat";

interface SourcingPageProps {
  onNavigateToPricing: () => void;
  onSelectForPricing: (manufacturer: ManufacturerResult) => void;
}

export function SourcingPage({ onNavigateToPricing, onSelectForPricing }: SourcingPageProps) {
  // Use context for persistent results and panel state
  const { results, setResults, isPanelOpen, setIsPanelOpen, clearMessages, isLoading } = useChat();
  const [activeTab, setActiveTab] = useState<"results" | "shortlist">("results");
  const { shortlist, addToShortlist, setSelectedForPricing } = useShortlist();

  const handleUseForPricing = (manufacturer: ManufacturerResult) => {
    addToShortlist(manufacturer);
    setSelectedForPricing(manufacturer);
    onSelectForPricing(manufacturer);
    onNavigateToPricing();
  };

  // Show panel when toggled open (and optionally when there are results/shortlist)
  const hasResults = results.length > 0 || shortlist.length > 0;
  const showPanel = isPanelOpen;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chat Interface */}
      <div className={cn(
        "flex flex-col flex-1 overflow-hidden",
        showPanel ? "border-r border-border" : ""
      )}>
        <div className="h-14 px-6 flex items-center justify-between border-b border-border flex-shrink-0">
          <h1 className="font-semibold">Product Sourcing</h1>
          <div className="flex items-center gap-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  className="h-8 w-8"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-card border-border">
                Clear chat history
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className="h-8 w-8"
                >
                  {isPanelOpen ? (
                    <PanelRightClose className="w-4 h-4" />
                  ) : (
                    <PanelRight className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-card border-border">
                {isPanelOpen ? "Hide results panel" : "Show results panel"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatInterface onResults={setResults} />
        </div>
      </div>

      {/* Results / Shortlist Panel - Show when toggled open */}
      {showPanel && (
        <div className="w-[420px] flex flex-col bg-card/30 overflow-hidden">
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

            <div className="flex-1 overflow-hidden min-h-0">
              <TabsContent value="results" className="h-full overflow-y-auto mt-0 data-[state=active]:block">
                <ManufacturerPanel results={results} onUseForPricing={handleUseForPricing} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="shortlist" className="h-full overflow-y-auto mt-0 data-[state=active]:block">
                <ShortlistPanel onNavigateToPricing={onNavigateToPricing} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
