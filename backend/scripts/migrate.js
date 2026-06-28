/**
 * Database Migration Script
 * Applies pending migrations to the database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nestsafely',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const applyMigrations = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database migration...');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️  No migrations directory found. Skipping migrations.');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    if (files.length === 0) {
      console.log('ℹ️  No pending migrations.');
      return;
    }

    // Apply pending migrations
    for (const file of files) {
      const result = await client.query('SELECT * FROM migrations WHERE name = $1', [file]);
      
      if (result.rows.length === 0) {
        console.log(`📝 Applying migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const migration = fs.readFileSync(migrationPath, 'utf-8');
        
        await client.query(migration);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        
        console.log(`✅ Migration applied: ${file}`);
      }
    }

    console.log('✨ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

applyMigrations();
