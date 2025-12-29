import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Filter, TrendingDown, Database, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchResponse } from "@/services/api";

interface ObservabilityPanelProps {
  response: SearchResponse;
}

export function ObservabilityPanel({ response }: ObservabilityPanelProps) {
  const { parsedQuery, observability } = response;

  if (!observability) {
    return null;
  }

  const searchMethodLabels = {
    apify: "Apify (Made-in-China)",
    firecrawl: "Firecrawl",
    mock: "Mock Data",
  };

  const searchMethodColors = {
    apify: "bg-primary/20 text-primary border-primary/30",
    firecrawl: "bg-warning/20 text-warning border-warning/30",
    mock: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Agent Decision Tree
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Parsed Query */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Parsed Query
          </div>
          <div className="space-y-1.5 pl-5">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Product:</span>
              <Badge variant="secondary" className="text-xs">
                {parsedQuery.product}
              </Badge>
            </div>
            {parsedQuery.location && parsedQuery.location.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Location:</span>
                <Badge variant="secondary" className="text-xs">
                  {parsedQuery.location.join(", ")}
                </Badge>
              </div>
            )}
            {parsedQuery.category && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="secondary" className="text-xs">
                  {parsedQuery.category}
                </Badge>
              </div>
            )}
            {parsedQuery.subcategory && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Subcategory:</span>
                <Badge variant="secondary" className="text-xs">
                  {parsedQuery.subcategory}
                </Badge>
              </div>
            )}
            {parsedQuery.type && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="secondary" className="text-xs">
                  {parsedQuery.type}
                </Badge>
              </div>
            )}
            {parsedQuery.specifications && Object.keys(parsedQuery.specifications).length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground">Specs:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(parsedQuery.specifications).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Search Method */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" />
            Search Method
          </div>
          <div className="pl-5">
            {observability.searchMethod && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  searchMethodColors[observability.searchMethod]
                )}
              >
                {searchMethodLabels[observability.searchMethod]}
              </Badge>
            )}
          </div>
        </div>

        {/* Filters Applied */}
        {observability.filtersApplied && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5" />
                Filters Applied
              </div>
              <div className="space-y-1.5 pl-5">
                {observability.filtersApplied.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Location:</span>
                    <Badge variant="secondary" className="text-xs">
                      {observability.filtersApplied.location}
                    </Badge>
                  </div>
                )}
                {observability.filtersApplied.minConfidence !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Min Confidence:</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(observability.filtersApplied.minConfidence * 100)}%
                    </Badge>
                  </div>
                )}
                {observability.filtersApplied.manufacturerType && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="secondary" className="text-xs">
                      {observability.filtersApplied.manufacturerType}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Processing Steps */}
        {observability.processingSteps && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <TrendingDown className="w-3.5 h-3.5" />
                Processing Pipeline
              </div>
              <div className="space-y-1.5 pl-5">
                {observability.processingSteps.rawResultsCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Raw Results:</span>
                    <Badge variant="outline" className="text-xs">
                      {observability.processingSteps.rawResultsCount}
                    </Badge>
                  </div>
                )}
                {observability.processingSteps.afterDeduplicationCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">After Deduplication:</span>
                    <Badge variant="outline" className="text-xs">
                      {observability.processingSteps.afterDeduplicationCount}
                    </Badge>
                  </div>
                )}
                {observability.processingSteps.afterFilteringCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">After Filtering:</span>
                    <Badge variant="outline" className="text-xs">
                      {observability.processingSteps.afterFilteringCount}
                    </Badge>
                  </div>
                )}
                {observability.processingSteps.finalCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Final Results:</span>
                    <Badge variant="default" className="text-xs">
                      {observability.processingSteps.finalCount}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

