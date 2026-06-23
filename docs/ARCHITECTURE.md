# System Architecture - NestSafely

Complete architecture design including system components, data flow, and integration points.

## 🏗️ High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│                      (Next.js Frontend)                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐        │
│  │ Search Page     │  │ Listing Grid │  │ Property Detail  │        │
│  │ with Map        │  │ w/ Safety    │  │ with Full Score  │        │
│  │                 │  │ Badges       │  │ Breakdown        │        │
│  └────────┬────────┘  └──────┬───────┘  └────────┬─────────┘        │
│           │                  │                    │                  │
└───────────┼──────────────────┼────────────────────┼──────────────────┘
            │                  │                    │
            │        HTTP/REST/JSON API             │
            │ (with JWT Bearer Token)               │
            │                                       │
┌───────────▼───────────────────────────────────────▼──────────────────┐
│                    API GATEWAY LAYER                                 │
│                  (Express.js + Middleware)                           │
│  ┌───────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ CORS Handler      │  │ Rate Limiter    │  │ Security Headers│   │
│  │ (domain locked)   │  │ (100 req/min)   │  │ (Helmet.js)     │   │
│  └───────────────────┘  └─────────────────┘  └─────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────────┐ ┌────────▼────────┐ ┌────▼─────────────────┐
│  AUTH ROUTES     │ │ PROPERTY ROUTES │ │ ADMIN ROUTES        │
│ /auth/register   │ │ /properties     │ │ /admin/data-sync    │
│ /auth/login      │ │ /properties/:id │ │ /admin/users        │
│ /auth/refresh    │ │ /search         │ │ /admin/analytics    │
└───────┬──────────┘ └────────┬────────┘ └────┬─────────────────┘
        │                     │                │
        └─────────────────────┼────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                               │
│                    (Controllers & Services)                          │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │ Scoring Engine                                           │       │
│  │ ├─ Property History Analysis                            │       │
│  │ ├─ Area Safety Computation                              │       │
│  │ ├─ Facilities Proximity Calculation                     │       │
│  │ └─ Cost Analysis & Trend Scoring                        │       │
│  └──────────────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │ AI Verdict Engine (Claude Integration)                  │       │
│  │ ├─ Structured Prompt Engineering                        │       │
│  │ ├─ Response Parsing & Validation                        │       │
│  │ └─ Caching & Cost Optimization                          │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────────┐  ┌────────▼────────┐  ┌────────▼─────────┐
│  CACHE LAYER     │  │ DATABASE LAYER  │  │ EXTERNAL APIs    │
│   (Redis)        │  │  (PostgreSQL    │  │                  │
│                  │  │   + PostGIS)    │  │ ├─ Google Places │
│ 24hr TTL:        │  │                 │  │ ├─ NADRA Records │
│ ├─ Scores        │  │ ┌─────────────┐ │  │ ├─ NDMA Floods   │
│ ├─ Verdicts      │  │ │ properties  │ │  │ └─ Crime Data    │
│ ├─ Facility Data │  │ │ safety_     │ │  │                  │
│ └─ Sessions      │  │ │ scores      │ │  └──────────────────┘
│                  │  │ │ area_data   │ │
│                  │  │ │ facilities  │ │
│                  │  │ │ users       │ │
│                  │  │ │ property_   │ │
│                  │  │ │ history     │ │
│                  │  │ │ (GIS index) │ │
│                  │  │ └─────────────┘ │
└──────────────────┘  └─────────────────┘
```

## 📊 Data Flow - From Search to Verdict

```
USER SEARCH REQUEST
        │
        │ lat, lng, type, budget
        ▼
