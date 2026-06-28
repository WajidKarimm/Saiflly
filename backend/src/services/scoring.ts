import { SAFETY_SCORE_WEIGHTS } from '../utils/constants';
import { getCache, setCache } from '../config/redis';
import { queryMany, queryOne } from '../config/database';
import logger from '../utils/logger';

export interface ScoringFactors {
  crimeScore: number;
  areaSafetyScore: number;
  facilitiesScore: number;
  propertyHistoryScore: number;
  costTrendsScore: number;
}

export interface ScoringResult {
  totalScore: number;
  crimeScore: number;
  areaSafetyScore: number;
  facilitiesScore: number;
  propertyHistoryScore: number;
  costTrendsScore: number;
}

export const calculateCrimeScore = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 1
): Promise<number> => {
  const cacheKey = `crime:${latitude}:${longitude}:${radiusKm}`;
  const cached = await getCache<number>(cacheKey);
  if (cached !== null) return cached;

  // Query crime data from database
  const result = await queryOne<{ avg_incidents: number }>(
    `SELECT AVG(incident_count) as avg_incidents FROM crime_data
     WHERE ST_DWithin(
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       $3 * 1000
     )`,
    [longitude, latitude, radiusKm]
  );

  // Normalize crime score (0-100, where 100 is safest)
  const avgIncidents = result?.avg_incidents || 0;
  const crimeScore = Math.max(0, 100 - avgIncidents * 2);

  await setCache(cacheKey, crimeScore, 7 * 24 * 60 * 60);
  return crimeScore;
};

export const calculateAreaSafetyScore = async (latitude: number, longitude: number): Promise<number> => {
  const cacheKey = `area_safety:${latitude}:${longitude}`;
  const cached = await getCache<number>(cacheKey);
  if (cached !== null) return cached;

  // Check for natural hazards (floods, earthquakes)
  const hazardsResult = await queryMany<{ hazard_type: string; severity: number }>(
    `SELECT hazard_type, severity FROM hazard_data
     WHERE ST_DWithin(
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       5000
     )`,
    [longitude, latitude]
  );

  let hazardScore = 100;
  for (const hazard of hazardsResult) {
    hazardScore -= hazard.severity * 5;
  }

  const areaSafetyScore = Math.max(0, hazardScore);
  await setCache(cacheKey, areaSafetyScore, 7 * 24 * 60 * 60);
  return areaSafetyScore;
};

export const calculateFacilitiesScore = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  const cacheKey = `facilities:${latitude}:${longitude}`;
  const cached = await getCache<number>(cacheKey);
  if (cached !== null) return cached;

  // Check proximity to important facilities
  const hospitals = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM facilities
     WHERE type = 'hospital' AND ST_DWithin(
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       2000
     )`,
    [longitude, latitude]
  );

  const police = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM facilities
     WHERE type = 'police_station' AND ST_DWithin(
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       2000
     )`,
    [longitude, latitude]
  );

  let facilitiesScore = 0;
  facilitiesScore += (hospitals?.count || 0) > 0 ? 30 : 0;
  facilitiesScore += (police?.count || 0) > 0 ? 30 : 0;
  facilitiesScore += 20; // Base points for general proximity

  return Math.min(100, facilitiesScore);
};

export const calculatePropertyHistoryScore = async (
  propertyId: string,
  latitude: number,
  longitude: number
): Promise<number> => {
  const cacheKey = `history:${propertyId}`;
  const cached = await getCache<number>(cacheKey);
  if (cached !== null) return cached;

  // Check property history
  const history = await queryOne<{ avg_price_change: number; previous_incidents: number }>(
    `SELECT 
       AVG(CASE WHEN price_trend = 'up' THEN 1 ELSE -1 END) as avg_price_change,
       COUNT(CASE WHEN incident_type IS NOT NULL THEN 1 END) as previous_incidents
     FROM property_history
     WHERE property_id = $1`,
    [propertyId]
  );

  let historyScore = 70; // Base score

  if (history?.avg_price_change && history.avg_price_change > 0) {
    historyScore += 20;
  } else if (history?.avg_price_change && history.avg_price_change < 0) {
    historyScore -= 10;
  }

  if (history?.previous_incidents && history.previous_incidents > 5) {
    historyScore -= 30;
  }

  return Math.max(0, Math.min(100, historyScore));
};

export const calculateCostTrendsScore = async (
  propertyId: string,
  latitude: number,
  longitude: number
): Promise<number> => {
  // Cost trends are less critical for safety, but we factor in market stability
  const cacheKey = `cost_trends:${propertyId}`;
  const cached = await getCache<number>(cacheKey);
  if (cached !== null) return cached;

  const trend = await queryOne<{ trend: string; variance: number }>(
    `SELECT trend, variance FROM price_trends WHERE property_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [propertyId]
  );

  let costScore = 50; // Neutral baseline

  if (trend?.trend === 'stable') {
    costScore += 30;
  } else if (trend?.trend === 'up') {
    costScore += 20;
  }

  if (trend?.variance && trend.variance < 10) {
    costScore += 20;
  }

  return Math.max(0, Math.min(100, costScore));
};

export const calculateSafetyScore = async (
  propertyId: string,
  latitude: number,
  longitude: number
): Promise<ScoringResult> => {
  logger.info('Calculating safety score', { propertyId, latitude, longitude });

  const [
    crimeScore,
    areaSafetyScore,
    facilitiesScore,
    propertyHistoryScore,
    costTrendsScore,
  ] = await Promise.all([
    calculateCrimeScore(latitude, longitude),
    calculateAreaSafetyScore(latitude, longitude),
    calculateFacilitiesScore(latitude, longitude),
    calculatePropertyHistoryScore(propertyId, latitude, longitude),
    calculateCostTrendsScore(propertyId, latitude, longitude),
  ]);

  const totalScore = Math.round(
    crimeScore * SAFETY_SCORE_WEIGHTS.CRIME_DATA +
    areaSafetyScore * SAFETY_SCORE_WEIGHTS.AREA_SAFETY +
    facilitiesScore * SAFETY_SCORE_WEIGHTS.FACILITIES_PROXIMITY +
    propertyHistoryScore * SAFETY_SCORE_WEIGHTS.PROPERTY_HISTORY +
    costTrendsScore * SAFETY_SCORE_WEIGHTS.COST_TRENDS
  );

  const result: ScoringResult = {
    totalScore,
    crimeScore,
    areaSafetyScore,
    facilitiesScore,
    propertyHistoryScore,
    costTrendsScore,
  };

  logger.info('Safety score calculated', { propertyId, ...result });
  return result;
};
