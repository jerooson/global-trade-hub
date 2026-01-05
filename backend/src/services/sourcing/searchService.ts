import { SourcingSearchRequest, SourcingSearchResponse, ManufacturerResult } from "../../models/manufacturer.js";

// Simple UUID generator (avoiding external dependency for MVP)
function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Mock scrape results for development/testing when Firecrawl fails
function generateMockScrapeResults(query: string, location?: string): any[] {
  const locationStr = location || "China";
  const baseProducts = ["LED strips", "LED panels", "LED bulbs", "LED modules", "LED drivers"];
  
  return [
    {
      url: `https://detail.1688.com/offer/mock1.html`,
      content: `Company: ${query} Manufacturing Co.
Description: Professional ${query} manufacturer with 10 years experience
Products: ${baseProducts.slice(0, 3).join(", ")}
Location: ${locationStr}
Phone: +86-xxx-xxxx-xxxx
Email: contact@example.com
Factory: We have a 5000 sqm factory with modern production equipment
Certifications: CE, RoHS, ISO 9001`,
      markdown: `# ${query} Manufacturing Co.\n\nProfessional manufacturer\n\nProducts: ${baseProducts.slice(0, 3).join(", ")}`,
      html: `<html><body><h1>${query} Manufacturing Co.</h1><p>Professional manufacturer in ${locationStr}</p></body></html>`,
      metadata: { title: `${query} Manufacturing Co.` }
    },
    {
      url: `https://detail.1688.com/offer/mock2.html`,
      content: `Company: ${locationStr} ${query} Factory
Description: Leading ${query} supplier
Products: ${baseProducts.slice(1, 4).join(", ")}
Location: ${locationStr}
Phone: +86-yyy-yyyy-yyyy
Email: sales@example.com
Factory: 3000 sqm production facility
Certifications: CE, FCC`,
      markdown: `# ${locationStr} ${query} Factory\n\nLeading supplier`,
      html: `<html><body><h1>${locationStr} ${query} Factory</h1></body></html>`,
      metadata: { title: `${locationStr} ${query} Factory` }
    },
    {
      url: `https://company.1688.com/mock3.html`,
      content: `Company: Global ${query} Trading Co.
Description: Trading company specializing in ${query}
Products: ${baseProducts.join(", ")}
Location: ${locationStr}
Phone: +86-zzz-zzzz-zzzz
Email: info@example.com
Certifications: CE`,
      markdown: `# Global ${query} Trading Co.\n\nTrading company`,
      html: `<html><body><h1>Global ${query} Trading Co.</h1></body></html>`,
      metadata: { title: `Global ${query} Trading Co.` }
    }
  ];
}
import { parseQuery } from "../langchain/agent.js";
import { getFirecrawlService } from "../firecrawl/scraper.js";
import { getApifyService } from "../apify/scraper.js";
import { extractManufacturerDataFromScrape, transform1688ToManufacturerResult, transformApifyToManufacturerResult } from "../../utils/transformers.js";
import { classifyManufacturer } from "../classifier/manufacturer.js";
import { calculateConfidenceScore, sortManufacturers, filterManufacturers } from "../enrichment/data.js";
import { cacheSearchResults } from "../cache/cacheService.js";
import { config } from "../../config/env.js";

/**
 * Main search service that orchestrates the entire sourcing flow
 */
