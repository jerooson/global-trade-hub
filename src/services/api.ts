import { ManufacturerResult } from "@/components/sourcing/ManufacturerPanel";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface SearchRequest {
  query: string;
  productId?: string;
  filters?: {
    location?: string[];
    minConfidence?: number;
    manufacturerType?: "factory" | "trading" | "both";
  };
  imageUrl?: string;
}

export interface SearchResponse {
  searchId: string;
  query: string;
  parsedQuery: {
    product: string;
    location?: string[];
    type?: "manufacturer" | "product";
    specifications?: Record<string, string>;
    category?: string;
    subcategory?: string;
  };
  results: ManufacturerResult[];
  totalResults: number;
  searchTime: number;
  observability?: {
    searchMethod?: "apify" | "firecrawl" | "mock";
    filtersApplied?: {
      location?: string;
      minConfidence?: number;
      manufacturerType?: "factory" | "trading" | "both";
    };
    processingSteps?: {
      rawResultsCount?: number;
      afterDeduplicationCount?: number;
      afterFilteringCount?: number;
      finalCount?: number;
    };
  };
}

export async function searchManufacturers(
  request: SearchRequest,
  options?: {
    onStream?: (event: {
      type: "parsed" | "result" | "complete" | "error" | "progress";
      data: any;
    }) => void;
  }
): Promise<SearchResponse | null> {
  const useStreaming = options?.onStream !== undefined;
  
  if (useStreaming) {
    // Streaming request using Server-Sent Events
    const response = await fetch(`${API_BASE_URL}/api/sourcing/search?stream=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    if (!reader) {
      throw new Error("Streaming not supported");
    }

    let finalResponse: SearchResponse | null = null;
    const results: ManufacturerResult[] = [];
    let parsedQuery: any = null;
    let observability: any = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          const eventType = line.substring(7).trim();
          continue;
        }
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.substring(6));
          
          if (data.parsedQuery) {
            parsedQuery = data.parsedQuery;
            options.onStream?.({ type: "parsed", data: parsedQuery });
          } else if (data.result) {
            results.push(data.result);
            options.onStream?.({ type: "result", data: data.result });
          } else if (data.progress) {
            // Handle progress updates (searching, deduplicating, filtering)
            options.onStream?.({ type: "progress", data: data.progress });
          } else if (data.searchId) {
            observability = data.observability;
            // Use finalResults from backend if available (filtered), otherwise use streamed results
            const finalResults = data.finalResults || results;
            finalResponse = {
              searchId: data.searchId,
              query: request.query,
              parsedQuery: parsedQuery || { product: request.query },
              results: finalResults,
              totalResults: data.totalResults,
              searchTime: data.searchTime,
              observability,
            };
            options.onStream?.({ type: "complete", data: { ...finalResponse, finalResults } });
          } else if (data.error) {
            options.onStream?.({ type: "error", data: data.error });
          }
        }
      }
    }

    return finalResponse;
  } else {
    // Non-streaming request (original behavior)
    const response = await fetch(`${API_BASE_URL}/api/sourcing/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}
