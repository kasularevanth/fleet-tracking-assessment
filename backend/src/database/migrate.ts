import dotenv from 'dotenv';
import pool from './db';
import fs from 'fs';
import path from 'path';

// Ensure env is loaded
dotenv.config();

const runMigrations = async () => {
  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    await pool.query(schema);
    console.log('✅ Database schema created successfully');
    
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
};

runMigrations();

