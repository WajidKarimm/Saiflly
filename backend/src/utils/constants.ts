export const SAFETY_SCORE_WEIGHTS = {
  CRIME_DATA: 0.35,
  AREA_SAFETY: 0.25,
  FACILITIES_PROXIMITY: 0.2,
  PROPERTY_HISTORY: 0.15,
  COST_TRENDS: 0.05,
};

export const SAFETY_SCORE_RANGES = {
  VERY_SAFE: { min: 80, max: 100, label: 'Very Safe' },
  SAFE: { min: 60, max: 79, label: 'Safe' },
  MODERATE: { min: 40, max: 59, label: 'Moderate' },
  RISKY: { min: 20, max: 39, label: 'Risky' },
  VERY_RISKY: { min: 0, max: 19, label: 'Very Risky' },
};

export const FACILITY_TYPES = {
  HOSPITAL: 'hospital',
  POLICE_STATION: 'police_station',
  FIRE_STATION: 'fire_station',
  SCHOOL: 'school',
  MARKET: 'market',
  PARK: 'park',
};

export const FACILITY_PROXIMITY_THRESHOLDS = {
  HOSPITAL: 2000, // 2km
  POLICE_STATION: 2000,
  FIRE_STATION: 2500,
  SCHOOL: 1500,
  MARKET: 1000,
  PARK: 1500,
};

export const CACHE_TTL = {
  SCORES: 24 * 60 * 60, // 24 hours
  VERDICTS: 24 * 60 * 60,
  FACILITY_DATA: 7 * 24 * 60 * 60, // 7 days
  SESSIONS: 7 * 24 * 60 * 60,
};

export const RATE_LIMITS = {
  SEARCH: 100, // 100 requests per minute
  AUTH: 5, // 5 login attempts per 15 minutes
};

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  ANALYST: 'analyst',
};

export const PROPERTY_TYPES = {
  HOUSE: 'house',
  APARTMENT: 'apartment',
  TOWNHOUSE: 'townhouse',
  COMMERCIAL: 'commercial',
  LAND: 'land',
};
