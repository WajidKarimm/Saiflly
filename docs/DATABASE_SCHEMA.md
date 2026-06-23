# Database Schema Design - NestSafely

Complete PostgreSQL schema with PostGIS for geospatial queries, security best practices, and indexing strategy.

## 🗄️ Overview

```
┌─────────────────────────────────────────────┐
│              PostgreSQL 14+                  │
│  Extensions: PostGIS 3.x, pgcrypto, UUID   │
└─────────────────────────────────────────────┘

Core Tables:
├─ users (authentication & profiles)
├─ properties (listings)
├─ property_history (disputes, complaints, events)
├─ safety_scores (computed scores & verdicts)
├─ area_data (neighborhood statistics)
├─ facilities (nearby POIs)
├─ saved_properties (user favorites)
└─ audit_log (security & compliance)
```

## 📋 Complete Schema

### 1. USERS Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified_at TIMESTAMP,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  
  -- Authentication
  role VARCHAR(50) DEFAULT 'user', -- user, agent, admin
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, deleted
  
  -- Preferences
  preferred_location GEOMETRY(POINT, 4326), -- PostGIS: user's main area
  search_radius_km INT DEFAULT 10,
  notification_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP -- Soft delete
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### 2. PROPERTIES Table (Core)
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- rent, sale, lease
  category VARCHAR(50) NOT NULL, -- apartment, house, commercial, land
  status VARCHAR(50) DEFAULT 'active', -- active, sold, rented, delisted
  
  -- Location (PostGIS)
  address VARCHAR(500) NOT NULL,
  location GEOMETRY(POINT, 4326) NOT NULL, -- latitude, longitude
  city VARCHAR(100) NOT NULL,
  area VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Physical Details
  bedrooms INT,
  bathrooms INT,
  area_sqft DECIMAL(10, 2),
  constructed_year INT,
  
  -- Pricing
  price DECIMAL(15, 2) NOT NULL,
  price_per_sqft DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'PKR',
  
  -- Utility Details
  has_electricity BOOLEAN DEFAULT true,
  has_gas BOOLEAN DEFAULT false,
  has_water BOOLEAN DEFAULT true,
  has_sewerage BOOLEAN DEFAULT true,
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES users(id),
  is_verified BOOLEAN DEFAULT false, -- Manual verification
  
  -- Media
  main_image_url TEXT,
  images_count INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,
  
  CONSTRAINT chk_price_positive CHECK (price > 0),
  CONSTRAINT chk_area_positive CHECK (area_sqft IS NULL OR area_sqft > 0)
);

-- Geospatial index (VERY IMPORTANT)
CREATE INDEX idx_properties_location ON properties 
  USING GIST(location);

-- Regular indexes
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX idx_properties_price ON properties(price);
```

### 3. SAFETY_SCORES Table
```sql
CREATE TABLE safety_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Sub-Scores (0-100)
  area_score DECIMAL(5, 2) NOT NULL, -- Crime, flood, noise
  history_score DECIMAL(5, 2) NOT NULL, -- Disputes, complaints
  facility_score DECIMAL(5, 2) NOT NULL, -- Proximity to amenities
  cost_score DECIMAL(5, 2) NOT NULL, -- Market value, trends
  
  -- Overall Score
  overall_score DECIMAL(5, 2) NOT NULL, -- Weighted average
  grade VARCHAR(1) NOT NULL, -- A, B, C, D, F
  verdict VARCHAR(20), -- RENT, BUY, AVOID, NEGOTIATE
  ai_verdict_text TEXT, -- Plain language recommendation
  
  -- Breakdown Details (stored as JSON for flexibility)
  score_breakdown JSONB DEFAULT '{}'::jsonb, -- Detailed component scores
  
  -- Metadata
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
  
  -- Audit
  computed_by VARCHAR(50) DEFAULT 'system', -- system, manual_review
  
  CONSTRAINT chk_scores_range CHECK (
    area_score BETWEEN 0 AND 100 AND
    history_score BETWEEN 0 AND 100 AND
    facility_score BETWEEN 0 AND 100 AND
    cost_score BETWEEN 0 AND 100 AND
    overall_score BETWEEN 0 AND 100
  ),
  CONSTRAINT chk_grade_valid CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  CONSTRAINT chk_verdict_valid CHECK (verdict IN ('RENT', 'BUY', 'AVOID', 'NEGOTIATE', NULL))
);

-- Indexes
CREATE INDEX idx_safety_scores_property_id ON safety_scores(property_id);
CREATE INDEX idx_safety_scores_grade ON safety_scores(grade);
CREATE INDEX idx_safety_scores_overall_score ON safety_scores(overall_score DESC);
CREATE INDEX idx_safety_scores_expires_at ON safety_scores(expires_at) 
  WHERE expires_at < CURRENT_TIMESTAMP;
