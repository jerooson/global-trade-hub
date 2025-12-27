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
  };
  results: ManufacturerResult[];
  totalResults: number;
  searchTime: number;
}

export async function searchManufacturers(request: SearchRequest): Promise<SearchResponse> {
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