┌─────────────────────────────────┐
│ Validate Input (Zod)            │
│ - Bounds checking               │
│ - Type validation               │
└────────────┬────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Rate Limit Check                 │
│ - IP-based throttling            │
│ - Per-user quota                 │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ JWT Token Verification           │
│ - Signature check                │
│ - Expiry validation              │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Redis Cache Lookup               │
│ Key: "search:{lat}:{lng}:{type}" │
└────────────┬─────────────────────┘
             │
        ┌────┴────┐
        │          │
    HIT │          │ MISS
        │          │
        ▼          ▼
   RETURN    ┌──────────────────────────────┐
   CACHED    │ PostGIS Query (PostgreSQL)   │
             │ ST_DWithin(location, x, y)   │
             │ + type filter + budget filter │
             └───────────┬──────────────────┘
                         │
                         ▼
              ┌────────────────────────────┐
              │ For Each Property Result:  │
              │ ├─ Check score cache       │
              │ └─ Compute if needed       │
              └───────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │ SCORING ENGINE             │
              │ ├─ Property History Score  │
              │ ├─ Area Crime Score        │
              │ ├─ Facilities Score        │
              │ ├─ Cost Score              │
              │ └─ Overall = Weighted Avg  │
              └───────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │ Cache Score (Redis 24hr)   │
              │ Save to DB                 │
              └───────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │ Build Response Object      │
              │ ├─ Property details        │
              │ ├─ Safety scores           │
              │ └─ Verdict label           │
              └───────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │ Cache Search Results       │
              │ (Redis 1 hour)             │
              └───────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │ Return Paginated Results   │
              │ + Metadata (count, pages)  │
              └───────────────────────────┘

---

DETAIL PAGE REQUEST (User clicks property)
        │
        │ property_id
        ▼
┌──────────────────────────────────┐
│ Check Redis for Full Score Data  │
└────────────┬─────────────────────┘
             │
        ┌────┴────┐
        │          │
    HIT │          │ MISS
        │          │
        ▼          ▼
   RETURN    ┌──────────────────────────────┐
   CACHED    │ Query Database for:          │
             │ ├─ Property details          │
             │ ├─ Owner info                │
             │ ├─ Price history             │
             │ ├─ Property history events   │
             │ ├─ Area statistics           │
             │ └─ Nearby facilities         │
             └───────────┬──────────────────┘
                         │
                         ▼
              ┌────────────────────────────┐
              │ Run Scoring Engine         │
              │ (if scores missing)        │
              └───────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │ Check Redis for AI Verdict │
              │ Key: "verdict:{property_id}"│
              └────────────┬───────────────┘
                          │
                      ┌───┴────┐
                      │         │
                  HIT │         │ MISS
                      │         │
                      ▼         ▼
                  RETURN   ┌─────────────────────┐
                  CACHED   │ Call Claude API     │
                           │ ├─ Structured Prompt│
                           │ ├─ Score + Data     │
                           │ └─ Receive Verdict  │
                           └────────┬────────────┘
                                    │
                                    ▼
                           ┌─────────────────────┐
                           │ Parse Response      │
                           │ ├─ Extract text     │
                           │ ├─ Extract verdict  │
                           │ │  (RENT/BUY/etc)   │
                           │ └─ Validate         │
                           └────────┬────────────┘
                                    │
                                    ▼
                           ┌─────────────────────┐
                           │ Cache Verdict       │
                           │ (Redis 24hr)        │
                           │ Save to DB          │
                           └────────┬────────────┘
                                    │
                                    ▼
              ┌────────────────────────────┐
              │ Build Detail Response      │
              │ ├─ Full property data      │
              │ ├─ All sub-scores          │
              │ ├─ Breakdown details       │
              │ ├─ AI verdict + reasoning  │
              │ └─ Historical data         │
              └───────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │ Cache Full Response        │
              │ (Redis 24hr)               │
              └───────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────────┐
              │ Return Complete Detail     │
              │ Page Data                  │
              └────────────────────────────┘
```

## 🔄 Component Interactions

### 1. Authentication Flow
```
User Input Credentials
        │
        ▼
POST /auth/register or /auth/login
        │
        ▼
Validate Input (Zod)
        │
        ▼
Query Database for User
        │
    ┌───┴─────┬──────────┐
    │          │          │
 EXISTS    NOT EXIST  REGISTER
    │          │          │
    ▼          ▼          ▼
