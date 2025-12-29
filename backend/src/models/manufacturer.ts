// Frontend-compatible ManufacturerResult interface
export interface ManufacturerResult {
  id: string;
  name: string;
  type: "Factory" | "Trading Company";
  confidence: number; // 0-100
  address: string;
  contact: string;
  email: string;
  phone: string;
  products: string[];
  links?: {
    productUrl?: string;
    companyUrl?: string;
    inquiryUrl?: string;
  };
}

// Extended manufacturer data from 1688.com (before transformation)
export interface Manufacturer1688Data {
  sellerId: string;
  companyName: string;
  description?: string;
  products: string[];
  contact?: {
    phone?: string;
    email?: string;
    wechat?: string;
    alibabaAccount?: string;
  };
  location?: {
    city?: string;
    province?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  businessInfo?: {
    website?: string;
    establishedYear?: number;
    employeeCount?: string;
    factorySize?: string;
  };
  productInfo?: {
    mainProducts: string[];
    moq?: string;
    leadTime?: string;
    certifications?: string[];
  };
  pricing?: {
    currency: string;
    unitPrice?: number;
    moq?: number;
    priceRange?: string;
  };
  externalLinks?: {
    url1688?: string;
    alibabaUrl?: string;
    website?: string;
    inquiryUrl?: string;
  };
  reviews?: {
    rating?: number;
    reviewCount?: number;
  };
  factoryInfo?: {
    hasFactory: boolean;
    factoryAddress?: string;
    productionEquipment?: string[];
    productionCapacity?: string;
  };
}

// API Request/Response types matching PRD
export interface SourcingSearchRequest {
  query: string;
  productId?: string;
  filters?: {
    location?: string[];
    minConfidence?: number;
    manufacturerType?: "factory" | "trading" | "both";
  };
  imageUrl?: string;
  category?: string;
  subcategory?: string;
}

export interface ParsedQuery {
  product: string;
  location?: string[];
  type?: "manufacturer" | "product";
  specifications?: Record<string, string>;
  category?: string;
  subcategory?: string;
}

export interface SourcingSearchResponse {
  searchId: string;
  query: string;
  parsedQuery: ParsedQuery;
  results: ManufacturerResult[];
  totalResults: number;
  searchTime: number; // seconds
  observability?: {
    searchMethod?: "apify" | "firecrawl" | "mock";
    filtersApplied?: {
      location?: string;
      minConfidence?: number;
      manufacturerType?: "factory" | "trading" | "both";
    };
    processingSteps?: {
      rawResultsCount?: number;
      afterDeduplicationCount?: number;
      afterFilteringCount?: number;
      finalCount?: number;
    };
  };
}

export interface ClassificationRequest {
  sellerId: string;
  sellerData: {
    companyName: string;
    description?: string;
    products: string[];
    factoryInfo?: string;
    certifications?: string[];
  };
}

export interface ClassificationResponse {
  sellerId: string;
  type: "factory" | "trading";
  confidence: number; // 0.0 - 1.0
  factors: {
    hasFactoryInfo: boolean;
    hasProductionEquipment: boolean;
    productRange: "narrow" | "wide" | "mixed";
    certifications: string[];
    companyAge?: number;
  };
  explanation: string;
}

