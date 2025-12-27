import { ManufacturerResult, Manufacturer1688Data } from "../models/manufacturer.js";
import { ScrapeResult } from "../services/firecrawl/scraper.js";
import { Apify1688Result } from "../services/apify/scraper.js";

/**
 * Transform 1688.com scraped data to ManufacturerResult format
 */
export function transform1688ToManufacturerResult(
  data: Manufacturer1688Data,
  classification?: { type: "factory" | "trading"; confidence: number }
): ManufacturerResult {
  // Convert confidence from 0-1 to 0-100
  const confidence = classification
    ? Math.round(classification.confidence * 100)
    : 50; // Default to 50 if no classification

  // Map type
  const type: "Factory" | "Trading Company" = 
    classification?.type === "factory" ? "Factory" : "Trading Company";

  // Build address string - prefer address field, then combine city/province
  let address = "";
  if (data.location?.address) {
    address = data.location.address;
  } else {
    const addressParts: string[] = [];
    if (data.location?.city) addressParts.push(data.location.city);
    if (data.location?.province) addressParts.push(data.location.province);
    address = addressParts.join(", ");
  }
  // Only use "China" as fallback if we have absolutely no location data
  if (!address || address.trim() === "") {
    address = "China";
  }

  // Extract contact name (try to get from company name or use default)
  const contact = data.businessInfo?.website 
    ? `Contact: ${data.companyName}`
    : data.companyName;

  // Extract email - return empty string if not available (don't use placeholder)
  const email = data.contact?.email || "";

  // Extract phone - return empty string if not available (don't use placeholder)
  const phone = data.contact?.phone || "";

  // Extract products
  const products = data.productInfo?.mainProducts || data.products || [];

  return {
    id: data.sellerId,
    name: data.companyName,
    type,
    confidence,
    address,
    contact,
    email,
    phone,
    products: products.length > 0 ? products : ["General Products"],
  };
}

/**
 * Extract manufacturer data from Firecrawl scrape result
 */
export function extractManufacturerDataFromScrape(
  scrapeResult: ScrapeResult,
  sellerId: string
): Manufacturer1688Data {
  const content = scrapeResult.markdown || scrapeResult.html || scrapeResult.content || "";
  const html = scrapeResult.html || "";

  // Extract company name (try from title or metadata)
  const companyName = scrapeResult.metadata?.title 
    || extractFromContent(content, /公司名称[：:]\s*(.+)/i)
    || extractFromContent(content, /公司[：:]\s*(.+)/i)
    || "Unknown Company";

  // Extract description
  const description = scrapeResult.metadata?.description 
    || extractFromContent(content, /公司简介[：:]\s*(.+?)(?:\n|$)/i)
    || "";

  // Extract products
  const products = extractProducts(content);

  // Extract contact information
  const contact = {
    phone: extractFromContent(content, /电话[：:]\s*([+\d\s-]+)/i) 
      || extractFromContent(html, /tel:([+\d-]+)/i),
    email: extractFromContent(content, /邮箱[：:]\s*([\w.-]+@[\w.-]+\.\w+)/i)
      || extractFromContent(html, /mailto:([\w.-]+@[\w.-]+\.\w+)/i),
    wechat: extractFromContent(content, /微信[：:]\s*([\w-]+)/i),
  };

  // Extract location
  const location = {
    city: extractFromContent(content, /所在城市[：:]\s*(.+)/i)
      || extractFromContent(content, /城市[：:]\s*(.+)/i),
    province: extractFromContent(content, /所在省份[：:]\s*(.+)/i)
      || extractFromContent(content, /省份[：:]\s*(.+)/i),
    address: extractFromContent(content, /地址[：:]\s*(.+)/i)
      || extractFromContent(content, /详细地址[：:]\s*(.+)/i),
  };

  // Extract factory information
  const factoryInfo = extractFromContent(content, /工厂信息[：:]\s*(.+?)(?:\n|$)/i)
    || extractFromContent(content, /生产设备[：:]\s*(.+?)(?:\n|$)/i)
    || "";

  // Extract certifications
  const certifications = extractCertifications(content);

  return {
    sellerId,
    companyName: companyName.trim(),
    description: description.trim() || undefined,
    products,
    contact: Object.keys(contact).length > 0 ? contact : undefined,
    location: Object.keys(location).some(k => location[k as keyof typeof location]) 
      ? location 
      : undefined,
    factoryInfo: factoryInfo ? {
      hasFactory: true,
      factoryAddress: location.address,
      productionEquipment: extractFromContent(content, /生产设备[：:]\s*(.+)/i)?.split(/[,，]/) || [],
    } : undefined,
    productInfo: {
      mainProducts: products,
      certifications,
    },
    externalLinks: {
      url1688: scrapeResult.url,
    },
  };
}

