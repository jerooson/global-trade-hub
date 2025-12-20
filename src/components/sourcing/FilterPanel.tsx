import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Factory, Store, MapPin, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Filters {
  factoryOnly: boolean;
  tradingCompanyOnly: boolean;
  minConfidence: number;
  locations: string[];
}

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableLocations: string[];
}

export function FilterPanel({ filters, onFiltersChange, availableLocations }: FilterPanelProps) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="p-4 space-y-5 border-b border-border bg-card/50">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>Filters</span>
      </div>

      {/* Type Filters */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Manufacturer Type
        </Label>
        <div className="flex gap-3">
          <button
            onClick={() => updateFilter("factoryOnly", !filters.factoryOnly)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
              filters.factoryOnly
                ? "border-success bg-success/10 text-success"
                : "border-border bg-secondary hover:bg-secondary/80"
            )}
          >
            <Factory className="w-4 h-4" />
            Factory
          </button>
          <button
            onClick={() => updateFilter("tradingCompanyOnly", !filters.tradingCompanyOnly)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
              filters.tradingCompanyOnly
                ? "border-warning bg-warning/10 text-warning"
                : "border-border bg-secondary hover:bg-secondary/80"
            )}
          >
            <Store className="w-4 h-4" />
            Trading
          </button>
        </div>
      </div>

      {/* Confidence Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Min Confidence
          </Label>
          <span className="text-sm font-medium text-primary">{filters.minConfidence}%</span>
        </div>
        <Slider
          value={[filters.minConfidence]}
          onValueChange={([value]) => updateFilter("minConfidence", value)}
          max={100}
          min={0}
          step={5}
          className="w-full"
        />
      </div>

      {/* Location Filters */}
      {availableLocations.length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Location
          </Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableLocations.map((location) => (
              <div key={location} className="flex items-center gap-2">
                <Checkbox
                  id={location}
                  checked={filters.locations.includes(location)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilter("locations", [...filters.locations, location]);
                    } else {
                      updateFilter(
                        "locations",
                        filters.locations.filter((l) => l !== location)
                      );
                    }
                  }}
                />
                <Label htmlFor={location} className="text-sm cursor-pointer">
                  {location}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
