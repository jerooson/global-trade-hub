import { useState } from "react";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { SourcingPage } from "@/components/sourcing/SourcingPage";
import { PriceCalculator } from "@/components/calculator/PriceCalculator";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"sourcing" | "calculator">("sourcing");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <main className="flex-1 mr-56 transition-all duration-300">
        {activeTab === "sourcing" ? <SourcingPage /> : <PriceCalculator />}
      </main>

      {/* Right Sidebar */}
      <RightSidebar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
