-- =============================================================================
-- NestSafely Database Schema
-- PostgreSQL 14+ with PostGIS 3.x
-- =============================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified_at TIMESTAMP,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  preferred_location GEOMETRY(POINT, 4326),
  search_radius_km INT DEFAULT 10,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- =============================================================================
-- PROPERTIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('rent', 'sale', 'lease')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('apartment', 'house', 'commercial', 'land', 'office', 'shop')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'rented', 'delisted')),
  address VARCHAR(500) NOT NULL,
  location GEOMETRY(POINT, 4326) NOT NULL,
  city VARCHAR(100) NOT NULL,
  area VARCHAR(100),
  postal_code VARCHAR(20),
  bedrooms INT,
  bathrooms INT,
  area_sqft DECIMAL(10, 2),
  constructed_year INT,
  price DECIMAL(15, 2) NOT NULL CHECK (price > 0),
  price_per_sqft DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'PKR',
  has_electricity BOOLEAN DEFAULT true,
  has_gas BOOLEAN DEFAULT false,
  has_water BOOLEAN DEFAULT true,
  has_sewerage BOOLEAN DEFAULT true,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT false,
  main_image_url TEXT,
  images_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX idx_properties_price ON properties(price);

-- =============================================================================
-- SAFETY_SCORES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS safety_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  area_score DECIMAL(5, 2) NOT NULL CHECK (area_score BETWEEN 0 AND 100),
  history_score DECIMAL(5, 2) NOT NULL CHECK (history_score BETWEEN 0 AND 100),
  facility_score DECIMAL(5, 2) NOT NULL CHECK (facility_score BETWEEN 0 AND 100),
  cost_score DECIMAL(5, 2) NOT NULL CHECK (cost_score BETWEEN 0 AND 100),
  overall_score DECIMAL(5, 2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  grade VARCHAR(1) NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  verdict VARCHAR(20) CHECK (verdict IN ('RENT', 'BUY', 'AVOID', 'NEGOTIATE', NULL)),
  ai_verdict_text TEXT,
  score_breakdown JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
  computed_by VARCHAR(50) DEFAULT 'system'
);

CREATE INDEX idx_safety_scores_property_id ON safety_scores(property_id);
CREATE INDEX idx_safety_scores_grade ON safety_scores(grade);
CREATE INDEX idx_safety_scores_overall_score ON safety_scores(overall_score DESC);
CREATE INDEX idx_safety_scores_expires_at ON safety_scores(expires_at) WHERE expires_at < CURRENT_TIMESTAMP;

-- =============================================================================
-- PROPERTY_HISTORY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS property_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('ownership_change', 'dispute', 'complaint', 'flood_event', 'legal_issue')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical', NULL)),
  event_date DATE NOT NULL,
  reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(100),
  source_url TEXT,
  documents_count INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_property_history_property_id ON property_history(property_id);
CREATE INDEX idx_property_history_event_type ON property_history(event_type);
CREATE INDEX idx_property_history_event_date ON property_history(event_date DESC);
CREATE INDEX idx_property_history_severity ON property_history(severity);

-- =============================================================================
-- AREA_DATA TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS area_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location GEOMETRY(POINT, 4326) NOT NULL,
  grid_cell VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  area_name VARCHAR(100),
  crime_index DECIMAL(5, 2) CHECK (crime_index BETWEEN 0 AND 100),
  violent_crimes_per_100k DECIMAL(8, 2),
  property_crimes_per_100k DECIMAL(8, 2),
  crime_trend VARCHAR(50),
  flood_zone VARCHAR(50) CHECK (flood_zone IN ('none', 'low', 'medium', 'high', 'very_high', NULL)),
  flood_risk_index DECIMAL(5, 2) CHECK (flood_risk_index BETWEEN 0 AND 100),
  last_flood_year INT,
  noise_level_db DECIMAL(5, 2),
  air_quality_index DECIMAL(5, 2) CHECK (air_quality_index BETWEEN 0 AND 100),
  water_quality_index DECIMAL(5, 2) CHECK (water_quality_index BETWEEN 0 AND 100),
  electricity_reliability_pct DECIMAL(5, 2),
  water_availability_hrs_per_day DECIMAL(4, 1),
  avg_internet_speed_mbps DECIMAL(8, 2),
  avg_property_price_per_sqft DECIMAL(10, 2),
  price_trend_yearly_pct DECIMAL(5, 2),
  rental_yield_pct DECIMAL(5, 2),
  population_density_per_sqkm INT,
  median_income_usd INT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  data_source VARCHAR(100)
);

