/**
 * Database Reset Script
 * Drops and recreates the NestSafely database schema
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

const resetDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database reset...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('📝 Executing schema...');
    await client.query(schema);
    
    console.log('✨ Database reset completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run db:seed');
    console.log('   2. Start the development server: npm run dev');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

resetDatabase();