```

### 4. PROPERTY_HISTORY Table
```sql
CREATE TABLE property_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type VARCHAR(50) NOT NULL, -- ownership_change, dispute, complaint, flood_event, legal_issue
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50), -- low, medium, high, critical
  
  -- Dates
  event_date DATE NOT NULL,
  reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Evidence & Documentation
  source VARCHAR(100), -- government, user_report, news, external_api
  source_url TEXT,
  documents_count INT DEFAULT 0,
  
  -- Status
  verified BOOLEAN DEFAULT false, -- Manual verification
  resolved BOOLEAN DEFAULT false,
  resolved_date TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT chk_event_type CHECK (
    event_type IN ('ownership_change', 'dispute', 'complaint', 'flood_event', 'legal_issue')
  ),
  CONSTRAINT chk_severity CHECK (
    severity IN ('low', 'medium', 'high', 'critical', NULL)
  )
);

-- Indexes
CREATE INDEX idx_property_history_property_id ON property_history(property_id);
CREATE INDEX idx_property_history_event_type ON property_history(event_type);
CREATE INDEX idx_property_history_event_date ON property_history(event_date DESC);
CREATE INDEX idx_property_history_severity ON property_history(severity);
```

### 5. AREA_DATA Table
```sql
CREATE TABLE area_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location (Grid-based for efficiency)
  location GEOMETRY(POINT, 4326) NOT NULL,
  grid_cell VARCHAR(50), -- H3 grid reference for clustering
  city VARCHAR(100) NOT NULL,
  area_name VARCHAR(100),
  
  -- Crime Metrics
  crime_index DECIMAL(5, 2), -- 0-100 (higher = more crime)
  violent_crimes_per_100k DECIMAL(8, 2),
  property_crimes_per_100k DECIMAL(8, 2),
  crime_trend VARCHAR(50), -- increasing, stable, decreasing
  
  -- Environmental Data
  flood_zone VARCHAR(50), -- none, low, medium, high, very_high
  flood_risk_index DECIMAL(5, 2),
  last_flood_year INT,
  
  -- Noise & Pollution
  noise_level_db DECIMAL(5, 2),
  air_quality_index DECIMAL(5, 2),
  water_quality_index DECIMAL(5, 2),
  
  -- Infrastructure
  electricity_reliability_pct DECIMAL(5, 2), -- % uptime
  water_availability_hrs_per_day DECIMAL(4, 1),
  avg_internet_speed_mbps DECIMAL(8, 2),
  
  -- Economic Indicators
  avg_property_price_per_sqft DECIMAL(10, 2),
  price_trend_yearly_pct DECIMAL(5, 2), -- % change year-over-year
  rental_yield_pct DECIMAL(5, 2),
  
  -- Demographics
  population_density_per_sqkm INT,
  median_income_usd INT,
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  data_source VARCHAR(100), -- government_registry, third_party_api, survey
  
  CONSTRAINT chk_indices_range CHECK (
    crime_index BETWEEN 0 AND 100 AND
    flood_risk_index BETWEEN 0 AND 100 AND
    air_quality_index BETWEEN 0 AND 100
  )
);

-- Geospatial index for location queries
CREATE INDEX idx_area_data_location ON area_data 
  USING GIST(location);
CREATE INDEX idx_area_data_city ON area_data(city);
CREATE INDEX idx_area_data_flood_zone ON area_data(flood_zone);
```

### 6. FACILITIES Table (POIs - Points of Interest)
```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- hospital, school, grocery, park, bank, transport, etc
  subcategory VARCHAR(100),
  
  -- Location
  location GEOMETRY(POINT, 4326) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  
  -- Details
  rating DECIMAL(3, 2), -- Google Places rating
  rating_count INT,
  phone VARCHAR(20),
  website_url TEXT,
  
  -- Distance reference (computed, denormalized for performance)
  -- This is calculated when queried, not stored
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT chk_rating_range CHECK (
    rating IS NULL OR (rating BETWEEN 0 AND 5)
  )
);

-- Critical geospatial index
CREATE INDEX idx_facilities_location ON facilities 
  USING GIST(location);
CREATE INDEX idx_facilities_category ON facilities(category);
CREATE INDEX idx_facilities_city ON facilities(city);
```

### 7. SAVED_PROPERTIES Table
```sql
CREATE TABLE saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Metadata
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  notes TEXT,
  rating INT, -- 1-5 user rating
  
  -- Prevent duplicates
  UNIQUE(user_id, property_id)
);

-- Indexes
CREATE INDEX idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX idx_saved_properties_property_id ON saved_properties(property_id);
CREATE INDEX idx_saved_properties_saved_at ON saved_properties(saved_at DESC);
```

### 8. REFRESH_TOKENS Table
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Token info
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  
  -- Device info (optional, for tracking)
  user_agent VARCHAR(255),
  ip_address INET,
  device_name VARCHAR(100),
  
  -- Status
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT chk_expiry CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked);
```

