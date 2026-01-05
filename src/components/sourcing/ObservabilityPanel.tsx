import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, CheckCircle2, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchResponse } from "@/services/api";

type ProcessingStep = "idle" | "parsing" | "searching" | "deduplicating" | "filtering" | "complete";

interface StreamingObservabilityData {
  currentStep: ProcessingStep;
  parsedQuery?: any;
  searchMethod?: "apify" | "firecrawl" | "mock";
  deduplication?: {
    beforeCount: number;
    afterCount: number;
  };
  filtering?: {
    beforeCount: number;
    afterCount: number;
    filtersApplied?: any;
  };
  processingSteps?: any;
}

interface ObservabilityPanelProps {
  // Legacy support for complete response
  response?: SearchResponse;
  // New streaming support
  streamingData?: StreamingObservabilityData;
}

export function ObservabilityPanel({ response, streamingData }: ObservabilityPanelProps) {
  // Determine if we're in streaming mode or legacy mode
  const isStreaming = !!streamingData;
  const currentStep = streamingData?.currentStep || "complete";

  // Debug logging (can be removed in production)
  if (isStreaming && currentStep !== "complete") {
    console.log("[ObservabilityPanel] Step:", currentStep);
  }

  // Get data from either streaming or legacy response
  const parsedQuery = streamingData?.parsedQuery || response?.parsedQuery;
  const searchMethod = streamingData?.searchMethod || response?.observability?.searchMethod;
  const filtersApplied = streamingData?.filtering?.filtersApplied || response?.observability?.filtersApplied;
  const processingSteps = streamingData?.processingSteps || response?.observability?.processingSteps;

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

  // Determine section states
  const parsedComplete = currentStep !== "idle" && currentStep !== "parsing";
  const searchingComplete = ["deduplicating", "filtering", "complete"].includes(currentStep);
  const deduplicatingComplete = ["filtering", "complete"].includes(currentStep);
  const filteringComplete = currentStep === "complete";

  const parsedInProgress = currentStep === "parsing";
  const searchingInProgress = currentStep === "searching";
  const deduplicatingInProgress = currentStep === "deduplicating";
  const filteringInProgress = currentStep === "filtering";

  const showParsedSection = parsedQuery || parsedInProgress || searchingInProgress || deduplicatingInProgress || filteringInProgress || filteringComplete;
  const showSearchSection = searchingInProgress || searchingComplete;
  const showDeduplicationSection = deduplicatingInProgress || deduplicatingComplete;
  const showFilteringSection = filteringInProgress || filteringComplete;

  if (!parsedQuery && !isStreaming) {
    return null;
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Agent Decision Tree
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Parsed Query Section */}
        {showParsedSection && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {parsedInProgress ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              ) : parsedComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>Parsed Query</span>
              {parsedInProgress && <span className="text-xs text-blue-500 ml-auto">Thinking...</span>}
            </div>
            {parsedQuery && parsedComplete && (
              <div className="space-y-1.5 pl-5 animate-in fade-in slide-in-from-left-2 duration-300">
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
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showParsedSection && showSearchSection && <Separator />}

        {/* Search Method Section */}
        {showSearchSection && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {searchingInProgress ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              ) : searchingComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>Search Method</span>
              {searchingInProgress && <span className="text-xs text-blue-500 ml-auto">Searching...</span>}
            </div>
            {searchMethod && (
              <div className="pl-5 animate-in fade-in slide-in-from-left-2 duration-300">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    searchMethodColors[searchMethod]
                  )}
                >
                  {searchMethodLabels[searchMethod]}
                </Badge>
              </div>
            )}
          </div>
        )}

        {showSearchSection && showDeduplicationSection && <Separator />}

        {/* Deduplication Section */}
        {showDeduplicationSection && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {deduplicatingInProgress ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              ) : deduplicatingComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>Deduplication</span>
              {deduplicatingInProgress && <span className="text-xs text-blue-500 ml-auto">Processing...</span>}
            </div>
            {streamingData?.deduplication && (
              <div className="pl-5 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{streamingData.deduplication.beforeCount}</span>
                  <span>→</span>
                  <Badge variant="secondary" className="text-xs">
                    {streamingData.deduplication.afterCount}
                  </Badge>
                  <span className="text-xs">results</span>
                </div>
              </div>
            )}
          </div>
        )}

        {showDeduplicationSection && showFilteringSection && <Separator />}

        {/* Filtering Section */}
        {showFilteringSection && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {filteringInProgress ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              ) : filteringComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>Filters Applied</span>
              {filteringInProgress && <span className="text-xs text-blue-500 ml-auto">Filtering...</span>}
            </div>
            {(filtersApplied || streamingData?.filtering) && (
              <div className="space-y-1.5 pl-5 animate-in fade-in slide-in-from-left-2 duration-300">
                {streamingData?.filtering && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <span>{streamingData.filtering.beforeCount}</span>
                    <span>→</span>
                    <Badge variant="secondary" className="text-xs">
                      {streamingData.filtering.afterCount}
                    </Badge>
                    <span className="text-xs">results</span>
                  </div>
                )}
                {filtersApplied?.location && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Location:</span>
                    <Badge variant="secondary" className="text-xs">
                      {filtersApplied.location}
                    </Badge>
                  </div>
                )}
                {filtersApplied?.minConfidence !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Min Confidence:</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(filtersApplied.minConfidence * 100)}%
                    </Badge>
                  </div>
                )}
                {filtersApplied?.manufacturerType && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="secondary" className="text-xs">
                      {filtersApplied.manufacturerType}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {filteringComplete && processingSteps && <Separator />}

        {/* Processing Pipeline (Final Summary - Legacy) */}
        {processingSteps && filteringComplete && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              Processing Pipeline
            </div>
            <div className="space-y-1.5 pl-5">
              {processingSteps.rawResultsCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Raw Results:</span>
                  <Badge variant="outline" className="text-xs">
                    {processingSteps.rawResultsCount}
                  </Badge>
                </div>
              )}
              {processingSteps.afterDeduplicationCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">After Deduplication:</span>
                  <Badge variant="outline" className="text-xs">
                    {processingSteps.afterDeduplicationCount}
                  </Badge>
                </div>
              )}
              {processingSteps.afterFilteringCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">After Filtering:</span>
                  <Badge variant="outline" className="text-xs">
                    {processingSteps.afterFilteringCount}
                  </Badge>
                </div>
              )}
              {processingSteps.finalCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Final Results:</span>
                  <Badge variant="default" className="text-xs">
                    {processingSteps.finalCount}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
