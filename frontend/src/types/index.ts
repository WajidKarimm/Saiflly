// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  property_alerts: boolean;
}

// Auth types
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface AuthResponse {
  success: boolean;
  data: Partial<User>;
  tokens: AuthTokens;
}

// Property types
export interface Property {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  property_type: 'house' | 'apartment' | 'townhouse' | 'commercial' | 'land';
  price: number;
  size_sqft: number;
  bedrooms: number;
  bathrooms: number;
  year_built?: number;
  created_at: string;
  updated_at: string;
}

// Safety Score types
export interface SafetyScore {
  property_id: string;
  total_score: number;
  crime_score: number;
  area_safety_score: number;
  facilities_score: number;
  property_history_score: number;
  cost_trends_score: number;
  calculated_at: string;
}

export interface ScoreBreakdown {
  total_score: number;
  components: {
    crime: ScoreComponent;
    area_safety: ScoreComponent;
    facilities: ScoreComponent;
    property_history: ScoreComponent;
    cost_trends: ScoreComponent;
  };
  calculated_at: string;
}

export interface ScoreComponent {
  score: number;
  weight: number;
  weighted_value: number;
}

// AI Verdict types
export interface AIVerdict {
  summary: string;
  recommendation: string;
  risk_level: 'low' | 'medium' | 'high';
  key_factors: string[];
  considerations: string[];
}

// Search types
export interface SearchFilters {
  latitude: number;
  longitude: number;
  radius_km?: number;
  property_type?: string;
  min_budget?: number;
  max_budget?: number;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    properties: PropertyWithScore[];
    pagination: Pagination;
  };
}

export interface PropertyWithScore extends Property {
  safety_score: SafetyScore;
}

export interface PropertyDetail {
  property: Property;
  safety_score: SafetyScore;
  ai_verdict: AIVerdict;
}

// Saved properties
export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  notes?: string;
  saved_at: string;
  property: Property;
}

export interface SavedPropertiesResponse {
  success: boolean;
  data: {
    properties: SavedProperty[];
    pagination: Pagination;
  };
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

// Map types
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  score: number;
  address: string;
}
