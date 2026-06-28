import axios from 'axios';
import { env } from '../../config/env';
import { getCache, setCache } from '../../config/redis';
import { CACHE_TTL } from '../../utils/constants';
import logger from '../../utils/logger';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface CrimeIncident {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  description?: string;
  location?: { latitude: number; longitude: number };
}

export interface CrimeDataResponse {
  total_incidents: number;
  incidents_per_1000: number;
  crime_types: Record<string, number>;
  trend: 'increasing' | 'decreasing' | 'stable';
  recent_incidents: CrimeIncident[];
  last_updated: string;
}

// -------------------------------------------------------------------
// Crime API Client
// -------------------------------------------------------------------

const CRIME_API_BASE =
  process.env.CRIME_API_BASE_URL || 'https://api.crimedata.example.com/v1';

/**
 * Fetch crime statistics for a geographic area.
 *
 * @param latitude  – centre latitude
 * @param longitude – centre longitude
 * @param radiusKm  – search radius in kilometres (default 2)
 */
export const fetchCrimeData = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 2
): Promise<CrimeDataResponse> => {
  const cacheKey = `crimeapi:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusKm}`;
  const cached = await getCache<CrimeDataResponse>(cacheKey);
  if (cached) {
    logger.debug('Crime data cache hit', { cacheKey });
    return cached;
  }

  try {
    const response = await axios.get(`${CRIME_API_BASE}/statistics`, {
      params: {
        lat: latitude,
        lng: longitude,
        radius: radiusKm,
        period: '12months',
      },
      headers: {
        'X-API-Key': env.CRIME_API_KEY,
        Accept: 'application/json',
      },
      timeout: 10_000,
    });

    const data: CrimeDataResponse = response.data;

    await setCache(cacheKey, data, CACHE_TTL.FACILITY_DATA);
    logger.info('Crime data fetched from external API', {
      latitude,
      longitude,
      radiusKm,
      totalIncidents: data.total_incidents,
    });

    return data;
  } catch (error) {
    logger.warn('Crime API request failed — using fallback data', {
      latitude,
      longitude,
      error: (error as Error).message,
    });

    return generateFallbackCrimeData(latitude, longitude);
  }
};

/**
 * Convert raw crime data into a normalised 0-100 safety score.
 * 100 = safest, 0 = most dangerous.
 */
export const calculateCrimeIndex = (data: CrimeDataResponse): number => {
  // Lower incidents → higher score
  const incidentScore = Math.max(0, 100 - data.incidents_per_1000 * 5);

  // Penalise upward crime trends
  const trendMultiplier =
    data.trend === 'decreasing' ? 1.1 : data.trend === 'increasing' ? 0.85 : 1;

  return Math.round(Math.min(100, Math.max(0, incidentScore * trendMultiplier)));
};

/**
 * Fetch recent crime incidents near a location.
 */
export const fetchRecentIncidents = async (
  latitude: number,
  longitude: number,
  limit: number = 10
): Promise<CrimeIncident[]> => {
  const cacheKey = `crimeapi:incidents:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${limit}`;
  const cached = await getCache<CrimeIncident[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${CRIME_API_BASE}/incidents`, {
      params: { lat: latitude, lng: longitude, limit },
      headers: { 'X-API-Key': env.CRIME_API_KEY },
      timeout: 10_000,
    });

    const incidents: CrimeIncident[] = response.data.incidents || [];

    await setCache(cacheKey, incidents, CACHE_TTL.SCORES);
    return incidents;
  } catch (error) {
    logger.warn('Failed to fetch recent incidents', { error: (error as Error).message });
    return [];
  }
};

// -------------------------------------------------------------------
// Fallback / mock data (used when external API is unreachable)
// -------------------------------------------------------------------

const generateFallbackCrimeData = (
  _latitude: number,
  _longitude: number
): CrimeDataResponse => ({
  total_incidents: 15,
  incidents_per_1000: 3.2,
  crime_types: {
    theft: 6,
    burglary: 3,
    vandalism: 4,
    assault: 2,
  },
  trend: 'stable',
  recent_incidents: [
    {
      type: 'theft',
      severity: 'low',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Minor theft reported in the area',
    },
    {
      type: 'vandalism',
      severity: 'low',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Property vandalism incident',
    },
  ],
  last_updated: new Date().toISOString(),
});
