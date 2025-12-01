import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const createDatabase = async () => {
  // Connect to default 'postgres' database to create new database
  const adminPool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: "postgres", // Connect to default database
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  });

  try {
    const dbName = process.env.DB_DATABASE || "fleet_tracking";

    // Check if database exists
    const checkResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Database "${dbName}" already exists`);
      await adminPool.end();
      return;
    }

    // Create database
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database "${dbName}" created successfully`);

    await adminPool.end();
  } catch (error: any) {
    console.error("❌ Failed to create database:", error.message);
    await adminPool.end();
    process.exit(1);
  }
};

createDatabase();




