import { getLLMClient } from "../llm/client.js";
import { ClassificationRequest, ClassificationResponse } from "../../models/manufacturer.js";

// In-memory cache for classifications
const classificationCache = new Map<string, ClassificationResponse>();

/**
 * Classify a manufacturer as factory or trading company
 */
export async function classifyManufacturer(
  sellerId: string,
  sellerData: ClassificationRequest["sellerData"]
): Promise<ClassificationResponse> {
  // Check cache first
  const cached = classificationCache.get(sellerId);
  if (cached) {
    return cached;
  }

  const llmClient = getLLMClient();

  const prompt = `Analyze this 1688.com seller and classify as Factory or Trading Company.

Seller Data:
- Company: ${sellerData.companyName}
- Description: ${sellerData.description || "Not provided"}
- Products: ${sellerData.products.join(", ")}
- Factory Info: ${sellerData.factoryInfo || "Not provided"}
- Certifications: ${sellerData.certifications?.join(", ") || "Not provided"}

Consider these factors:
1. Factory information presence (address, equipment, production capacity) - indicates factory
2. Product range (narrow = factory, wide = trading) - narrow product focus suggests factory
3. Certifications and quality standards - more certifications often indicate factory
4. Company age and establishment history - older companies more likely to be factories
5. Business license and registration type - manufacturing license indicates factory
6. Customer reviews mentioning factory visits - direct evidence of factory

Return a JSON object with this exact structure:
{
  "type": "factory" | "trading",
  "confidence": 0.0-1.0,
  "factors": {
    "hasFactoryInfo": true/false,
    "hasProductionEquipment": true/false,
    "productRange": "narrow" | "wide" | "mixed",
    "certifications": ["array of certifications"],
    "companyAge": number or null
  },
  "explanation": "brief explanation of the classification"
}

Only return the JSON, no other text.`;

  try {
    const response = await llmClient.chat([
      {
        role: "system",
        content: "You are an expert at analyzing Chinese B2B manufacturers. Classify sellers as factories or trading companies based on their business characteristics.",
      },
      {
        role: "user",
        content: prompt,
      },
    ], {
      temperature: 0.3, // Lower temperature for more consistent classification
      maxTokens: 500,
    });

    // Parse JSON response
    const content = response.content.trim();
    
    // Extract JSON from response (handle cases where LLM adds markdown code blocks)
    let jsonStr = content;
    if (content.startsWith("```json")) {
      jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (content.startsWith("```")) {
      jsonStr = content.replace(/```\n?/g, "").trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and transform response
    const classification: ClassificationResponse = {
      sellerId,
      type: parsed.type === "factory" ? "factory" : "trading",
      confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5)),
      factors: {
        hasFactoryInfo: parsed.factors?.hasFactoryInfo ?? false,
        hasProductionEquipment: parsed.factors?.hasProductionEquipment ?? false,
        productRange: parsed.factors?.productRange || "mixed",
        certifications: parsed.factors?.certifications || [],
        companyAge: parsed.factors?.companyAge || undefined,
      },
      explanation: parsed.explanation || "Classification based on seller data analysis",
    };

    // Cache the result
    classificationCache.set(sellerId, classification);

    return classification;
  } catch (error: any) {
    console.error("Error classifying manufacturer:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Fallback: basic heuristic classification
    const hasFactoryInfo = !!(sellerData.factoryInfo && sellerData.factoryInfo.length > 0);
    const productCount = sellerData.products.length;
    const isNarrowProductRange = productCount <= 3;
    
    const fallbackClassification: ClassificationResponse = {
      sellerId,
      type: hasFactoryInfo && isNarrowProductRange ? "factory" : "trading",
      confidence: 0.5, // Low confidence for fallback
      factors: {
        hasFactoryInfo,
        hasProductionEquipment: false,
        productRange: isNarrowProductRange ? "narrow" : "wide",
        certifications: sellerData.certifications || [],
      },
      explanation: "Fallback classification due to LLM error",
    };

    return fallbackClassification;
  }
}

/**
 * Clear classification cache (useful for testing or forced re-classification)
 */
export function clearClassificationCache(): void {
  classificationCache.clear();
}

/**
 * Get cache size (for monitoring)
 */
export function getClassificationCacheSize(): number {
  return classificationCache.size;
}

