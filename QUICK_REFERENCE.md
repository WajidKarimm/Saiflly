# Quick Reference - NestSafely

**Bookmark this page** for quick access to key information.

## 🎯 Project at a Glance

**What**: Property safety intelligence platform combining AI, geospatial data, and safety metrics
**Why**: Existing apps (Zameen, Airbnb) only show photos & price; we surface critical safety data
**How**: PostgreSQL + PostGIS + Claude AI + React + Node.js

## 📊 Scoring Formula

$$OVERALL = (A \times 0.30) + (H \times 0.25) + (F \times 0.25) + (C \times 0.20)$$

- **A**: Area (crime, flood, noise) - 30%
- **H**: History (disputes, complaints) - 25%
- **F**: Facilities (hospitals, schools) - 25%
- **C**: Cost (market value, trends) - 20%

Result: 0-100 → Grade: A (85+), B (70-84), C (55-69), D (40-54), F (<40)

## 🏗️ Tech Stack

| Purpose | Technology |
|---------|-----------|
| Frontend | Next.js 14, React, Tailwind, React Query |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| Auth | JWT + bcrypt |
| AI | Claude API |
| Deploy | Vercel (frontend), Railway (backend) |

## 📁 File Structure

```
nestsafely/
├── docs/
│   ├── ARCHITECTURE.md      ← System design
│   ├── DATABASE_SCHEMA.md   ← PostgreSQL DDL
│   ├── API_SPEC.md          ← All endpoints
│   ├── SCORING_ALGORITHM.md ← Math & formulas
│   ├── SECURITY_GUIDELINES.md
│   └── DEPLOYMENT.md
├── backend/          ← Express API
├── frontend/         ← Next.js app
├── database/         ← SQL schema
└── config/           ← Docker setup
```

## 🔐 Security Essentials

| Area | Implementation |
|------|-----------------|
| **Auth** | JWT (1hr) + Refresh token (30d) in HttpOnly cookie |
| **Password** | bcrypt 12 rounds (never stored) |
| **Input** | Zod validation on all endpoints |
| **SQL** | Parameterized queries (no injection) |
| **Rate Limit** | 100 req/min per IP |
| **HTTPS** | TLS 1.3 enforced |
| **Headers** | Helmet.js security headers |
| **CORS** | Locked to approved domains |

## 🚀 Quick Start

```bash
# 1. Start services
docker compose -f config/docker-compose.yml up -d

# 2. Backend
cd backend && npm install && npm run dev
# Runs on http://localhost:3000

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev
# Runs on http://localhost:3001

# 4. Access
# App: http://localhost:3001
# PgAdmin: http://localhost:5050
# Redis UI: http://localhost:8081
```

## 📊 Database Tables

| Table | Rows | Purpose |
|-------|------|---------|
| users | ✓ | Profiles & auth |
| properties | ✓ | Listings |
| safety_scores | 1 per property | Computed scores |
| property_history | ✓ | Events & disputes |
| area_data | ✓ | Neighborhood stats |
| facilities | ✓ | Hospitals, schools, etc |
| saved_properties | ✓ | User favorites |
| audit_log | ✓ | Security logging |

## 🔑 Environment Variables (Backend)

```
DB_HOST=localhost
DB_PASSWORD=postgres
REDIS_URL=redis://localhost:6379
JWT_SECRET=min_32_chars_long_secret
CLAUDE_API_KEY=sk_...
GOOGLE_PLACES_API_KEY=AIza_...
NODE_ENV=development
PORT=3000
```

## 📡 Key API Endpoints

```bash
# Auth
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

# Properties
GET    /properties/search?lat=31.5&lng=74.3
GET    /properties/:id
GET    /properties/:id/score
POST   /properties

# User
GET    /users/profile
PUT    /users/profile
PUT    /users/password
```

## 🧮 Scoring Calculation Example

```
Input:
- Crime index: 45 → inverted to 55
- Flood risk: 25 → inverted to 75  
- Noise: 72dB → inverted to 20
- Area score: (55×0.5 + 75×0.3 + 20×0.2) = 54

- History: 1 dispute → 100 - 15 = 85
- Facilities: 4 nearby → 75
- Cost: Market ratio 95 + Appreciation 90 - Penalties 20 = 72

Overall = (54×0.30) + (85×0.25) + (75×0.25) + (72×0.20) = 70.6 → Grade: B
```

