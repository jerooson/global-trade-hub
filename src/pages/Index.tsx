import { useState } from "react";
import { LeftSidebar } from "@/components/layout/RightSidebar";
import { SourcingPage } from "@/components/sourcing/SourcingPage";
import { PriceCalculator } from "@/components/calculator/PriceCalculator";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"sourcing" | "calculator">("sourcing");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 ml-56 transition-all duration-300">
        {activeTab === "sourcing" ? <SourcingPage /> : <PriceCalculator />}
      </main>
    </div>
  );
};

export default Index;
