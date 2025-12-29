import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getFirecrawlService } from "../firecrawl/scraper.js";
import { classifyManufacturer } from "../classifier/manufacturer.js";
import { extractManufacturerDataFromScrape } from "../../utils/transformers.js";

/**
 * Tool: Search 1688.com for manufacturers
 */
// @ts-expect-error - LangChain types are too complex for TypeScript to infer
export const search1688Tool = new DynamicStructuredTool({
  name: "search_1688",
  description: "Search 1688.com (Chinese B2B marketplace) for manufacturers and suppliers based on product keywords and location",
  schema: z.object({
    query: z.string().describe("Product or manufacturer search query in Chinese or English"),
    location: z.string().optional().describe("Location filter (e.g., 'Ningbo', 'Shenzhen', 'Zhejiang')"),
    limit: z.number().optional().default(10).describe("Maximum number of results to return"),
  }),
  func: async ({ query, location, limit }: { query: string; location?: string; limit?: number }) => {
    try {
      const firecrawlService = getFirecrawlService();
      const results = await firecrawlService.search1688(query, {
        location,
        limit,
      });

      return JSON.stringify({
        success: true,
        count: results.length,
        results: results.map(r => ({
          url: r.url,
          title: r.metadata?.title || "Untitled",
          hasContent: !!r.content,
        })),
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Tool: Classify manufacturer type
 */
// @ts-expect-error - LangChain types are too complex for TypeScript to infer
export const classifyManufacturerTool = new DynamicStructuredTool({
  name: "classify_manufacturer",
  description: "Classify a 1688.com seller as a Factory or Trading Company based on their business information",
  schema: z.object({
    sellerId: z.string().describe("Unique seller ID from 1688.com"),
    companyName: z.string().describe("Company name"),
    description: z.string().optional().describe("Company description"),
    products: z.array(z.string()).describe("List of products they sell"),
    factoryInfo: z.string().optional().describe("Factory information if available"),
    certifications: z.array(z.string()).optional().describe("Certifications held by the company"),
  }),
  func: async ({ sellerId, companyName, description, products, factoryInfo, certifications }: { 
    sellerId: string; 
    companyName: string; 
    description?: string; 
    products: string[]; 
    factoryInfo?: string; 
    certifications?: string[] 
  }) => {
    try {
      const result = await classifyManufacturer(sellerId, {
        companyName,
        description,
        products,
        factoryInfo,
        certifications,
      });

      return JSON.stringify({
        success: true,
        type: result.type,
        confidence: result.confidence,
        explanation: result.explanation,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Tool: Extract detailed manufacturer information from scraped page
 */
// @ts-expect-error - LangChain types are too complex for TypeScript to infer
export const extractDetailsTool = new DynamicStructuredTool({
  name: "extract_details",
  description: "Extract detailed manufacturer information from a scraped 1688.com page",
  schema: z.object({
    url: z.string().describe("URL of the 1688.com page to extract data from"),
    sellerId: z.string().describe("Unique seller ID"),
  }),
  func: async ({ url, sellerId }: { url: string; sellerId: string }) => {
    try {
      const firecrawlService = getFirecrawlService();
      const scrapeResult = await firecrawlService.scrapeUrl(url);
      const manufacturerData = extractManufacturerDataFromScrape(scrapeResult, sellerId);

      return JSON.stringify({
        success: true,
        data: {
          companyName: manufacturerData.companyName,
          description: manufacturerData.description,
          products: manufacturerData.products,
          contact: manufacturerData.contact,
          location: manufacturerData.location,
          factoryInfo: manufacturerData.factoryInfo,
        },
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