CREATE INDEX idx_area_data_location ON area_data USING GIST(location);
CREATE INDEX idx_area_data_city ON area_data(city);
CREATE INDEX idx_area_data_flood_zone ON area_data(flood_zone);

-- =============================================================================
-- FACILITIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('hospital', 'school', 'grocery', 'park', 'bank', 'transport', 'restaurant', 'office', 'police', 'fire')),
  subcategory VARCHAR(100),
  location GEOMETRY(POINT, 4326) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  rating DECIMAL(3, 2) CHECK (rating IS NULL OR (rating BETWEEN 0 AND 5)),
  rating_count INT,
  phone VARCHAR(20),
  website_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_facilities_location ON facilities USING GIST(location);
CREATE INDEX idx_facilities_category ON facilities(category);
CREATE INDEX idx_facilities_city ON facilities(city);

-- =============================================================================
-- SAVED_PROPERTIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  notes TEXT,
  rating INT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  UNIQUE(user_id, property_id)
);

CREATE INDEX idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX idx_saved_properties_property_id ON saved_properties(property_id);
CREATE INDEX idx_saved_properties_saved_at ON saved_properties(saved_at DESC);

-- =============================================================================
-- REFRESH_TOKENS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL CHECK (expires_at > CURRENT_TIMESTAMP),
  user_agent VARCHAR(255),
  ip_address INET,
  device_name VARCHAR(100),
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked);

-- =============================================================================
-- AUDIT_LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL CHECK (action IN ('login', 'logout', 'register', 'update_profile', 'create_property', 'update_property', 'delete_property', 'compute_score', 'update_score', 'delete_user', 'update_user_role', 'data_sync', 'api_call')),
  resource_type VARCHAR(50),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- =============================================================================
-- API_REQUESTS TABLE (for rate limiting & analytics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS')),
  ip_address INET NOT NULL,
  api_key_id UUID,
  status_code INT CHECK (status_code BETWEEN 100 AND 599),
  response_time_ms INT CHECK (response_time_ms > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_api_requests_ip_created_at ON api_requests(ip_address, created_at DESC);
CREATE INDEX idx_api_requests_user_created_at ON api_requests(user_id, created_at DESC);
CREATE INDEX idx_api_requests_endpoint ON api_requests(endpoint);

-- =============================================================================
-- STORED PROCEDURES & TRIGGERS
-- =============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER safety_scores_updated_at BEFORE UPDATE ON safety_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER area_data_updated_at BEFORE UPDATE ON area_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER facilities_updated_at BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER property_history_updated_at BEFORE UPDATE ON property_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS (for common queries)
-- =============================================================================

-- Active properties with scores
CREATE OR REPLACE VIEW active_properties_with_scores AS
SELECT 
  p.*,
  ss.overall_score,
  ss.grade,
  ss.verdict
FROM properties p
LEFT JOIN safety_scores ss ON p.id = ss.property_id
WHERE p.status = 'active' AND p.deleted_at IS NULL;

-- User statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id,
  u.email,
  COUNT(DISTINCT p.id) as properties_count,
  COUNT(DISTINCT sp.id) as saved_properties_count,
  MAX(p.created_at) as last_property_created_at
FROM users u
LEFT JOIN properties p ON u.id = p.owner_id
LEFT JOIN saved_properties sp ON u.id = sp.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email;

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE properties IS 'Core properties table with geospatial location support';
COMMENT ON TABLE safety_scores IS 'Computed safety intelligence scores with 24-hour TTL';
COMMENT ON TABLE property_history IS 'Historical events: disputes, complaints, floods, ownership changes';
COMMENT ON TABLE area_data IS 'Area-level statistics: crime, flood, infrastructure, economic data';
COMMENT ON TABLE facilities IS 'Points of interest: hospitals, schools, grocery stores, etc.';

-- =============================================================================
-- INITIAL TEST DATA (Optional - uncomment to populate)
-- =============================================================================

-- INSERT INTO users (email, password_hash, first_name, last_name, role)
-- VALUES (
--   'admin@test.com',
--   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUaqvjJm', -- password: 'secret'
--   'Admin',
--   'User',
--   'admin'
-- );

-- =============================================================================
-- VERIFICATION QUERIES (Check PostGIS is working)
-- =============================================================================

-- Uncomment to verify installation:
-- SELECT postgis_version();
-- SELECT ST_Point(74.3587, 31.5204)::geography;
