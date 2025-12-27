import { ApifyClient } from "apify-client";
import { config } from "../../config/env.js";

export interface Apify1688Result {
  title?: string;
  price?: string;
  companyName?: string;
  companyUrl?: string;
  productUrl?: string;
  imageUrl?: string;
  location?: string;
  moq?: string;
  [key: string]: any;
}

class Apify1688Service {
  private client: ApifyClient;
  // Using Made in China scraper (free/cheaper alternative to 1688.com)
  // Cost comparison:
  // - agenscrape: $0.00005/event (Actor Start), $0.001/event (result) = ~$0.30 per search
  // - parseforge: $0.04/event (Actor Start), $0.012/event (result) = ~$0.88 per search (3x more expensive)
  // Using agenscrape for cost efficiency. For detailed company info (phone/email), scrape supplierUrl separately.
  private actorId: string = "agenscrape/made-in-china-com-product-scraper"; // Cost-effective actor
  private alternativeActorIds: string[] = [
    "parseforge/made-in-china-scraper", // More expensive but has better data (location, companyInfo)
  ];

  constructor() {
    const apiKey = process.env.APIFY_API_KEY || config.apifyApiKey;
    if (!apiKey) {
      throw new Error("APIFY_API_KEY is not configured");
    }
    console.log("Initializing Apify client...");
    this.client = new ApifyClient({
      token: apiKey,
    });
    console.log("Apify client initialized successfully");
  }

  /**
   * Search 1688.com using Apify actor
   */
  async search1688(
    query: string,
    options?: {
      location?: string;
      maxItems?: number;
      page?: number;
    }
  ): Promise<Apify1688Result[]> {
    // Try primary actor first, then alternatives
    const actorsToTry = [this.actorId, ...this.alternativeActorIds];
    
    for (const actorId of actorsToTry) {
      try {
        console.log(`[Apify] Trying actor: ${actorId} for query: ${query}`);

        // Prepare input for Apify actor (Made in China format)
        // Different actors may use different parameter names
        const input: any = {
          keyword: query,
          searchQuery: query, // Some actors use searchQuery instead
          query: query, // Some actors use query
          maxItems: options?.maxItems || 2,
          maxResults: options?.maxItems || 2, // Alternative parameter name
        };

        // Add location filter if provided (Made in China accepts location names)
        if (options?.location) {
          input.location = options.location;
          input.city = options.location; // Some actors use 'city'
        }

        console.log(`[Apify] Calling actor ${actorId} with input:`, JSON.stringify(input, null, 2));

        // Run the Apify actor with timeout
        const run = await Promise.race([
          this.client.actor(actorId).call(input),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Actor call timeout after 60 seconds')), 60000)
          )
        ]) as any;

        // Wait for the run to finish and get results
        console.log(`[Apify] Run started, waiting for results... (run ID: ${run.id})`);
        
        // Poll for results with timeout
        let items: any[] = [];
        const maxWaitTime = 120000; // 2 minutes max
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
          const dataset = await this.client.dataset(run.defaultDatasetId).listItems();
          items = dataset.items;
          
          if (items.length > 0 || run.status === 'SUCCEEDED' || run.status === 'FAILED') {
            break;
          }
          
          // Wait a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (items.length === 0) {
          console.warn(`[Apify] No items returned after waiting, run status: ${run.status}`);
        }

        console.log(`[Apify] Actor ${actorId} returned ${items.length} results from Made in China`);
        
        // Log first item structure for debugging
        if (items.length > 0) {
          console.log(`[Apify] Sample item structure:`, JSON.stringify(items[0], null, 2));
          console.log(`[Apify] Sample item keys:`, Object.keys(items[0]));
          // Also log what we're trying to extract
          console.log(`[Apify] Extracted companyName:`, items[0].companyName || items[0].supplierName || items[0].title || items[0].name || 'NOT FOUND');
        }

        return items as Apify1688Result[];
      } catch (error: any) {
        console.warn(`[Apify] Actor ${actorId} failed:`, error.message);
        
        // If actor not found or requires payment, try next one
        if (error.type === 'actor-not-found' || error.type === 'actor-is-not-rented' || error.statusCode === 404 || error.statusCode === 403) {
          console.log(`[Apify] Trying next alternative actor...`);
          continue; // Try next actor
        }
        
        // For other errors, throw immediately
        throw new Error(`Apify search failed with ${actorId}: ${error.message}`);
      }
    }
    
    // If all actors failed
    throw new Error(`All Apify actors failed. Please check Apify platform for available Made in China scrapers at https://apify.com/store?search=made%20in%20china`);
  }

  /**
   * Map location name (Made in China accepts location names directly)
   * Kept for backward compatibility
   */
  private mapLocationToProvince(location: string): string | null {
    // Made in China accepts location names directly
    const locationMap: Record<string, string> = {
      ningbo: "Ningbo",
      shenzhen: "Shenzhen",
      guangzhou: "Guangzhou",
      shanghai: "Shanghai",
      beijing: "Beijing",
      zhejiang: "Zhejiang",
      guangdong: "Guangdong",
      jiangsu: "Jiangsu",
      shandong: "Shandong",
    };

    const normalized = location.toLowerCase().trim();
    return locationMap[normalized] || location; // Return mapped or original
  }

  /**
   * Get detailed product information from a 1688.com product URL
   */
  async getProductDetails(productUrl: string): Promise<Apify1688Result | null> {
    try {
      // Use Apify's web scraper to get product details
      const run = await this.client.actor("apify/web-scraper").call({
        startUrls: [{ url: productUrl }],
        pageFunction: `
          async function pageFunction(context) {
            const { page, request } = context;
            await page.waitForSelector('body');
            
            return {
              title: await page.$eval('h1', el => el.textContent).catch(() => ''),
              price: await page.$eval('.price', el => el.textContent).catch(() => ''),
              companyName: await page.$eval('.company-name', el => el.textContent).catch(() => ''),
              description: await page.$eval('.description', el => el.textContent).catch(() => ''),
              images: await page.$$eval('.product-image img', imgs => imgs.map(img => img.src)),
            };
          }
        `,
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      return items[0] as Apify1688Result || null;
    } catch (error: any) {
      console.error(`Error getting product details from ${productUrl}:`, error);
      return null;
    }
  }
}

// Singleton instance
let apifyServiceInstance: Apify1688Service | null = null;

export function getApifyService(): Apify1688Service {
  if (!apifyServiceInstance) {
    try {
      console.log("Creating new Apify service instance...");
      apifyServiceInstance = new Apify1688Service();
      console.log("Apify service instance created successfully");
    } catch (error: any) {
      console.error("Failed to create Apify service:", error.message);
      throw error;
    }
  }
  return apifyServiceInstance;
}