/**
 * Helper to extract text from content using regex
 */
function extractFromContent(content: string, pattern: RegExp): string | undefined {
  const match = content.match(pattern);
  return match ? match[1]?.trim() : undefined;
}

/**
 * Extract products list from content
 */
function extractProducts(content: string): string[] {
  const products: string[] = [];

  // Try to find product list patterns
  const productPatterns = [
    /主要产品[：:]\s*(.+?)(?:\n|$)/i,
    /产品[：:]\s*(.+?)(?:\n|$)/i,
    /主营产品[：:]\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of productPatterns) {
    const match = content.match(pattern);
    if (match) {
      const productStr = match[1];
      // Split by common delimiters
      const productList = productStr
        .split(/[,，;；、]/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
      if (productList.length > 0) {
        products.push(...productList);
        break;
      }
    }
  }

  return products.length > 0 ? products : [];
}

/**
 * Extract certifications from content
 */
function extractCertifications(content: string): string[] {
  const certifications: string[] = [];
  const certPattern = /(?:认证|证书)[：:]\s*(.+?)(?:\n|$)/i;
  const match = content.match(certPattern);
  
  if (match) {
    const certStr = match[1];
    const certList = certStr
      .split(/[,，;；、]/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    certifications.push(...certList);
  }

  // Also look for common certifications
  const commonCerts = ["CE", "RoHS", "ISO 9001", "ISO 14001", "FCC", "UL"];
  for (const cert of commonCerts) {
    if (content.includes(cert)) {
      certifications.push(cert);
    }
  }

  return [...new Set(certifications)]; // Remove duplicates
}

/**
 * Transform Apify Made in China (or 1688.com) result to Manufacturer1688Data format
 */
export function transformApifyToManufacturerResult(
  apifyResult: Apify1688Result,
  sellerId: string
): Manufacturer1688Data {
  // Handle different data formats from Made in China vs 1688.com
  // Different actors use different field naming conventions:
  // - agenscrape/made-in-china-com-product-scraper: snake_case (company_name, product_name)
  // - parseforge/made-in-china-scraper: camelCase (supplierName, title)
  
  // Company name - check all possible field names (prioritize parseforge format)
  const companyName = (apifyResult as any).supplierName  // parseforge format
    || (apifyResult as any).company_name  // agenscrape format
    || apifyResult.companyName  // 1688.com format
    || (apifyResult as any).supplier_name
    || (apifyResult as any).supplier
    || (apifyResult as any).company
    || (apifyResult as any).manufacturer
    || (apifyResult as any).vendor
    || (apifyResult as any).name
    || "Unknown Company";
  
  // Description - check companyInfo first (parseforge has detailed companyInfo)
  const companyInfo = (apifyResult as any).companyInfo || {};
  const description = companyInfo["Company Profile - Description"]
    || (apifyResult as any).product_description
    || (apifyResult as any).description 
    || (apifyResult as any).company_description
    || apifyResult.companyDescription 
    || (apifyResult as any).productDescription
    || (apifyResult as any).details
    || "";
  
  // Products can be in various formats
  let products: string[] = [];
  const productName = (apifyResult as any).title  // parseforge format
    || (apifyResult as any).product_name  // agenscrape format
    || apifyResult.productName 
    || apifyResult.title;
  const category = (apifyResult as any).category;
  
  if (apifyResult.products && Array.isArray(apifyResult.products)) {
    products = apifyResult.products;
  } else if (apifyResult.products && typeof apifyResult.products === 'string') {
    products = [apifyResult.products];
  } else if (productName) {
    products = [productName];
    if (category) {
      products.push(category);
    }
  } else if (apifyResult.name) {
    products = [apifyResult.name];
  }
  
  // Location extraction priority:
  // 1. Detailed address from companyInfo (parseforge actor)
  // 2. supplierLocation (parseforge actor)
  // 3. Extract from company name (many Chinese companies include location in name)
  // 4. Other location fields
  let location = companyInfo["Company Profile - Address"]  // Detailed address from parseforge (best)
    || companyInfo["General Information - Address"]  // Alternative detailed address
    || (apifyResult as any).supplierLocation  // parseforge format (may be "Guangdong, China")
    || companyInfo["Company Profile - Location"]
    || (apifyResult as any).location 
    || (apifyResult as any).company_location
    || apifyResult.companyLocation 
    || (apifyResult as any).address
    || (apifyResult as any).city
    || (apifyResult as any).province
    || "";
  
  // If no location found, try to extract from company name
  // Many Chinese companies include location: "Shenzhen XXX Co.", "Guangdong XXX", etc.
  if (!location && companyName && companyName !== "Unknown Company") {
    const locationPatterns = [
      /^(Shenzhen|Shanghai|Beijing|Guangzhou|Dongguan|Foshan|Zhongshan|Jiangmen|Zhuhai|Huizhou|Shantou|Qingyuan|Shaoguan|Zhaoqing|Meizhou|Heyuan|Yangjiang|Maoming|Jieyang|Chaozhou|Yunfu|Suzhou|Nanjing|Wuxi|Changzhou|Xuzhou|Nantong|Lianyungang|Huai'an|Yancheng|Yangzhou|Zhenjiang|Taizhou|Suqian|Hangzhou|Ningbo|Wenzhou|Jiaxing|Huzhou|Shaoxing|Jinhua|Quzhou|Zhoushan|Taizhou|Lishui|Hefei|Wuhu|Bengbu|Huainan|Ma'anshan|Huaibei|Tongling|Anqing|Huangshan|Chuzhou|Fuyang|Suzhou|Lu'an|Bozhou|Chizhou|Xuancheng|Fuzhou|Xiamen|Putian|Sanming|Quanzhou|Zhangzhou|Nanping|Longyan|Ningde|Nanchang|Jingdezhen|Pingxiang|Jiujiang|Xinyu|Yingtan|Ganzhou|Ji'an|Yichun|Fuzhou|Shangrao|Jinan|Qingdao|Zibo|Zaozhuang|Dongying|Yantai|Weifang|Jining|Tai'an|Weihai|Rizhao|Laiwu|Linyi|Dezhou|Liaocheng|Binzhou|Heze|Zhengzhou|Kaifeng|Luoyang|Pingdingshan|Anyang|Hebi|Xinxiang|Jiaozuo|Puyang|Xuchang|Luohe|Sanmenxia|Nanyang|Shangqiu|Xinyang|Zhoukou|Zhumadian|Wuhan|Huangshi|Shiyan|Yichang|Xiangyang|Ezhou|Jingmen|Xiaogan|Jingzhou|Huanggang|Xianning|Suizhou|Changsha|Zhuzhou|Xiangtan|Hengyang|Shaoyang|Yueyang|Changde|Zhangjiajie|Yiyang|Chenzhou|Yongzhou|Huaihua|Loudi|Guangzhou|Shaoguan|Shenzhen|Zhuhai|Shantou|Foshan|Jiangmen|Zhanjiang|Maoming|Zhaoqing|Huizhou|Meizhou|Shanwei|Heyuan|Yangjiang|Qingyuan|Dongguan|Zhongshan|Chaozhou|Jieyang|Yunfu|Nanning|Liuzhou|Guilin|Wuzhou|Beihai|Fangchenggang|Qinzhou|Guigang|Yulin|Baise|Hezhou|Hechi|Laibin|Chongzuo|Haikou|Sanya|Chengdu|Zigong|Panzhihua|Luzhou|Deyang|Mianyang|Guangyuan|Suining|Neijiang|Leshan|Nanchong|Meishan|Yibin|Guang'an|Dazhou|Ya'an|Bazhong|Ziyang|Guiyang|Liupanshui|Zunyi|Anshun|Kunming|Qujing|Yuxi|Baoshan|Zhaotong|Lijiang|Puer|Lincang|Lhasa|Xi'an|Tongchuan|Baoji|Xianyang|Weinan|Yan'an|Hanzhong|Yulin|Ankang|Shangluo|Lanzhou|Jiayuguan|Jinchang|Baiyin|Tianshui|Wuwei|Zhangye|Pingliang|Jiuquan|Qingyang|Dingxi|Longnan|Xining|Yinchuan|Urumqi|Karamay|Turpan|Hami)/i,
      /(Guangdong|Jiangsu|Zhejiang|Shandong|Henan|Sichuan|Hubei|Hunan|Anhui|Fujian|Liaoning|Shaanxi|Heilongjiang|Yunnan|Jiangxi|Hebei|Shanxi|Guangxi|Inner Mongolia|Xinjiang|Tibet|Beijing|Tianjin|Shanghai|Chongqing)/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = companyName.match(pattern);
      if (match) {
        location = match[1] || match[0];
        break;
      }
    }
  }
  
  // Clean up location string - remove duplicates (e.g., "Guangdong, China, Guangdong, China")
  if (location) {
    const parts = location.split(',').map((p: string) => p.trim()).filter((p: string) => p);
    const uniqueParts: string[] = [];
    const seen = new Set<string>();
    for (const part of parts) {
      const normalized = part.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        uniqueParts.push(part);
      }
    }
    location = uniqueParts.join(', ');
  }
  
  // Extract MOQ - parseforge uses "moq", agenscrape uses "min_order"
  const moq = (apifyResult as any).moq  // parseforge format: "500 Pieces" or "100-499 Meters | 500-999 Meters"
    || (apifyResult as any).min_order  // agenscrape format
    || apifyResult.moq 
    || (apifyResult as any).minOrderQuantity 
    || (apifyResult as any).minOrder;
  
  // Extract pricing - parseforge has "price" as string, agenscrape has min_price/max_price
  const priceStr = (apifyResult as any).price;  // parseforge: "US$4.50 - US$4.00" or "US$20.00"
  const minPrice = (apifyResult as any).min_price;  // agenscrape format
  const maxPrice = (apifyResult as any).max_price;  // agenscrape format
  const currency = (apifyResult as any).currency || apifyResult.currency || "USD";
  
  let priceRange: string | undefined;
  if (priceStr) {
    // parseforge format: already formatted price string
    priceRange = priceStr;
  } else if (minPrice && maxPrice) {
    // agenscrape format: separate min/max prices
    if (minPrice === maxPrice) {
      priceRange = `${currency} ${minPrice}`;
    } else {
      priceRange = `${currency} ${minPrice} - ${maxPrice}`;
    }
  } else if (apifyResult.price) {
    priceRange = typeof apifyResult.price === 'string' 
      ? apifyResult.price 
      : `${currency} ${apifyResult.price}`;
  }
  
  return {
    sellerId,
    companyName: String(companyName).trim() || "Unknown Company",
    description: String(description).trim() || "",
    products: products.length > 0 ? products : ["General Products"],
    contact: {
      // Note: parseforge actor doesn't include phone/email in product data
      // Would need to scrape supplierUrl for contact details
      phone: (apifyResult as any).phone || apifyResult.phone || (apifyResult as any).contact_phone || apifyResult.contactPhone || (apifyResult as any).tel || undefined,
      email: (apifyResult as any).email || apifyResult.email || (apifyResult as any).contact_email || apifyResult.contactEmail || (apifyResult as any).mail || undefined,
    },
    location: {
      city: location?.split(",")[0]?.trim() || location?.split(" ")[0]?.trim() || "",
      province: location?.split(",")[1]?.trim() || location?.split(" ")[1]?.trim() || "",
      address: location || "",
    },
    productInfo: {
      mainProducts: products.length > 0 ? products : ["General Products"],
      moq: moq ? String(moq) : undefined,
    },
    pricing: priceRange ? {
      currency: currency,
      priceRange: priceRange,
    } : undefined,
    externalLinks: {
      url1688: (apifyResult as any).productUrl  // parseforge format
        || (apifyResult as any).supplierUrl  // parseforge company URL
        || (apifyResult as any).product_url  // agenscrape format
        || (apifyResult as any).company_url
        || (apifyResult as any).companyUrl
        || apifyResult.productUrl 
        || apifyResult.companyUrl 
        || (apifyResult as any).url 
        || apifyResult.link
        || (apifyResult as any).productLink,
    },
  };
}