Compare    Create User  Hash Password
Password   Hash Pwd    Insert to DB
    │          │          │
    └───┬──────┴──────────┘
        │
        ▼
Generate JWT + Refresh Token
(1 hour + 30 days)
        │
        ▼
Store Refresh Token in DB
        │
        ▼
Return Tokens to Client
        │
        ▼
Client Stores in Secure Cookie
+ Memory (for Bearer token)
```

### 2. Scoring Engine Architecture
```
Input: property_id

Step 1: Fetch Data from DB
├─ Property details (price, type, size)
├─ Owner history (disputes, complaints)
├─ Area statistics (crime, flood zone)
└─ Nearby facilities (hospitals, schools)

Step 2: Normalize Inputs to 0-100 scale
├─ Crime index normalization
├─ Flood risk normalization
├─ Facility distance normalization
└─ Price ratio normalization

Step 3: Calculate Sub-Scores
├─ AREA_SCORE = (crime * 0.5 + flood * 0.3 + noise * 0.2) → 0-100
├─ HISTORY_SCORE = (disputes_penalty + complaints_penalty + turnover) → 0-100
├─ FACILITY_SCORE = (proximity_sum + utility_score) → 0-100
└─ COST_SCORE = (market_ratio + appreciation_trend - hidden_costs) → 0-100

Step 4: Calculate Weighted Overall Score
OVERALL = (AREA * 0.30) + (HISTORY * 0.25) + (FACILITY * 0.25) + (COST * 0.20)
Result: 0-100

Step 5: Assign Grade
├─ A (85+)   → Green  → "Excellent"
├─ B (70-84) → Yellow → "Good"
├─ C (55-69) → Orange → "Fair"
├─ D (40-54) → Red    → "Poor"
└─ F (<40)  → Dark Red → "Risky"

Step 6: Cache & Store
├─ Redis (24 hour TTL)
└─ PostgreSQL (historical record)

Output: { area_score, history_score, facility_score, cost_score, overall_score, grade, verdict_label }
```

### 3. AI Verdict Generation
```
Input: Scores + Property Data

Construct Structured Prompt:
  You are a property safety analyst. Based on these metrics:
  - Safety Score: {overall_score}
  - Area Safety: {area_score} ({crime_index}, {flood_zone})
  - Property History: {history_score} ({disputes_count}, {complaints})
  - Nearby Facilities: {facility_score} (hospitals: {km}, schools: {km})
  - Price Value: {cost_score} (market ratio: {ratio}%, appreciation: {trend}%)
  
  Write a 2-3 sentence recommendation in plain language.
  End with exactly one of: RENT, BUY, AVOID, NEGOTIATE
  
  Data: {json_scores}

Send to Claude API (Sonnet 4.6)
        │
        ▼
Parse Response
├─ Extract recommendation text
├─ Extract verdict (regex: /\b(RENT|BUY|AVOID|NEGOTIATE)\b/)
└─ Validate both present

Cache Result:
├─ Redis (24 hour TTL)
└─ PostgreSQL

Output: { recommendation_text, verdict }
```

## 🔐 Security Architecture

### Authentication & Authorization
```
┌──────────────────────────────────────────────┐
│         JWT Token Structure                  │
├──────────────────────────────────────────────┤
│ Header:   { alg: "HS256", typ: "JWT" }      │
│ Payload:  {                                  │
│             sub: user_id,                    │
│             email: user_email,               │
│             role: "user|agent|admin",        │
│             iat: timestamp,                  │
│             exp: timestamp + 3600 (1 hour)   │
│           }                                  │
│ Signature: HMAC-SHA256(secret)               │
└──────────────────────────────────────────────┘

When client makes request:
Authorization: Bearer <token>
        │
        ▼
Extract token from header
        │
        ▼
Verify signature with secret key
        │
        ▼
Check expiry timestamp
        │
    ┌───┴───┐
    │       │
 VALID  EXPIRED
    │       │
    │       ▼
    │   Reject (401)
    │   Return 401 with
    │   error message
    │
    ▼
Extract user info from payload
        │
        ▼
