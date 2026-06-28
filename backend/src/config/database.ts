import { Pool, QueryResult } from 'pg';
import { env } from './env';
import logger from '../utils/logger';

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query in ${duration}ms`, { query: text, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Database query error', { query: text, error });
    throw error;
  }
};

export const queryOne = async <T = any>(
  text: string,
  params?: any[]
): Promise<T | null> => {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
};

export const queryMany = async <T = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const result = await query<T>(text, params);
  return result.rows;
};

export const getPool = () => pool;

export default pool;
