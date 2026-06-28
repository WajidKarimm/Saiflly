import axios from 'axios';
import { env } from '../../config/env';
import { getCache, setCache } from '../../config/redis';
import { CACHE_TTL } from '../../utils/constants';
import logger from '../../utils/logger';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface MarketListing {
  id: string;
  address: string;
  price: number;
  price_per_sqft: number;
  bedrooms: number;
  bathrooms: number;
  size_sqft: number;
  property_type: string;
  listing_date: string;
  source: string;
}

export interface PriceTrend {
  period: string;
  average_price: number;
  median_price: number;
  change_pct: number;
  volume: number;
}

export interface MarketAnalysis {
  average_price: number;
  median_price: number;
  price_per_sqft: number;
  comparable_listings: MarketListing[];
  price_trends: PriceTrend[];
  market_health: 'hot' | 'warm' | 'cool' | 'cold';
  appreciation_rate: number;
  last_updated: string;
}

// -------------------------------------------------------------------
// Real Estate Data Client
// -------------------------------------------------------------------

const RE_API_BASE =
  process.env.REAL_ESTATE_API_URL || 'https://api.realestate.example.com/v1';

/**
 * Fetch market analysis for a geographic area.
 */
export const fetchMarketAnalysis = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 3,
  propertyType?: string
): Promise<MarketAnalysis> => {
  const cacheKey = `realestate:market:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusKm}:${propertyType || 'all'}`;
  const cached = await getCache<MarketAnalysis>(cacheKey);
  if (cached) {
    logger.debug('Market analysis cache hit', { cacheKey });
    return cached;
  }

  try {
    const response = await axios.get(`${RE_API_BASE}/market/analysis`, {
      params: {
        lat: latitude,
        lng: longitude,
        radius: radiusKm,
        property_type: propertyType,
      },
      headers: {
        Authorization: `Bearer ${env.GOOGLE_PLACES_API_KEY}`,
        Accept: 'application/json',
      },
      timeout: 15_000,
    });

    const data: MarketAnalysis = response.data;
    await setCache(cacheKey, data, CACHE_TTL.SCORES);

    logger.info('Market analysis fetched', {
      latitude,
      longitude,
      avgPrice: data.average_price,
    });

    return data;
  } catch (error) {
    logger.warn('Real estate API failed — using fallback', {
      error: (error as Error).message,
    });
    return generateFallbackMarketAnalysis();
  }
};

/**
 * Fetch comparable property listings near a location.
 */
export const fetchComparableListings = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 2,
  limit: number = 10
): Promise<MarketListing[]> => {
  const cacheKey = `realestate:comps:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusKm}`;
  const cached = await getCache<MarketListing[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${RE_API_BASE}/listings/comparable`, {
      params: { lat: latitude, lng: longitude, radius: radiusKm, limit },
      headers: { Authorization: `Bearer ${env.GOOGLE_PLACES_API_KEY}` },
      timeout: 10_000,
    });

    const listings: MarketListing[] = response.data.listings || [];
    await setCache(cacheKey, listings, CACHE_TTL.SCORES);
    return listings;
  } catch (error) {
    logger.warn('Comparable listings fetch failed', {
      error: (error as Error).message,
    });
    return [];
  }
};

/**
 * Fetch historical price trends for an area.
 */
export const fetchPriceTrends = async (
  latitude: number,
  longitude: number,
  months: number = 12
): Promise<PriceTrend[]> => {
  const cacheKey = `realestate:trends:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${months}`;
  const cached = await getCache<PriceTrend[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${RE_API_BASE}/market/trends`, {
      params: { lat: latitude, lng: longitude, months },
      headers: { Authorization: `Bearer ${env.GOOGLE_PLACES_API_KEY}` },
      timeout: 10_000,
    });

    const trends: PriceTrend[] = response.data.trends || [];
    await setCache(cacheKey, trends, CACHE_TTL.FACILITY_DATA);
    return trends;
  } catch (error) {
    logger.warn('Price trends fetch failed', { error: (error as Error).message });
    return generateFallbackTrends();
  }
};

/**
 * Derive a market-value cost score (0-100).
 * 100 = great value, 0 = severely overpriced.
 */
export const calculateCostScore = (
  askingPrice: number,
  marketAnalysis: MarketAnalysis
): number => {
  if (!marketAnalysis.average_price || marketAnalysis.average_price === 0) return 50;

  const ratio = askingPrice / marketAnalysis.average_price;

  // Below average is good; above average penalised
  if (ratio <= 0.85) return 95;
  if (ratio <= 0.95) return 85;
  if (ratio <= 1.05) return 70;
  if (ratio <= 1.15) return 55;
  if (ratio <= 1.3) return 40;
  return 20;
};

// -------------------------------------------------------------------
// Fallback / mock data
// -------------------------------------------------------------------

const generateFallbackMarketAnalysis = (): MarketAnalysis => ({
  average_price: 15_000_000,
  median_price: 12_500_000,
  price_per_sqft: 8500,
  comparable_listings: [],
  price_trends: generateFallbackTrends(),
  market_health: 'warm',
  appreciation_rate: 5.2,
  last_updated: new Date().toISOString(),
});

const generateFallbackTrends = (): PriceTrend[] => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (5 - i));
    return {
      period: date.toISOString().slice(0, 7),
      average_price: 14_000_000 + i * 200_000,
      median_price: 12_000_000 + i * 150_000,
      change_pct: 0.8 + Math.random() * 1.5,
      volume: 45 + Math.floor(Math.random() * 30),
    };
  });
};
