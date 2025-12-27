import express from "express";
import { z } from "zod";
import { searchManufacturers } from "../services/sourcing/searchService.js";
import { classifyManufacturer } from "../services/classifier/manufacturer.js";
import { getCachedManufacturers } from "../services/cache/cacheService.js";

const router = express.Router();

// Validation schemas
const searchRequestSchema = z.object({
  query: z.string().min(1),
  productId: z.string().optional(),
  filters: z.object({
    location: z.array(z.string()).optional(),
    minConfidence: z.number().min(0).max(1).optional(),
    manufacturerType: z.enum(["factory", "trading", "both"]).optional(),
  }).optional(),
  imageUrl: z.string().url().optional(),
});

const classifyRequestSchema = z.object({
  sellerId: z.string().min(1),
  sellerData: z.object({
    companyName: z.string().min(1),
    description: z.string().optional(),
    products: z.array(z.string()),
    factoryInfo: z.string().optional(),
    certifications: z.array(z.string()).optional(),
  }),
});

/**
 * POST /api/sourcing/search
 * Search for manufacturers based on natural language query
 */
router.post("/search", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const validated = searchRequestSchema.parse(req.body);
    
    const startTime = Date.now();
    const result = await searchManufacturers(validated);
    const searchTime = (Date.now() - startTime) / 1000;
    
    res.json({
      ...result,
      searchTime: parseFloat(searchTime.toFixed(2)),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    } else {
      next(error);
    }
  }
});

/**
 * POST /api/sourcing/classify
 * Classify a single manufacturer as factory or trading company
 */
router.post("/classify", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const validated = classifyRequestSchema.parse(req.body);
    
    const result = await classifyManufacturer(
      validated.sellerId,
      validated.sellerData
    );
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/sourcing/debug-raw
 * Debug endpoint to see raw Apify data structure
 */
router.get("/debug-raw", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { getApifyService } = await import("../services/apify/scraper.js");
    const apifyService = getApifyService();
    const query = (req.query.query as string) || "LED";
    const location = req.query.location as string | undefined;
    const rawResults = await apifyService.search1688(query, { maxItems: 3, location });
    
    // Analyze field availability
    const fieldAnalysis: Record<string, boolean> = {};
    if (rawResults.length > 0) {
      const sample = rawResults[0];
      
      // Check for common fields - handle both snake_case and camelCase formats
      fieldAnalysis.company_name = !!(sample.supplierName || sample.company_name || (sample as any).companyName);
      fieldAnalysis.company_id = !!(sample.productId || sample.company_id || (sample as any).companyId);
      fieldAnalysis.location = !!(sample.supplierLocation || (sample as any).companyInfo?.["Company Profile - Address"] || (sample as any).companyInfo?.["General Information - Address"] || sample.location || (sample as any).address || (sample as any).city || (sample as any).province || (sample as any).company_location);
      fieldAnalysis.phone = !!(sample.phone || (sample as any).contactPhone || (sample as any).tel || (sample as any).contact_phone);
      fieldAnalysis.email = !!(sample.email || (sample as any).contactEmail || (sample as any).mail || (sample as any).contact_email);
      fieldAnalysis.address = !!((sample as any).companyInfo?.["Company Profile - Address"] || (sample as any).companyInfo?.["General Information - Address"] || sample.address || (sample as any).companyAddress || (sample as any).company_address);
      fieldAnalysis.product_name = !!(sample.title || sample.product_name || (sample as any).productName);
      fieldAnalysis.price = !!(sample.price || sample.min_price || (sample as any).minPrice);
      fieldAnalysis.moq = !!(sample.moq || sample.min_order || (sample as any).minOrder);
    }
    
    res.json({
      message: "Raw Apify data structure",
      query,
      location: location || "none",
      count: rawResults.length,
      sample: rawResults[0] || null,
      allKeys: rawResults[0] ? Object.keys(rawResults[0]) : [],
      fieldAnalysis,
      allSamples: rawResults.slice(0, 3), // Return up to 3 samples
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch raw data",
      message: error.message,
      stack: error.stack,
    });
  }
});

/**
 * GET /api/sourcing/manufacturers
 * Get cached manufacturers with sorting and filtering
 */
router.get("/manufacturers", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const searchId = req.query.searchId as string;
    const sortBy = (req.query.sortBy as string) || "confidence";
    const order = (req.query.order as "asc" | "desc") || "desc";
    const limit = parseInt(req.query.limit as string) || 5;
    const minConfidence = req.query.minConfidence 
      ? parseFloat(req.query.minConfidence as string) 
      : undefined;
    const location = req.query.location as string | undefined;
    
    if (!searchId) {
      res.status(400).json({
        error: "searchId is required",
      });
      return;
    }
    
    const result = await getCachedManufacturers({
      searchId,
      sortBy: sortBy as "confidence" | "distance" | "price" | "rating",
      order,
      limit: Math.min(limit, 20),
      minConfidence,
      location,
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

