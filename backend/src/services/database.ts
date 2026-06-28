import { query, queryOne, queryMany } from '../config/database';
import { getCache, setCache } from '../config/redis';
import { CACHE_TTL } from '../utils/constants';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export interface Property {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  property_type: string;
  price: number;
  size_sqft: number;
  bedrooms: number;
  bathrooms: number;
  year_built?: number;
  created_at: Date;
  updated_at: Date;
}

export interface SafetyScore {
  property_id: string;
  total_score: number;
  crime_score: number;
  area_safety_score: number;
  facilities_score: number;
  property_history_score: number;
  cost_trends_score: number;
  calculated_at: Date;
}

export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  notes?: string;
  saved_at: Date;
}

// Property queries
export const getPropertyById = async (propertyId: string): Promise<Property> => {
  const cached = await getCache<Property>(`property:${propertyId}`);
  if (cached) return cached;

  const result = await queryOne<Property>(
    'SELECT * FROM properties WHERE id = $1',
    [propertyId]
  );

  if (!result) {
    throw new NotFoundError('Property');
  }

  await setCache(`property:${propertyId}`, result, CACHE_TTL.SCORES);
  return result;
};

export const searchProperties = async (
  latitude: number,
  longitude: number,
  radiusKm: number,
  limit: number,
  offset: number
): Promise<{ properties: Property[]; total: number }> => {
  const propertiesResult = await queryMany<Property>(
    `SELECT * FROM properties
     WHERE ST_DWithin(
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       $3 * 1000
     )
     LIMIT $4 OFFSET $5`,
    [longitude, latitude, radiusKm, limit, offset]
  );

  const countResult = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM properties
     WHERE ST_DWithin(
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       $3 * 1000
     )`,
    [longitude, latitude, radiusKm]
  );

  return {
    properties: propertiesResult,
    total: countResult?.count || 0,
  };
};

// Safety score queries
export const getSafetyScore = async (propertyId: string): Promise<SafetyScore | null> => {
  const cached = await getCache<SafetyScore>(`score:${propertyId}`);
  if (cached) return cached;

  const result = await queryOne<SafetyScore>(
    'SELECT * FROM safety_scores WHERE property_id = $1',
    [propertyId]
  );

  if (result) {
    await setCache(`score:${propertyId}`, result, CACHE_TTL.SCORES);
  }

  return result || null;
};

export const saveSafetyScore = async (score: Partial<SafetyScore>): Promise<SafetyScore> => {
  const result = await queryOne<SafetyScore>(
    `INSERT INTO safety_scores 
     (property_id, total_score, crime_score, area_safety_score, facilities_score, property_history_score, cost_trends_score, calculated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (property_id) DO UPDATE SET
       total_score = $2,
       crime_score = $3,
       area_safety_score = $4,
       facilities_score = $5,
       property_history_score = $6,
       cost_trends_score = $7,
       calculated_at = NOW()
     RETURNING *`,
    [
      score.property_id,
      score.total_score,
      score.crime_score,
      score.area_safety_score,
      score.facilities_score,
      score.property_history_score,
      score.cost_trends_score,
    ]
  );

  if (!result) throw new Error('Failed to save safety score');

  await setCache(`score:${score.property_id}`, result, CACHE_TTL.SCORES);
  return result;
};

// Saved properties queries
export const getSavedProperties = async (
  userId: string,
  limit: number,
  offset: number
): Promise<{ properties: (SavedProperty & { property: Property })[], total: number }> => {
  const propertiesResult = await queryMany<SavedProperty & { property: Property }>(
    `SELECT sp.*, jsonb_build_object(
       'id', p.id, 'address', p.address, 'latitude', p.latitude,
       'longitude', p.longitude, 'property_type', p.property_type,
       'price', p.price, 'size_sqft', p.size_sqft
     ) as property
     FROM saved_properties sp
     JOIN properties p ON sp.property_id = p.id
     WHERE sp.user_id = $1
     ORDER BY sp.saved_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM saved_properties WHERE user_id = $1',
    [userId]
  );

  return {
    properties: propertiesResult,
    total: countResult?.count || 0,
  };
};

export const saveProperty = async (
  userId: string,
  propertyId: string,
  notes?: string
): Promise<SavedProperty> => {
  const result = await queryOne<SavedProperty>(
    `INSERT INTO saved_properties (user_id, property_id, notes, saved_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, property_id) DO UPDATE SET notes = $3
     RETURNING *`,
    [userId, propertyId, notes || null]
  );

  if (!result) throw new Error('Failed to save property');

  await setCache(`saved:${userId}:${propertyId}`, result, CACHE_TTL.SESSIONS);
  return result;
};
