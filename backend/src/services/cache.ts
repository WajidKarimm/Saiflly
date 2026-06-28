import { getCache, setCache, deleteCache, invalidatePattern } from '../config/redis';
import logger from '../utils/logger';

export interface CacheOptions {
  ttl?: number;
  key: string;
}

export const getCachedData = async <T = any>(key: string): Promise<T | null> => {
  try {
    return await getCache<T>(key);
  } catch (error) {
    logger.error('Cache get error', { key, error });
    return null;
  }
};

export const setCachedData = async <T = any>(
  key: string,
  value: T,
  ttl: number = 3600
): Promise<boolean> => {
  try {
    return await setCache(key, value, ttl);
  } catch (error) {
    logger.error('Cache set error', { key, error });
    return false;
  }
};

export const deleteCachedData = async (key: string): Promise<boolean> => {
  try {
    return await deleteCache(key);
  } catch (error) {
    logger.error('Cache delete error', { key, error });
    return false;
  }
};

export const invalidateCachePattern = async (pattern: string): Promise<number> => {
  try {
    return await invalidatePattern(pattern);
  } catch (error) {
    logger.error('Cache pattern invalidation error', { pattern, error });
    return 0;
  }
};

export const invalidateUserCache = async (userId: string): Promise<void> => {
  await invalidateCachePattern(`user:${userId}:*`);
  await invalidateCachePattern(`saved:${userId}:*`);
  logger.info('User cache invalidated', { userId });
};

export const invalidatePropertyCache = async (propertyId: string): Promise<void> => {
  await deleteCachedData(`property:${propertyId}`);
  await deleteCachedData(`score:${propertyId}`);
  await invalidateCachePattern(`verdict:*:${propertyId}:*`);
  logger.info('Property cache invalidated', { propertyId });
};

export const invalidateAreaCache = async (latitude: number, longitude: number): Promise<void> => {
  await invalidateCachePattern(`crime:${latitude}:${longitude}:*`);
  await invalidateCachePattern(`area_safety:${latitude}:${longitude}*`);
  await invalidateCachePattern(`facilities:${latitude}:${longitude}*`);
  logger.info('Area cache invalidated', { latitude, longitude });
};
