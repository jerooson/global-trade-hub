import { Manufacturer1688Data, ManufacturerResult } from "../../models/manufacturer.js";

/**
 * Calculate confidence score based on multiple factors
 */
export function calculateConfidenceScore(
  data: Manufacturer1688Data,
  classificationConfidence: number
): number {
  let score = classificationConfidence * 100; // Start with classification confidence (0-100)

  // Boost confidence if factory info is present
  if (data.factoryInfo?.hasFactory) {
    score += 10;
  }

  // Boost if production equipment is mentioned
  if (data.factoryInfo?.productionEquipment && data.factoryInfo.productionEquipment.length > 0) {
    score += 5;
  }

  // Boost if certifications are present
  if (data.productInfo?.certifications && data.productInfo.certifications.length > 0) {
    score += data.productInfo.certifications.length * 2; // +2 per certification
  }

  // Boost if contact information is complete
  if (data.contact?.phone && data.contact?.email) {
    score += 5;
  }

  // Boost if location is detailed
  if (data.location?.address && data.location?.city && data.location?.province) {
    score += 5;
  }

  // Cap at 100
  return Math.min(100, Math.round(score));
}

/**
 * Enrich manufacturer data with location coordinates (placeholder - would use geocoding API)
 */
export function enrichLocationData(data: Manufacturer1688Data): Manufacturer1688Data {
  if (!data.location || data.location.coordinates) {
    return data; // Already has coordinates or no location
  }

  // TODO: Integrate with geocoding API (Google Maps, Baidu Maps, etc.)
  // For now, return as-is
  return data;
}

/**
 * Calculate distance between two locations (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate estimated travel time (ETA) based on distance
 */
export function calculateETA(distanceKm: number): string {
  // Assume average speed of 60 km/h for road travel in China
  const averageSpeed = 60;
  const hours = distanceKm / averageSpeed;
  
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minutes`;
  } else if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours} hours`;
  } else {
    const days = Math.round(hours / 24);
    return `${days} days`;
  }
}

/**
 * Enrich manufacturer result with distance and ETA if query location is provided
 */
export function enrichWithDistance(
  result: ManufacturerResult,
  queryLocation?: { lat: number; lng: number }
): ManufacturerResult {
  // For now, return as-is since we don't have coordinates in ManufacturerResult
  // This would be enhanced when we add location coordinates to the data model
  return result;
}

/**
 * Sort manufacturers by various criteria
 */
export function sortManufacturers(
  manufacturers: ManufacturerResult[],
  sortBy: "confidence" | "distance" | "price" | "rating",
  order: "asc" | "desc" = "desc"
): ManufacturerResult[] {
  const sorted = [...manufacturers];

  switch (sortBy) {
    case "confidence":
      sorted.sort((a, b) => a.confidence - b.confidence);
      break;
    case "distance":
      // Would need distance data - for now, sort by confidence
      sorted.sort((a, b) => a.confidence - b.confidence);
      break;
    case "price":
      // Would need price data - for now, sort by confidence
      sorted.sort((a, b) => a.confidence - b.confidence);
      break;
    case "rating":
      // Would need rating data - for now, sort by confidence
      sorted.sort((a, b) => a.confidence - b.confidence);
      break;
    default:
      sorted.sort((a, b) => a.confidence - b.confidence);
  }

  if (order === "desc") {
    sorted.reverse();
  }

  return sorted;
}

/**
 * Filter manufacturers based on criteria
 */
export function filterManufacturers(
  manufacturers: ManufacturerResult[],
  filters: {
    minConfidence?: number;
    location?: string;
    manufacturerType?: "factory" | "trading" | "both";
  }
): ManufacturerResult[] {
  let filtered = [...manufacturers];

  // Filter by minimum confidence
  if (filters.minConfidence !== undefined) {
    const minConfidencePercent = filters.minConfidence * 100;
    filtered = filtered.filter(m => m.confidence >= minConfidencePercent);
  }

  // Filter by manufacturer type
  if (filters.manufacturerType && filters.manufacturerType !== "both") {
    const targetType = filters.manufacturerType === "factory" ? "Factory" : "Trading Company";
    filtered = filtered.filter(m => m.type === targetType);
  }

  // Filter by location (strict matching to avoid false positives)
  if (filters.location) {
    const locationLower = filters.location.toLowerCase().trim();
    
    // Map of common location variations and their canonical names
    const locationMap: Record<string, string[]> = {
      "ningbo": ["ningbo", "ningbo city", "ningbo,", ", ningbo", "ningbo, zhejiang", "zhejiang, ningbo"],
      "shenzhen": ["shenzhen", "shenzhen city", "shenzhen,", ", shenzhen", "shenzhen, guangdong", "guangdong, shenzhen"],
      "shanghai": ["shanghai", "shanghai city", "shanghai,", ", shanghai"],
      "beijing": ["beijing", "beijing city", "beijing,", ", beijing"],
      "guangzhou": ["guangzhou", "guangzhou city", "guangzhou,", ", guangzhou", "guangzhou, guangdong", "guangdong, guangzhou"],
      "hangzhou": ["hangzhou", "hangzhou city", "hangzhou,", ", hangzhou", "hangzhou, zhejiang", "zhejiang, hangzhou"],
      "dongguan": ["dongguan", "dongguan city", "dongguan,", ", dongguan", "dongguan, guangdong", "guangdong, dongguan"],
      "suzhou": ["suzhou", "suzhou city", "suzhou,", ", suzhou"],
      "wenzhou": ["wenzhou", "wenzhou city", "wenzhou,", ", wenzhou", "wenzhou, zhejiang", "zhejiang, wenzhou"],
    };
    
    // Get all variations for the requested location
    const locationVariations = locationMap[locationLower] || [locationLower];
    
    // Also check for province-level matches (e.g., "Zhejiang" should match "Ningbo, Zhejiang")
    const provinceMap: Record<string, string[]> = {
      "zhejiang": ["ningbo", "hangzhou", "wenzhou", "jiaxing", "huzhou", "shaoxing", "jinhua", "quzhou", "zhoushan", "taizhou", "lishui"],
      "guangdong": ["shenzhen", "guangzhou", "dongguan", "foshan", "zhongshan", "jiangmen", "zhuhai", "huizhou"],
      "jiangsu": ["suzhou", "nanjing", "wuxi", "changzhou", "xuzhou", "nantong"],
      "shandong": ["jinan", "qingdao", "zibo", "zaozhuang", "dongying", "yantai"],
    };
    
    filtered = filtered.filter(m => {
      const addressLower = m.address.toLowerCase();
      
      // First, check for exact city matches (strict)
      for (const variation of locationVariations) {
        // Use word boundaries to avoid partial matches
        // Match: "Ningbo, Zhejiang" or "Ningbo City" or ", Ningbo" or "Ningbo,"
        // Don't match: "NingboXXX" (unless it's a known variation)
        const pattern = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (pattern.test(addressLower)) {
          return true;
        }
      }
      
      // If no direct match, check if it's a province-level search
      // (e.g., searching "Zhejiang" should match "Ningbo, Zhejiang")
      for (const [province, cities] of Object.entries(provinceMap)) {
        if (locationLower === province.toLowerCase()) {
          // Check if address contains any city from this province
          for (const city of cities) {
            const cityPattern = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (cityPattern.test(addressLower)) {
              return true;
            }
          }
        }
      }
      
      return false;
    });
    
    console.log(`[Location Filter] Filtered ${filtered.length} results for location: "${filters.location}" (from ${manufacturers.length} total)`);
  }

  return filtered;
}