## 🔄 Data Flow (Search to Verdict)

```
User searches location
  ↓
API validates input (Zod)
  ↓
Check Redis cache
  ↓
If miss: PostGIS geospatial query
  ↓
For each property: Calculate scores or get from DB
  ↓
Check Redis for AI verdict
  ↓
If miss: Call Claude API → Parse response
  ↓
Cache both (Redis 24hr, DB permanent)
  ↓
Return with safety badge
```

## 🚢 Deployment Checklist

- [ ] All tests pass
- [ ] No security warnings
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Build succeeds
- [ ] Health check working
- [ ] Monitoring configured
- [ ] Backups enabled

## 🧪 Testing Commands

```bash
# Backend
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run lint          # ESLint
npm run format        # Prettier

# Frontend
npm test
npm run build         # Production build
npm run lint:fix      # Fix lint errors
```

## 📈 Performance Targets

- API response: <200ms
- Search: <2 seconds
- Score calc: <500ms
- Frontend Lighthouse: 90+

## 🆘 Common Issues

**Port already in use**:
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

**Database connection error**:
```bash
psql -h localhost -U postgres -c "SELECT version();"
```

**Redis connection error**:
```bash
redis-cli ping
```

## 📚 Documentation Links

- **Overview**: README.md
- **How to Build**: EXECUTION_GUIDE.md
- **System Design**: docs/ARCHITECTURE.md
- **Database**: docs/DATABASE_SCHEMA.md
- **Scoring Math**: docs/SCORING_ALGORITHM.md
- **API Routes**: docs/API_SPEC.md
- **Security**: docs/SECURITY_GUIDELINES.md
- **Deploy**: docs/DEPLOYMENT.md

## 🎓 Key Concepts

### PostGIS Queries
```sql
-- Find properties within 5km
SELECT * FROM properties 
WHERE ST_DWithin(location, ST_Point(74.35, 31.52)::geography, 5000);

-- Distance calculation
SELECT distance_km FROM (
  SELECT ST_Distance(p.location, f.location)::numeric / 1000
  FROM properties p, facilities f
);
```

### JWT Flow
```
Register → Bcrypt password → Issue JWT (1hr) + Refresh (30d)
  ↓
Client stores: Access token (memory), Refresh token (HttpOnly cookie)
  ↓
Every request: Authorization: Bearer <access_token>
  ↓
On expiry: POST /refresh with cookie → New access token
  ↓
Logout: Clear tokens + revoke refresh in DB
```

### Scoring Flow
```
Property ID → Query area_data, property_history, facilities
  ↓
Calculate 4 sub-scores (0-100)
  ↓
Weighted average → Overall score
  ↓
Assign grade (A-F)
  ↓
Call Claude API with structured prompt
  ↓
Parse verdict: RENT/BUY/AVOID/NEGOTIATE
  ↓
Cache result (Redis + DB)
```

## 💡 Architecture Philosophy

1. **Stateless API**: Scale horizontally, no session affinity
2. **Cache Everything**: Redis for scores, search results, facility data
3. **Geospatial First**: All queries use PostGIS indexes
4. **Security First**: Validate inputs, encrypt secrets, log everything
5. **AI-Augmented**: Use Claude for human-readable verdicts
6. **Mobile Ready**: Responsive Next.js, JSON API

## 🎯 MVP Scope

**Week 1-2**: Database + Backend
**Week 3**: Frontend
**Week 4**: Integration & Testing
**Week 5**: Security & Performance
**Week 6**: Deployment & Go-live

## ✨ Quality Standards

- **Code Coverage**: 80%+ unit tests
- **Type Safety**: TypeScript strict mode
- **Lint**: ESLint + Prettier
- **Security**: OWASP Top 10 compliant
- **Performance**: Core Web Vitals green
- **Documentation**: Every function documented

---

**Print this page or bookmark for quick reference!**

---

For questions, see the comprehensive documentation in `/docs/` folder.

**Last Updated**: June 23, 2026  
**Status**: 🟢 Ready for Development
