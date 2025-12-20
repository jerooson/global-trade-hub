import { useState } from "react";
import { ChatInterface } from "./ChatInterface";
import { ManufacturerPanel } from "./ManufacturerPanel";

interface ManufacturerResult {
  name: string;
  type: "Factory" | "Trading Company";
  confidence: number;
  address: string;
  contact: string;
  email: string;
  phone: string;
  products: string[];
}

export function SourcingPage() {
  const [result, setResult] = useState<ManufacturerResult | null>(null);

  return (
    <div className="h-full flex">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="h-14 px-6 flex items-center border-b border-border">
          <h1 className="font-semibold">Product Sourcing</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface onResult={setResult} />
        </div>
      </div>

      {/* Results Panel */}
      <div className="w-[400px] flex flex-col bg-card/30">
        <div className="h-14 px-6 flex items-center border-b border-border">
          <h2 className="font-semibold">Manufacturer Details</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ManufacturerPanel result={result} />
        </div>
      </div>
    </div>
  );
}
