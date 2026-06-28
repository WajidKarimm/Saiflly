import axios from 'axios';
import { env } from '../../config/env';
import { getCache, setCache } from '../../config/redis';
import { CACHE_TTL } from '../../utils/constants';
import logger from '../../utils/logger';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface FloodRiskData {
  zone: 'none' | 'low' | 'medium' | 'high' | 'very_high';
  risk_index: number; // 0-100
  last_flood_year?: number;
  flood_frequency: number; // floods per decade
  elevation_metres: number;
  drainage_quality: 'good' | 'moderate' | 'poor';
}

export interface WeatherSummary {
  avg_temperature_c: number;
  avg_humidity_pct: number;
  annual_rainfall_mm: number;
  extreme_weather_events: number; // per year
  air_quality_index: number; // 0-500 (US AQI)
}

export interface NaturalHazardData {
  flood_risk: FloodRiskData;
  weather_summary: WeatherSummary;
  seismic_zone: 'none' | 'low' | 'moderate' | 'high';
  overall_hazard_score: number; // 0-100, where 100 = safest
  last_updated: string;
}

// -------------------------------------------------------------------
// Weather / Hazard API Client
// -------------------------------------------------------------------

const WEATHER_API_BASE =
  process.env.WEATHER_API_URL || 'https://api.weatherdata.example.com/v1';
const NDMA_API_BASE =
  process.env.NDMA_API_URL || 'https://api.ndma.example.pk/v1';

/**
 * Fetch comprehensive natural-hazard data for a location.
 */
export const fetchNaturalHazardData = async (
  latitude: number,
  longitude: number
): Promise<NaturalHazardData> => {
  const cacheKey = `hazard:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = await getCache<NaturalHazardData>(cacheKey);
  if (cached) {
    logger.debug('Natural hazard data cache hit', { cacheKey });
    return cached;
  }

  try {
    const [floodRisk, weatherSummary] = await Promise.all([
      fetchFloodRisk(latitude, longitude),
      fetchWeatherSummary(latitude, longitude),
    ]);

    const seismicZone = deriveSeismicZone(latitude, longitude);
    const overallScore = calculateHazardSafetyScore(
      floodRisk,
      weatherSummary,
      seismicZone
    );

    const data: NaturalHazardData = {
      flood_risk: floodRisk,
      weather_summary: weatherSummary,
      seismic_zone: seismicZone,
      overall_hazard_score: overallScore,
      last_updated: new Date().toISOString(),
    };

    await setCache(cacheKey, data, CACHE_TTL.FACILITY_DATA);

    logger.info('Natural hazard data compiled', {
      latitude,
      longitude,
      overallScore,
    });

    return data;
  } catch (error) {
    logger.warn('Hazard data fetch failed — using fallback', {
      error: (error as Error).message,
    });
    return generateFallbackHazardData();
  }
};

/**
 * Fetch flood risk data for a location.
 */
export const fetchFloodRisk = async (
  latitude: number,
  longitude: number
): Promise<FloodRiskData> => {
  const cacheKey = `flood:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = await getCache<FloodRiskData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${NDMA_API_BASE}/flood-risk`, {
      params: { lat: latitude, lng: longitude },
      timeout: 10_000,
    });

    const data: FloodRiskData = response.data;
    await setCache(cacheKey, data, CACHE_TTL.FACILITY_DATA);
    return data;
  } catch (error) {
    logger.warn('Flood risk API failed', { error: (error as Error).message });
    return generateFallbackFloodRisk();
  }
};

/**
 * Fetch weather summary for a location.
 */
export const fetchWeatherSummary = async (
  latitude: number,
  longitude: number
): Promise<WeatherSummary> => {
  const cacheKey = `weather:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  const cached = await getCache<WeatherSummary>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${WEATHER_API_BASE}/summary`, {
      params: { lat: latitude, lng: longitude, period: '12months' },
      timeout: 10_000,
    });

    const data: WeatherSummary = response.data;
    await setCache(cacheKey, data, CACHE_TTL.FACILITY_DATA);
    return data;
  } catch (error) {
    logger.warn('Weather summary API failed', {
      error: (error as Error).message,
    });
    return generateFallbackWeather();
  }
};

// -------------------------------------------------------------------
// Scoring helpers
// -------------------------------------------------------------------

/**
 * Compute a safety score from hazard data.
 * 100 = safest, 0 = most hazardous.
 */
export const calculateHazardSafetyScore = (
  flood: FloodRiskData,
  weather: WeatherSummary,
  seismicZone: string
): number => {
  // Flood component (40 % weight)
  const floodScore = Math.max(0, 100 - flood.risk_index);

  // Weather component (30 % weight)
  let weatherScore = 80;
  if (weather.extreme_weather_events > 5) weatherScore -= 20;
  if (weather.air_quality_index > 150) weatherScore -= 15;
  weatherScore = Math.max(0, weatherScore);

  // Seismic component (30 % weight)
  const seismicScores: Record<string, number> = {
    none: 100,
    low: 80,
    moderate: 55,
    high: 25,
  };
  const seismicScore = seismicScores[seismicZone] ?? 60;

  return Math.round(floodScore * 0.4 + weatherScore * 0.3 + seismicScore * 0.3);
};

/**
 * Rough seismic-zone derivation based on latitude/longitude.
 * In production, this would query a proper seismic database.
 */
const deriveSeismicZone = (
  latitude: number,
  _longitude: number
): 'none' | 'low' | 'moderate' | 'high' => {
  // Northern Pakistan is in a higher seismic zone
  if (latitude > 34) return 'high';
  if (latitude > 32) return 'moderate';
  if (latitude > 28) return 'low';
  return 'none';
};

// -------------------------------------------------------------------
// Fallback / mock data
// -------------------------------------------------------------------

const generateFallbackFloodRisk = (): FloodRiskData => ({
  zone: 'low',
  risk_index: 20,
  last_flood_year: 2020,
  flood_frequency: 1.5,
  elevation_metres: 215,
  drainage_quality: 'moderate',
});

const generateFallbackWeather = (): WeatherSummary => ({
  avg_temperature_c: 26,
  avg_humidity_pct: 55,
  annual_rainfall_mm: 620,
  extreme_weather_events: 2,
  air_quality_index: 120,
});

const generateFallbackHazardData = (): NaturalHazardData => {
  const flood = generateFallbackFloodRisk();
  const weather = generateFallbackWeather();
  const seismic = 'low' as const;

  return {
    flood_risk: flood,
    weather_summary: weather,
    seismic_zone: seismic,
    overall_hazard_score: calculateHazardSafetyScore(flood, weather, seismic),
    last_updated: new Date().toISOString(),
  };
};
