import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Database
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/tradehub",
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production",
  jwtAccessExpiry: "15m",
  jwtRefreshExpiry: "7d",
  
  // OAuth - Google
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback",
  
  // OAuth - GitHub
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || "http://localhost:3001/api/auth/github/callback",
  
  // Email (SendGrid)
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  emailFrom: process.env.EMAIL_FROM || "TradeHub <noreply@tradehub.com>",
  
  // LLM Configuration
  groqApiKey: process.env.GROQ_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  
  // Firecrawl Configuration
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY || "",
  
  // Apify Configuration
  apifyApiKey: process.env.APIFY_API_KEY,
  
  // Gemini API (Nano Banana Image Generation)
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // CORS Configuration
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
} as const;

// Validate required environment variables
if (!config.firecrawlApiKey) {
  console.warn("⚠️  FIRECRAWL_API_KEY is not set");
}

if (!config.groqApiKey && !config.openaiApiKey && !config.anthropicApiKey) {
  console.warn("⚠️  No LLM API key is set. Please set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY");
}

if (config.nodeEnv === "production") {
  if (config.jwtSecret === "dev-secret-change-in-production") {
    console.error("❌ JWT_SECRET must be set in production!");
    process.exit(1);
  }
  if (!config.sendgridApiKey) {
    console.warn("⚠️  SENDGRID_API_KEY is not set - email sending will fail");
  }
}