Attach to request object (req.user)
        │
        ▼
Continue to route handler
```

### Input Validation & SQL Injection Prevention
```
User sends request with params
        │
        ▼
Zod validation schema
├─ Type checking
├─ Length limits
├─ Format validation (email regex, etc)
└─ Custom rules
        │
    ┌───┴──┐
    │      │
 PASS FAIL
    │      │
    │      ▼
    │   400 Bad Request
    │   Return validation errors
    │
    ▼
Use Parameterized Queries
❌ BAD:  const query = `SELECT * FROM users WHERE email = '${email}'`
✅ GOOD: const query = `SELECT * FROM users WHERE email = $1`
         db.query(query, [email])

Node.js pg library handles:
├─ Parameter escaping
├─ Type conversion
└─ Injection prevention
```

### Data Encryption
```
Sensitive Fields in Database:
├─ Passwords         → Bcrypt hash (12 rounds)
├─ Auth tokens       → Not stored (stateless)
├─ Refresh tokens    → Hashed in DB
├─ Personal data     → AES-256-GCM encryption
└─ SSNs/IDs          → Tokenized via third-party

At Rest:
├─ PostgreSQL encryption enabled (pgcrypto)
└─ Redis (in-memory, not persistent)

In Transit:
├─ HTTPS/TLS 1.3 enforced
└─ API responses gzipped
```

## 📈 Scaling Considerations

### Caching Strategy
- **Scores**: 24-hour TTL (recalculate daily)
- **Search Results**: 1-hour TTL (highly volatile)
- **Facilities Data**: 7-day TTL (changes monthly)
- **User Sessions**: 24-hour TTL
- **Cache Invalidation**: Manual invalidation on property update

### Database Indexing
```sql
-- Geospatial index for fast location queries
CREATE INDEX idx_properties_location ON properties 
  USING GIST (location);

-- Property lookups
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(type);

-- Score lookups
CREATE INDEX idx_safety_scores_property_id 
  ON safety_scores(property_id);
  
-- Facility proximity (PostGIS operator class)
CREATE INDEX idx_facilities_location ON facilities 
  USING GIST (location);
```

### Horizontal Scaling
- **Frontend**: Vercel (CDN, serverless)
- **Backend**: Docker containers on Railway/Render (auto-scaling)
- **Database**: PostgreSQL with read replicas + connection pooling
- **Cache**: Redis cluster for distributed caching
- **API Rate Limiting**: Distributed via Redis

## 🚀 Deployment Pipeline

```
Local Development
        │
        ▼
Push to Git (GitHub)
        │
        ├─→ GitHub Actions Workflow
        │   ├─ Run ESLint
        │   ├─ Run TypeScript compiler
        │   ├─ Run Tests
        │   ├─ Build Docker image
        │   └─ Push to registry
        │
        ▼
Code Review & Approval
        │
        ▼
Merge to main branch
        │
        ├─→ Frontend: Vercel Auto-Deploy
        │   ├─ Build Next.js
        │   ├─ Run E2E tests
        │   └─ Deploy to production
        │
        ├─→ Backend: Railway/Render Deploy
        │   ├─ Pull Docker image
        │   ├─ Run migrations
        │   ├─ Health check
        │   └─ Blue-green deployment
        │
        └─→ Database: Automated backups
            ├─ Point-in-time recovery
            └─ Replication sync
```

## 📊 Monitoring & Observability

```
Application Metrics:
├─ API response time (p50, p95, p99)
├─ Error rate (4xx, 5xx)
├─ Cache hit rate
├─ Database query performance
└─ Scoring engine execution time

Infrastructure Metrics:
├─ CPU utilization
├─ Memory usage
├─ Database connections
├─ Redis memory
└─ Network I/O

Tools:
├─ Sentry (error tracking)
├─ Datadog (APM)
├─ CloudWatch (logs)
└─ Custom dashboards (Grafana)

Alerts:
├─ High error rate (>5%)
├─ High latency (p99 > 2s)
├─ Database connection exhaustion
└─ Cache failures
```
