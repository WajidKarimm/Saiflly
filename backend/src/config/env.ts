import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'nestsafely',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '1h',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '30d',
  
  // External APIs
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || '',
  CRIME_API_KEY: process.env.CRIME_API_KEY || '',
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: process.env.LOG_DIR || './logs',
};

export const validateEnv = (): void => {
  const required = ['CLAUDE_API_KEY', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
