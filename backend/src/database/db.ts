import { Pool } from "pg";
import dotenv from "dotenv";
import { config } from "../config/env";

// Ensure env is loaded
dotenv.config();

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_DATABASE,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err: Error) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
