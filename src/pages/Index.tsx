import { useState } from "react";
import { LeftSidebar, TabId } from "@/components/layout/RightSidebar";
import { SourcingPage } from "@/components/sourcing/SourcingPage";
import { PriceCalculator } from "@/components/calculator/PriceCalculator";
import { ShortlistPanel } from "@/components/sourcing/ShortlistPanel";
import { ShortlistContext, useShortlistProvider } from "@/hooks/useShortlist";
import { ManufacturerResult } from "@/components/sourcing/ManufacturerPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Clock } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("sourcing");
  const shortlistState = useShortlistProvider();
  const [selectedManufacturer, setSelectedManufacturer] = useState<ManufacturerResult | null>(null);

  const handleNavigateToPricing = () => {
    if (shortlistState.selectedForPricing) {
      setSelectedManufacturer(shortlistState.selectedForPricing);
    }
    setActiveTab("calculator");
  };

  const handleSelectForPricing = (manufacturer: ManufacturerResult) => {
    setSelectedManufacturer(manufacturer);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "sourcing":
        return (
          <SourcingPage 
            onNavigateToPricing={handleNavigateToPricing}
            onSelectForPricing={handleSelectForPricing}
          />
        );
      case "calculator":
        return <PriceCalculator selectedManufacturer={selectedManufacturer} />;
      case "shortlist":
        return (
          <div className="h-full flex flex-col">
            <div className="h-14 px-6 flex items-center border-b border-border">
              <h1 className="font-semibold">Shortlisted Manufacturers</h1>
            </div>
            <div className="flex-1">
              <ShortlistPanel onNavigateToPricing={handleNavigateToPricing} />
            </div>
          </div>
        );
      case "approvals":
        return (
          <div className="h-full flex items-center justify-center p-8">
            <Card className="max-w-md bg-card border-border">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Approvals Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Review and approve outreach requests, pricing decisions, and supplier selections 
                  before they're actioned.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Expected in v2.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ShortlistContext.Provider value={shortlistState}>
      <div className="min-h-screen bg-background flex">
        <LeftSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          shortlistCount={shortlistState.shortlist.length}
        />

        <main className="flex-1 ml-56 transition-all duration-300">
          {renderContent()}
        </main>
      </div>
    </ShortlistContext.Provider>
  );
};

export default Index;
