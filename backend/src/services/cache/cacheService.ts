import { ManufacturerResult, SourcingSearchResponse } from "../../models/manufacturer.js";

interface CachedSearchResult {
  response: SourcingSearchResponse;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// In-memory cache for search results
const searchCache = new Map<string, CachedSearchResult>();

// Cache TTL: 1 hour
const DEFAULT_TTL = 60 * 60 * 1000;

/**
 * Store search results in cache
 */
export function cacheSearchResults(
  searchId: string,
  response: SourcingSearchResponse,
  ttl: number = DEFAULT_TTL
): void {
  searchCache.set(searchId, {
    response,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Get cached search results
 */
export function getCachedSearchResults(searchId: string): SourcingSearchResponse | null {
  const cached = searchCache.get(searchId);
  
  if (!cached) {
    return null;
  }

  // Check if cache has expired
  const age = Date.now() - cached.timestamp;
  if (age > cached.ttl) {
    searchCache.delete(searchId);
    return null;
  }

  return cached.response;
}

/**
 * Get cached manufacturers with sorting and filtering
 */
export async function getCachedManufacturers(options: {
  searchId: string;
  sortBy: "confidence" | "distance" | "price" | "rating";
  order: "asc" | "desc";
  limit: number;
  minConfidence?: number;
  location?: string;
}): Promise<{
  manufacturers: ManufacturerResult[];
  sortBy: string;
  order: string;
  total: number;
}> {
  const cached = getCachedSearchResults(options.searchId);
  
  if (!cached) {
    throw new Error(`Search ID ${options.searchId} not found or expired`);
  }

  let manufacturers = [...cached.results];

  // Apply filters
  if (options.minConfidence !== undefined) {
    const minConfidencePercent = options.minConfidence * 100;
    manufacturers = manufacturers.filter(m => m.confidence >= minConfidencePercent);
  }

  if (options.location) {
    const locationLower = options.location.toLowerCase();
    manufacturers = manufacturers.filter(m => 
      m.address.toLowerCase().includes(locationLower)
    );
  }

  // Sort
  if (options.sortBy === "confidence") {
    manufacturers.sort((a, b) => {
      return options.order === "asc" 
        ? a.confidence - b.confidence
        : b.confidence - a.confidence;
    });
  }
  // Other sort options would require additional data fields

  // Apply limit
  const limited = manufacturers.slice(0, options.limit);

  return {
    manufacturers: limited,
    sortBy: options.sortBy,
    order: options.order,
    total: manufacturers.length,
  };
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [searchId, cached] of searchCache.entries()) {
    const age = now - cached.timestamp;
    if (age > cached.ttl) {
      searchCache.delete(searchId);
    }
  }
}

/**
 * Clear all cache (useful for testing)
 */
export function clearAllCache(): void {
  searchCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ searchId: string; age: number; expiresIn: number }>;
} {
  const now = Date.now();
  const entries = Array.from(searchCache.entries()).map(([searchId, cached]) => ({
    searchId,
    age: now - cached.timestamp,
    expiresIn: cached.ttl - (now - cached.timestamp),
  }));

  return {
    size: searchCache.size,
    entries,
  };
}

// Clean up expired cache every 10 minutes
setInterval(clearExpiredCache, 10 * 60 * 1000);