### 9. AUDIT_LOG Table (Security & Compliance)
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User info
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  
  -- Action details
  action VARCHAR(100) NOT NULL, -- login, create_property, update_score, delete_user, etc
  resource_type VARCHAR(50), -- user, property, score, etc
  resource_id UUID,
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Request info
  ip_address INET,
  user_agent VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT chk_action_valid CHECK (
    action IN ('login', 'logout', 'register', 'update_profile', 'create_property', 
               'update_property', 'delete_property', 'compute_score', 'update_score',
               'delete_user', 'update_user_role', 'data_sync', 'api_call')
  )
);

-- Indexes
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
```

### 10. API_REQUESTS Table (Rate Limiting & Analytics)
```sql
CREATE TABLE api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request info
  user_id UUID REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  
  -- Rate limiting
  ip_address INET NOT NULL,
  api_key_id UUID, -- if using API keys
  
  -- Response
  status_code INT,
  response_time_ms INT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT chk_status_code CHECK (status_code BETWEEN 100 AND 599),
  CONSTRAINT chk_response_time CHECK (response_time_ms > 0)
);

-- Indexes (for rate limiting queries)
CREATE INDEX idx_api_requests_ip_created_at ON api_requests(ip_address, created_at DESC);
CREATE INDEX idx_api_requests_user_created_at ON api_requests(user_id, created_at DESC);
CREATE INDEX idx_api_requests_endpoint ON api_requests(endpoint);
```

## 🔒 Security Features

### 1. Row-Level Security (RLS)
```sql
-- Enable RLS on properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Users can view all properties but only edit their own
CREATE POLICY user_view_all_properties ON properties
  FOR SELECT USING (true);

CREATE POLICY user_edit_own_properties ON properties
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can view own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_view_own_data ON users
  FOR SELECT USING (id = auth.uid() OR is_admin());
```

### 2. Sensitive Data Encryption
```sql
-- Function to encrypt sensitive data
CREATE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS TEXT AS $$
  SELECT encode(pgp_sym_encrypt(data, key), 'hex')
$$ LANGUAGE SQL;

-- Function to decrypt
CREATE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(decode(encrypted_data, 'hex'), key)
$$ LANGUAGE SQL;

-- Example: storing encrypted PII
ALTER TABLE users ADD COLUMN national_id_encrypted VARCHAR(255);
-- When storing: UPDATE users SET national_id_encrypted = encrypt_sensitive_data(national_id, secret_key)
```

### 3. Automatic Audit Logging
```sql
-- Function to log all changes
CREATE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (action, resource_type, resource_id, old_values, new_values, created_at)
    VALUES ('update_' || TG_TABLE_NAME, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW), CURRENT_TIMESTAMP);
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (action, resource_type, resource_id, old_values, created_at)
    VALUES ('delete_' || TG_TABLE_NAME, TG_TABLE_NAME, OLD.id, row_to_json(OLD), CURRENT_TIMESTAMP);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to properties table
CREATE TRIGGER properties_audit_trigger
AFTER UPDATE OR DELETE ON properties
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
```

## 🚀 PostGIS Queries

### Find all properties within radius
```sql
-- Find all properties within 5km of a point
SELECT 
  p.*,
  ST_Distance(p.location, ST_Point(-74.0060, 40.7128)::geography) / 1000 as distance_km
FROM properties p
WHERE ST_DWithin(
  p.location,
  ST_Point(-74.0060, 40.7128)::geography,
  5000 -- 5km in meters
)
AND p.status = 'active'
ORDER BY distance_km ASC;
```

### Find nearby facilities for a property
```sql
-- Find hospitals within 2km of a property
SELECT 
  f.*,
  ST_Distance(f.location, p.location)::numeric / 1000 as distance_km
FROM facilities f
CROSS JOIN properties p
WHERE p.id = '...' -- property ID
AND f.category = 'hospital'
AND ST_DWithin(f.location, p.location::geography, 2000)
ORDER BY distance_km ASC;
```

### Aggregate area statistics
```sql
-- Crime statistics for an area (5km radius)
SELECT 
  ROUND(AVG(ad.crime_index)::numeric, 2) as avg_crime,
  ROUND(MAX(ad.crime_index)::numeric, 2) as max_crime,
  COUNT(*) as area_cells
FROM area_data ad
WHERE ST_DWithin(
  ad.location,
  ST_Point(-74.0060, 40.7128)::geography,
  5000
);
```

## 📊 Data Retention Policies

```sql
-- Archive old records (after 2 years)
CREATE FUNCTION archive_old_api_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM api_requests
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron extension
SELECT cron.schedule('archive-old-requests', '0 2 * * 0', 'SELECT archive_old_api_requests()');
```

## ✅ Initialization Scripts

See `database/schema.sql` for complete initialization.

## 🔧 PostGIS Installation

```bash
# On server
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
CREATE EXTENSION pgcrypto;
CREATE EXTENSION uuid-ossp;

-- Verify
SELECT PostGIS_version();
```
