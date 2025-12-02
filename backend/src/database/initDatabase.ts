import pool from "./db";
import fs from "fs";
import path from "path";

/**
 * Check if database tables exist
 */
const checkTablesExist = async (): Promise<boolean> => {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
};

/**
 * Run database migrations to create tables
 */
const runMigrations = async (): Promise<void> => {
  try {
    // Test connection first
    await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful");

    // Load schema file
    // In production: dist/database/schema.sql
    // In development: src/database/schema.sql
    let schemaPath = path.join(__dirname, "schema.sql");

    // If file doesn't exist in dist, try source path (development)
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.join(__dirname, "../database/schema.sql");
    }

    // If still not found, try from project root
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.join(process.cwd(), "src/database/schema.sql");
    }

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found. Tried: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Execute schema
    await pool.query(schema);
    console.log("✅ Database schema created successfully");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
};

/**
 * Initialize database - checks if tables exist and creates them if needed
 * This runs automatically on server startup
 */
export const initDatabase = async (): Promise<void> => {
  try {
    console.log("🔍 Checking database tables...");

    const tablesExist = await checkTablesExist();

    if (!tablesExist) {
      console.log("📦 Database tables not found. Creating tables...");
      await runMigrations();
      console.log("✅ Database initialization complete");
    } else {
      console.log("✅ Database tables already exist");
    }
  } catch (error: any) {
    console.error("❌ Database initialization failed:", error.message);
    // Don't throw - allow server to start even if migration fails
    // The error will be visible in logs
    console.error("⚠️  Server will continue, but database operations may fail");
  }
};
