import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useShortlist } from "@/hooks/useShortlist";
import { X, Star, ArrowRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortlistPanelProps {
  onNavigateToPricing: () => void;
}

export function ShortlistPanel({ onNavigateToPricing }: ShortlistPanelProps) {
  const { shortlist, removeFromShortlist, selectedForPricing, setSelectedForPricing } = useShortlist();

  if (shortlist.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
            <Star className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">No Shortlisted Manufacturers</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add manufacturers from search results to compare and proceed to pricing
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {shortlist.map((manufacturer) => (
          <Card
            key={manufacturer.id}
            className={cn(
              "p-4 bg-card border-border transition-all cursor-pointer",
              selectedForPricing?.id === manufacturer.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedForPricing(manufacturer)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{manufacturer.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      manufacturer.type === "Factory"
                        ? "bg-success/20 text-success"
                        : "bg-warning/20 text-warning"
                    )}
                  >
                    {manufacturer.type}
                  </Badge>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      manufacturer.confidence >= 80
                        ? "text-success"
                        : manufacturer.confidence >= 60
                        ? "text-warning"
                        : "text-destructive"
                    )}
                  >
                    {manufacturer.confidence}%
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromShortlist(manufacturer.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <div className="p-4 border-t border-border bg-card/50 space-y-3">
        <p className="text-xs text-muted-foreground text-center">
          {selectedForPricing
            ? `Selected: ${selectedForPricing.name}`
            : "Click a manufacturer to select for pricing"}
        </p>
        <Button
          className="w-full"
          size="lg"
          disabled={!selectedForPricing}
          onClick={onNavigateToPricing}
        >
          <Calculator className="w-5 h-5 mr-2" />
          Proceed to Pricing
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