export async function searchManufacturers(
  request: SourcingSearchRequest,
  options?: {
    onProgress?: (progress: {
      type: "parsed" | "result" | "complete" | "error" | "progress";
      data: any;
    }) => void;
  }
): Promise<SourcingSearchResponse> {
  const searchId = generateUUID();
  const startTime = Date.now();

  try {
    // Step 1: Parse the natural language query
    const parsedQuery = await parseQuery(request.query);
    console.log("Parsed query:", parsedQuery);
    
    // Stream parsed query if streaming is enabled
    options?.onProgress?.({
      type: "parsed",
      data: parsedQuery,
    });

    // Step 2: Search 1688.com using Apify (preferred) or Firecrawl (fallback)
    const searchLocation = request.filters?.location?.[0] || parsedQuery.location?.[0];
    const searchQuery = parsedQuery.product || request.query;
    
    console.log(`Searching Made in China/1688.com for: ${searchQuery}${searchLocation ? ` in ${searchLocation}` : ""}`);
    
    let manufacturerResults: ManufacturerResult[] = [];
    let searchMethod: "apify" | "firecrawl" | "mock" = "mock";
    let rawResultsCount = 0;
    
    // Try Apify first (if configured)
    // Check both process.env and config for API key
    const apifyApiKey = process.env.APIFY_API_KEY || config.apifyApiKey;
    console.log(`[DEBUG] Apify API key check: ${apifyApiKey ? 'FOUND (length: ' + apifyApiKey.length + ')' : 'NOT FOUND'}`);
    if (apifyApiKey) {
      try {
        console.log("[DEBUG] Attempting to use Apify service...");
        const apifyService = getApifyService();
        console.log("[DEBUG] Apify service initialized successfully, calling search1688...");
        console.log(`[DEBUG] Search parameters - Query: "${searchQuery}", Location: "${searchLocation || 'none'}", Category: "${request.category || parsedQuery.category || 'none'}", Subcategory: "${request.subcategory || parsedQuery.subcategory || 'none'}"`);
        const apifyResults = await apifyService.search1688(searchQuery, {
          location: searchLocation,
          maxItems: 10,
          category: request.category || parsedQuery.category,
          subcategory: request.subcategory || parsedQuery.subcategory,
        });
        
        console.log(`[DEBUG] Apify returned ${apifyResults.length} results`);
        // Log first few results' locations for debugging
        if (apifyResults.length > 0 && searchLocation) {
          console.log(`[DEBUG] Sample locations from Apify results (checking if location filter worked):`);
          apifyResults.slice(0, 3).forEach((result, idx) => {
            const loc = (result as any).supplierLocation || (result as any).location || (result as any).company_location || (result as any).address || "unknown";
            console.log(`  Result ${idx + 1}: ${loc}`);
          });
        }
        rawResultsCount = apifyResults.length;
        searchMethod = "apify";
        
        // Emit progress event after determining search method
        options?.onProgress?.({
          type: "progress",
          data: {
            step: "searching",
            searchMethod: "apify",
            message: "Searching Apify (Made-in-China)...",
          },
        });
        
        // Transform Apify results to ManufacturerResult format
        for (let i = 0; i < apifyResults.length; i++) {
          const apifyResult = apifyResults[i];
          const sellerId = `apify_${i}_${Date.now()}`;
          
          try {
            const manufacturerData = transformApifyToManufacturerResult(apifyResult, sellerId);
            
            // Classify manufacturer type
            const classification = await classifyManufacturer(sellerId, {
              companyName: manufacturerData.companyName,
              description: manufacturerData.description,
              products: manufacturerData.products,
              factoryInfo: manufacturerData.factoryInfo?.factoryAddress,
              certifications: manufacturerData.productInfo?.certifications,
            });
            
            // Calculate confidence score
            const confidence = calculateConfidenceScore(manufacturerData, classification.confidence);
            
            // Transform to frontend format
            const result = transform1688ToManufacturerResult(manufacturerData, {
              type: classification.type,
              confidence: classification.confidence,
            });
            
            result.confidence = confidence;
            manufacturerResults.push(result);
            
            // Stream individual result if streaming is enabled
            options?.onProgress?.({
              type: "result",
              data: result,
            });
          } catch (error: any) {
            console.warn(`Error processing Apify result ${i}:`, error.message);
          }
        }
      } catch (error: any) {
        console.warn("Apify search failed, trying Firecrawl:", error.message);
        // Fall through to Firecrawl fallback
      }
    }
    
    // Fallback to Firecrawl if Apify not configured or failed
    if (manufacturerResults.length === 0) {
      try {
        const firecrawlService = getFirecrawlService();
        const scrapeResults = await firecrawlService.search1688(searchQuery, {
          location: searchLocation,
          limit: 10, // Match Apify maxItems
        });
        console.log(`Firecrawl found ${scrapeResults.length} pages to process`);
        rawResultsCount = scrapeResults.length;
        searchMethod = "firecrawl";
        
        // Emit progress event after determining search method
        options?.onProgress?.({
          type: "progress",
          data: {
            step: "searching",
            searchMethod: "firecrawl",
            message: "Searching Firecrawl...",
          },
        });
        
        // Process Firecrawl results
        for (let i = 0; i < scrapeResults.length; i++) {
          const scrapeResult = scrapeResults[i];
          const sellerId = `1688_${i}_${Date.now()}`;
          
          try {
            const manufacturerData = extractManufacturerDataFromScrape(scrapeResult, sellerId);
            const classification = await classifyManufacturer(sellerId, {
              companyName: manufacturerData.companyName,
              description: manufacturerData.description,
              products: manufacturerData.products,
              factoryInfo: manufacturerData.factoryInfo?.factoryAddress,
              certifications: manufacturerData.productInfo?.certifications,
            });
            
            const confidence = calculateConfidenceScore(manufacturerData, classification.confidence);
            const result = transform1688ToManufacturerResult(manufacturerData, {
              type: classification.type,
              confidence: classification.confidence,
            });
            
            result.confidence = confidence;
            manufacturerResults.push(result);
          } catch (error: any) {
            console.warn(`Error processing result ${i}:`, error.message);
          }
        }
      } catch (error: any) {
        console.warn("Firecrawl scraping failed, using mock data:", error.message);
        // Fallback to mock data
        const scrapeResults = generateMockScrapeResults(searchQuery, searchLocation);
        console.log(`Using ${scrapeResults.length} mock results for testing`);
        rawResultsCount = scrapeResults.length;
        searchMethod = "mock";
        
        // Emit progress event after determining search method
        options?.onProgress?.({
          type: "progress",
          data: {
            step: "searching",
            searchMethod: "mock",
            message: "Searching Mock Data...",
          },
        });
        
        // Process mock results
        for (let i = 0; i < scrapeResults.length; i++) {
          const scrapeResult = scrapeResults[i];
          const sellerId = `mock_${i}_${Date.now()}`;
          
          try {
            const manufacturerData = extractManufacturerDataFromScrape(scrapeResult, sellerId);
            const classification = await classifyManufacturer(sellerId, {
              companyName: manufacturerData.companyName,
              description: manufacturerData.description,
              products: manufacturerData.products,
              factoryInfo: manufacturerData.factoryInfo?.factoryAddress,
              certifications: manufacturerData.productInfo?.certifications,
            });
            
            const confidence = calculateConfidenceScore(manufacturerData, classification.confidence);
            const result = transform1688ToManufacturerResult(manufacturerData, {
              type: classification.type,
              confidence: classification.confidence,
            });
            
            result.confidence = confidence;
            manufacturerResults.push(result);
            
            // Stream individual result if streaming is enabled
            options?.onProgress?.({
              type: "result",
              data: result,
            });
          } catch (error: any) {
            console.warn(`Error processing mock result ${i}:`, error.message);
          }
        }
      }
    }

    // Step 4: Deduplicate manufacturers by company name and URL
    const seenCompanies = new Map<string, ManufacturerResult>();
    for (const result of manufacturerResults) {
      // Normalize company name: lowercase, trim, remove common suffixes variations
      let normalizedName = result.name.toLowerCase().trim();
      // Remove trailing periods, commas, and common company suffixes variations
      normalizedName = normalizedName.replace(/[.,]+$/, "").trim();
      // Normalize common company type suffixes
      normalizedName = normalizedName.replace(/\s+(co\.?|ltd\.?|inc\.?|corp\.?|company|limited)\s*\.?$/i, "");
      
      const companyUrl = result.links?.companyUrl || "";
      // Use company URL if available, otherwise use normalized name
      const key = companyUrl ? `${normalizedName}|${companyUrl}` : normalizedName;
      
      // If we've seen this company before, keep the one with higher confidence
      if (seenCompanies.has(key)) {
        const existing = seenCompanies.get(key)!;
        // Merge products from both entries
        const allProducts = new Set([...existing.products, ...result.products]);
        
        // If new result has higher confidence, replace it but keep merged products
        if (result.confidence > existing.confidence) {
          const mergedResult = { ...result };
          mergedResult.products = Array.from(allProducts);
          seenCompanies.set(key, mergedResult);
        } else {
          // Keep existing but update products
          existing.products = Array.from(allProducts);
        }
      } else {
        seenCompanies.set(key, result);
      }
    }
    manufacturerResults = Array.from(seenCompanies.values());
    console.log(`[Deduplication] Results after deduplication: ${manufacturerResults.length}`);
    
    // Emit progress event after deduplication
    options?.onProgress?.({
      type: "progress",
      data: {
        step: "deduplicating",
        beforeCount: rawResultsCount,
        afterCount: manufacturerResults.length,
        message: `Found ${rawResultsCount} results, deduplicated to ${manufacturerResults.length}`,
      },
    });

    // Step 5: Apply filters (use parsed location from query if available)
    const filterLocation = request.filters?.location?.[0] || parsedQuery.location?.[0];
    console.log(`[Filter] Applying filters - Location: ${filterLocation || "none"}, Results before filter: ${manufacturerResults.length}`);
    const beforeFilterCount = manufacturerResults.length;
    let filteredResults = filterManufacturers(manufacturerResults, {
      minConfidence: request.filters?.minConfidence,
      location: filterLocation, // Use parsed location from query
      manufacturerType: request.filters?.manufacturerType,
    });
    console.log(`[Filter] Results after filter: ${filteredResults.length}`);
    
    // Emit progress event after filtering
    options?.onProgress?.({
      type: "progress",
      data: {
        step: "filtering",
        beforeCount: beforeFilterCount,
        afterCount: filteredResults.length,
        filtersApplied: {
          location: filterLocation,
          minConfidence: request.filters?.minConfidence,
          manufacturerType: request.filters?.manufacturerType,
        },
        message: `Applied filters: ${beforeFilterCount} → ${filteredResults.length} results`,
      },
    });

    // Step 6: Sort by confidence
    filteredResults = sortManufacturers(filteredResults, "confidence", "desc");

    // Step 7: Limit results (top 10 for better variety)
    const limitedResults = filteredResults.slice(0, 10);

    // Step 8: Build response with observability
    const response: SourcingSearchResponse = {
      searchId,
      query: request.query,
      parsedQuery,
      results: limitedResults,
      totalResults: filteredResults.length,
      searchTime: 0, // Will be calculated by route handler
      observability: {
        searchMethod,
        filtersApplied: {
          location: filterLocation,
          minConfidence: request.filters?.minConfidence,
          manufacturerType: request.filters?.manufacturerType,
        },
        processingSteps: {
          rawResultsCount,
          afterDeduplicationCount: manufacturerResults.length,
          afterFilteringCount: filteredResults.length,
          finalCount: limitedResults.length,
        },
      },
    };

    // Step 9: Cache results
    cacheSearchResults(searchId, response);

    console.log(`Search completed: ${limitedResults.length} results found`);

    // Stream completion if streaming is enabled
    options?.onProgress?.({
      type: "complete",
      data: {
        searchId,
        totalResults: filteredResults.length,
        observability: response.observability,
        finalResults: limitedResults, // Send the filtered & limited results
      },
    });

    return response;
  } catch (error: any) {
    console.error("Error in searchManufacturers:", error);
    
    // Stream error if streaming is enabled
    options?.onProgress?.({
      type: "error",
      data: error.message,
    });
    
    throw new Error(`Search failed: ${error.message}`);
  }
}

