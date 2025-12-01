import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  TRIPS_DATA_DIR: process.env.TRIPS_DATA_DIR || "../data/trips",
  SIMULATION_DEFAULT_SPEED: parseInt(
    process.env.SIMULATION_DEFAULT_SPEED || "5",
    10
  ),
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_DATABASE: process.env.DB_DATABASE || "fleet_tracking",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  // JWT / Auth
  AUTH_SECRET_KEY:
    process.env.AUTH_SECRET_KEY || "your-secret-key-change-in-production",
  AUTH_ALGORITHM: (process.env.AUTH_ALGORITHM || "HS256") as
    | "HS256"
    | "HS384"
    | "HS512"
    | "RS256"
    | "RS384"
    | "RS512"
    | "ES256"
    | "ES384"
    | "ES512",
  AUTH_ACCESS_TOKEN_EXPIRE_MINUTES: parseInt(
    process.env.AUTH_ACCESS_TOKEN_EXPIRE_MINUTES || "60",
    10
  ),
  AUTH_REFRESH_TOKEN_EXPIRE_DAYS: parseInt(
    process.env.AUTH_REFRESH_TOKEN_EXPIRE_DAYS || "7",
    10
  ),
  // Legacy support
  JWT_SECRET:
    process.env.AUTH_SECRET_KEY ||
    process.env.JWT_SECRET ||
    "your-secret-key-change-in-production",
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  // Email (for OTP)
  SMTP_HOST:
    process.env.SMTP_HOST || process.env.SMTP_SERVER || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || process.env.SENDER_EMAIL || "",
  SMTP_PASS: process.env.SMTP_PASS || process.env.SENDER_PASSWORD || "",
};

// Resolve absolute path for trips data directory
export const getTripsDataPath = () => {
  const fs = require("fs");

  // __dirname is backend/src (or backend/dist when compiled)
  // Go up two levels to project root, then into data/trips
  const dataDir = path.resolve(__dirname, "../../data/trips");

  if (fs.existsSync(dataDir)) {
    return dataDir;
  }

  // Fallback: try from process.cwd() if running from backend directory
  const cwd = process.cwd();
  if (cwd.includes("backend")) {
    const projectRoot = path.resolve(cwd, "..");
    const fallbackDir = path.resolve(projectRoot, "data", "trips");
    if (fs.existsSync(fallbackDir)) {
      return fallbackDir;
    }
  }

  // Return the expected path (will show helpful error if not found)
  return dataDir;
};
