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
  request: SourcingSearchRequest
): Promise<SourcingSearchResponse> {
  const searchId = generateUUID();
  const startTime = Date.now();

  try {
    // Step 1: Parse the natural language query
    const parsedQuery = await parseQuery(request.query);
    console.log("Parsed query:", parsedQuery);

    // Step 2: Search 1688.com using Apify (preferred) or Firecrawl (fallback)
    const searchLocation = request.filters?.location?.[0] || parsedQuery.location?.[0];
    const searchQuery = parsedQuery.product || request.query;
    
    console.log(`Searching Made in China/1688.com for: ${searchQuery}${searchLocation ? ` in ${searchLocation}` : ""}`);
    
    let manufacturerResults: ManufacturerResult[] = [];
    
    // Try Apify first (if configured)
    // Check both process.env and config for API key
    const apifyApiKey = process.env.APIFY_API_KEY || config.apifyApiKey;
    console.log(`[DEBUG] Apify API key check: ${apifyApiKey ? 'FOUND (length: ' + apifyApiKey.length + ')' : 'NOT FOUND'}`);
    if (apifyApiKey) {
      try {
        console.log("[DEBUG] Attempting to use Apify service...");
        const apifyService = getApifyService();
        console.log("[DEBUG] Apify service initialized successfully, calling search1688...");
        const apifyResults = await apifyService.search1688(searchQuery, {
          location: searchLocation,
          maxItems: 2,
        });
        
        console.log(`Apify returned ${apifyResults.length} results`);
        
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
          limit: 2,
        });
        console.log(`Firecrawl found ${scrapeResults.length} pages to process`);
        
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
          } catch (error: any) {
            console.warn(`Error processing mock result ${i}:`, error.message);
          }
        }
      }
    }

    // Step 4: Apply filters
    let filteredResults = filterManufacturers(manufacturerResults, {
      minConfidence: request.filters?.minConfidence,
      location: request.filters?.location?.[0],
      manufacturerType: request.filters?.manufacturerType,
    });

    // Step 5: Sort by confidence
    filteredResults = sortManufacturers(filteredResults, "confidence", "desc");

    // Step 5: Limit results (top 2)
    const limitedResults = filteredResults.slice(0, 2);

    // Step 6: Build response
    const response: SourcingSearchResponse = {
      searchId,
      query: request.query,
      parsedQuery,
      results: limitedResults,
      totalResults: filteredResults.length,
      searchTime: 0, // Will be calculated by route handler
    };

    // Step 7: Cache results
    cacheSearchResults(searchId, response);

    console.log(`Search completed: ${limitedResults.length} results found`);

    return response;
  } catch (error: any) {
    console.error("Error in searchManufacturers:", error);
    throw new Error(`Search failed: ${error.message}`);
  }
}

