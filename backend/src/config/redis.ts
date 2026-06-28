import Redis from 'ioredis';
import { env } from './env';
import logger from '../utils/logger';

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis connection error', err);
});

export const getCache = async <T = any>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error('Redis get error', { key, error });
    return null;
  }
};

export const setCache = async (
  key: string,
  value: any,
  ttl: number = 3600
): Promise<boolean> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Redis set error', { key, error });
    return false;
  }
};

export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Redis delete error', { key, error });
    return false;
  }
};

export const invalidatePattern = async (pattern: string): Promise<number> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      return await redis.del(...keys);
    }
    return 0;
  } catch (error) {
    logger.error('Redis pattern delete error', { pattern, error });
    return 0;
  }
};

export default redis;
