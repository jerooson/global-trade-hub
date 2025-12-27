import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { ManufacturerCard } from "./ManufacturerCard";

export interface ManufacturerResult {
  id: string;
  name: string;
  type: "Factory" | "Trading Company";
  confidence: number;
  address: string;
  contact: string;
  email: string;
  phone: string;
  products: string[];
  links?: {
    productUrl?: string;
    companyUrl?: string;
    inquiryUrl?: string;
  };
}

interface ManufacturerPanelProps {
  results: ManufacturerResult[];
  onUseForPricing: (manufacturer: ManufacturerResult) => void;
}

export function ManufacturerPanel({ results, onUseForPricing }: ManufacturerPanelProps) {
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => b.confidence - a.confidence);
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">No Results Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload an image or describe a product to find manufacturers
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {sortedResults.length} manufacturer{sortedResults.length !== 1 ? "s" : ""} found
          </h3>
          <Badge variant="secondary" className="text-xs">
            Sorted by confidence
          </Badge>
        </div>

        <div className="space-y-3">
          {sortedResults.map((result, index) => (
            <ManufacturerCard
              key={result.id}
              result={result}
              rank={index + 1}
              onUseForPricing={onUseForPricing}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
