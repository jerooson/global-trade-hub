import { Pool } from "pg";
import { config } from "../config/env.js";

// Create PostgreSQL connection pool
// SSL is required for remote databases (like Render), but not for local PostgreSQL
const isRemoteDatabase = config.databaseUrl.includes('render.com') || 
                         config.databaseUrl.includes('supabase') ||
                         config.nodeEnv === "production" || 
                         config.nodeEnv === "staging";

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: isRemoteDatabase ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.on("connect", () => {
  console.log("✅ Database connected");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
  process.exit(-1);
});

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query", { text, duration, rows: res.rowCount });
  return res;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = await fs.readFile(schemaPath, "utf-8");
    
    await pool.query(schema);
    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

export default pool;

