import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  
  // LLM Configuration
  groqApiKey: process.env.GROQ_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  
  // Firecrawl Configuration
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || "",
  
  // Apify Configuration
  apifyApiKey: process.env.APIFY_API_KEY,
  
  // CORS Configuration
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
} as const;

// Validate required environment variables
if (!config.firecrawlApiKey) {
  console.warn("Warning: FIRECRAWL_API_KEY is not set");
}

if (!config.groqApiKey && !config.openaiApiKey && !config.anthropicApiKey) {
  console.warn("Warning: No LLM API key is set. Please set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY");
}

