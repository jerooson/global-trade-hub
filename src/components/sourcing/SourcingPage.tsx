import { useState } from "react";
import { ChatInterface } from "./ChatInterface";
import { ManufacturerPanel, ManufacturerResult } from "./ManufacturerPanel";

export function SourcingPage() {
  const [results, setResults] = useState<ManufacturerResult[]>([]);

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

      {/* Results Panel */}
      <div className="w-[420px] flex flex-col bg-card/30">
        <div className="h-14 px-6 flex items-center border-b border-border">
          <h2 className="font-semibold">Manufacturers</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ManufacturerPanel results={results} />
        </div>
      </div>
    </div>
  );
}
