import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { config } from "./config/env.js";
import { initializeDatabase } from "./db/connection.js";
import { configurePassport } from "./services/auth/passportConfig.js";
import authRoutes from "./routes/auth.js";
import sourcingRoutes from "./routes/sourcing.js";
import imageGenerationRoutes from "./routes/imageGeneration.js";
import emailRoutes from "./routes/email.js";
import contactsRoutes from "./routes/contacts.js";

const app = express();

// Initialize database
try {
  await initializeDatabase();
} catch (error) {
  console.error("❌ Failed to initialize database:", error);
  if (config.nodeEnv === "production") {
    process.exit(1);
  } else {
    console.warn("⚠️  Continuing without database in development mode");
  }
}

// Initialize Passport
configurePassport();

// Middleware
// In development, allow only port 8080 (frontend port from vite.config.ts)
const allowedOrigins = config.nodeEnv === "development"
  ? ["http://localhost:8080"]
  : [config.frontendUrl];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Session middleware (required for OAuth)
app.use(
  session({
    secret: config.jwtSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sourcing", sourcingRoutes);
app.use("/api/image", imageGenerationRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/contacts", contactsRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: config.nodeEnv === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🔍 Sourcing API: http://localhost:${PORT}/api/sourcing`);
  console.log(`🎨 Image Generation API: http://localhost:${PORT}/api/image`);
  console.log(`📧 Email API: http://localhost:${PORT}/api/email`);
  console.log(`👥 Contacts API: http://localhost:${PORT}/api/contacts`);
});

