import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { FilterPanel, Filters } from "./FilterPanel";
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
}

interface ManufacturerPanelProps {
  results: ManufacturerResult[];
  onUseForPricing: (manufacturer: ManufacturerResult) => void;
}

function extractCity(address: string): string {
  const parts = address.split(",");
  if (parts.length >= 2) {
    return parts[parts.length - 3]?.trim() || parts[0]?.trim() || "Unknown";
  }
  return "Unknown";
}

export function ManufacturerPanel({ results, onUseForPricing }: ManufacturerPanelProps) {
  const [filters, setFilters] = useState<Filters>({
    factoryOnly: false,
    tradingCompanyOnly: false,
    minConfidence: 0,
    locations: [],
  });

  const availableLocations = useMemo(() => {
    const cities = results.map((r) => extractCity(r.address));
    return [...new Set(cities)];
  }, [results]);

  const filteredResults = useMemo(() => {
    return results
      .filter((r) => {
        if (filters.factoryOnly && r.type !== "Factory") return false;
        if (filters.tradingCompanyOnly && r.type !== "Trading Company") return false;
        if (r.confidence < filters.minConfidence) return false;
        if (filters.locations.length > 0) {
          const city = extractCity(r.address);
          if (!filters.locations.includes(city)) return false;
        }
        return true;
      })
      .sort((a, b) => b.confidence - a.confidence);
  }, [results, filters]);

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
    <div className="h-full flex flex-col overflow-hidden">
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        availableLocations={availableLocations}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {filteredResults.length} of {results.length} manufacturer{results.length !== 1 ? "s" : ""}
          </h3>
          <Badge variant="secondary" className="text-xs">
            Sorted by confidence
          </Badge>
        </div>

        <div className="space-y-3">
          {filteredResults.map((result, index) => (
            <ManufacturerCard
              key={result.id}
              result={result}
              rank={index + 1}
              onUseForPricing={onUseForPricing}
            />
          ))}
        </div>

        {filteredResults.length === 0 && results.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No manufacturers match your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
