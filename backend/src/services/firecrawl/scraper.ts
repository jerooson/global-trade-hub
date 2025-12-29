import FirecrawlApp from "@mendable/firecrawl-js";
import { config } from "../../config/env.js";

export interface ScrapeResult {
  url: string;
  content?: string;
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
}

class FirecrawlService {
  private client: FirecrawlApp;
  private rateLimitDelay: number = 1000; // 1 second between requests

  constructor() {
    if (!config.firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }
    this.client = new FirecrawlApp({ apiKey: config.firecrawlApiKey });
  }

  /**
   * Scrape a single URL (1688.com page)
   */
  async scrapeUrl(url: string, options?: {
    formats?: ("markdown" | "html" | "rawHtml")[];
    onlyMainContent?: boolean;
    headers?: Record<string, string>;
    cookies?: string;
  }): Promise<ScrapeResult> {
    try {
      // For 1688.com, we may need special headers/cookies
      const scrapeOptions: any = {
        formats: options?.formats || ["markdown", "html"],
        onlyMainContent: options?.onlyMainContent ?? true,
      };

      // Add custom headers for 1688.com if needed
      if (url.includes("1688.com")) {
        scrapeOptions.headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Referer": "https://www.1688.com/",
          ...options?.headers,
        };
        if (options?.cookies) {
          scrapeOptions.cookies = options.cookies;
        }
      }

      const result = await this.client.scrapeUrl(url, scrapeOptions);

      // Check if result is an error
      if ('error' in result) {
        throw new Error(result.error || 'Unknown error from Firecrawl');
      }

      return {
        url: result.url || url,
        content: result.markdown || result.html || "",
        markdown: result.markdown,
        html: result.html,
        metadata: result.metadata,
      };
    } catch (error: any) {
      console.error(`Error scraping ${url}:`, error.message);
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  /**
   * Search 1688.com for products/manufacturers
   * Note: This is a placeholder - actual 1688.com search requires their API or specific scraping strategy
   */
  async search1688(query: string, options?: {
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<ScrapeResult[]> {
    // Construct 1688.com search URL
    // Format: https://s.1688.com/selloffer/offer_search.htm?keywords={query}&province={location}
    const searchParams = new URLSearchParams({
      keywords: query,
    });

    if (options?.location) {
      // Map location to 1688 province code if needed
      searchParams.append("province", this.mapLocationToProvince(options.location));
    }

    const searchUrl = `https://s.1688.com/selloffer/offer_search.htm?${searchParams.toString()}`;
    
    try {
      // Scrape the search results page
      const result = await this.scrapeUrl(searchUrl, {
        formats: ["markdown", "html"],
        onlyMainContent: true,
      });

      // Extract product/supplier links from the search results
      const supplierUrls = this.extractSupplierUrls(result.html || result.content || "");
      
      // Scrape individual supplier pages (with rate limiting)
      const supplierResults: ScrapeResult[] = [];
      for (const supplierUrl of supplierUrls.slice(0, options?.limit || 10)) {
        await this.delay(this.rateLimitDelay);
        try {
          const supplierData = await this.scrapeUrl(supplierUrl, {
            formats: ["markdown", "html"],
            onlyMainContent: true,
          });
          supplierResults.push(supplierData);
        } catch (error) {
          console.warn(`Failed to scrape supplier ${supplierUrl}:`, error);
          // Continue with other suppliers
        }
      }

      return supplierResults;
    } catch (error: any) {
      console.error("Error searching 1688.com:", error.message);
      throw new Error(`Failed to search 1688.com: ${error.message}`);
    }
  }

  /**
   * Extract supplier/product URLs from 1688.com search results HTML
   */
  private extractSupplierUrls(html: string): string[] {
    const urls: string[] = [];
    
    // 1688.com search results typically have links like:
    // https://detail.1688.com/offer/xxxxx.html
    // or https://company.1688.com/xxxxx.html
    const urlPattern = /https?:\/\/(?:detail|company)\.1688\.com\/[^\s"']+/g;
    const matches = html.match(urlPattern);
    
    if (matches) {
      // Remove duplicates
      const uniqueUrls = [...new Set(matches)];
      urls.push(...uniqueUrls);
    }
    
    return urls;
  }

  /**
   * Map location name to 1688.com province code
   */
  private mapLocationToProvince(location: string): string {
    const locationMap: Record<string, string> = {
      "ningbo": "330200", // Ningbo, Zhejiang
      "shenzhen": "440300", // Shenzhen, Guangdong
      "guangzhou": "440100", // Guangzhou, Guangdong
      "shanghai": "310000", // Shanghai
      "beijing": "110000", // Beijing
      "zhejiang": "330000", // Zhejiang Province
      "guangdong": "440000", // Guangdong Province
    };

    const normalized = location.toLowerCase().trim();
    return locationMap[normalized] || "";
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError || new Error("Max retries exceeded");
  }
}

// Singleton instance
let firecrawlServiceInstance: FirecrawlService | null = null;

export function getFirecrawlService(): FirecrawlService {
  if (!firecrawlServiceInstance) {
    firecrawlServiceInstance = new FirecrawlService();
  }
  return firecrawlServiceInstance;
}

