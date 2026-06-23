# NestSafely - Property Safety Intelligence Platform

A comprehensive property evaluation platform that combines AI, geospatial data, and safety analytics to provide intelligent property recommendations for buyers, renters, and investors.

##  Core Value Proposition

Every property listing gets an **overall safety intelligence score** built from 4 weighted sub-scores:
- **Property History Score** (25%): Ownership disputes, legal issues, flood events
- **Area Crime Index** (30%): Local crime data, neighborhood safety metrics
- **Facilities & Amenities** (25%): Proximity to hospitals, schools, utilities, grocery stores
- **Price vs. Market Value** (20%): Market ratio analysis, appreciation trends, hidden costs

The AI then generates a **plain-language verdict**: **RENT**, **BUY**, **AVOID**, or **NEGOTIATE**.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  Search → Listings Grid → Detail Page → Saved Properties    │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────────────────────┐
│              Backend API (Node.js + Express)                 │
│  Auth → Search → Scoring Engine → AI Verdict Engine         │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴───────────┐
        │                    │
┌───────▼────────┐  ┌────────▼──────────┐
│  PostgreSQL    │  │    Redis Cache    │
│  + PostGIS     │  │  (24hr TTL)       │
└────────────────┘  └───────────────────┘
        ▲
        │
┌───────┴─────────────────────────────────┐
│     Data Ingestion Layer                 │
│  Google Places API, NADRA, Municipality  │
│  Flood Data (NDMA), Crime Databases      │
└──────────────────────────────────────────┘
```

##  Project Structure

```
nestsafely/
├── docs/
│   ├── ARCHITECTURE.md          # System design & diagrams
│   ├── DATABASE_SCHEMA.md       # Complete PostgreSQL schema
│   ├── API_SPEC.md              # RESTful API specifications
│   ├── SECURITY_GUIDELINES.md   # Security checklist & best practices
│   ├── SCORING_ALGORITHM.md     # Detailed scoring logic
│   └── DEPLOYMENT.md            # Production deployment guide
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/          # Express route handlers
│   │   │   ├── controllers/     # Business logic
│   │   │   └── middleware/      # Auth, validation, error handling
│   │   ├── services/
│   │   │   ├── scoring.ts       # Scoring engine (pure function)
│   │   │   ├── ai-verdict.ts    # Claude API integration
│   │   │   ├── data-ingestion/  # External API integrations
│   │   │   └── database.ts      # Database queries
│   │   ├── utils/
│   │   │   ├── validators.ts    # Input validation with Zod
│   │   │   ├── errors.ts        # Custom error classes
│   │   │   └── logger.ts        # Structured logging
│   │   └── app.ts               # Express app initialization
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Auth pages
│   │   │   ├── properties/      # Property pages
│   │   │   └── dashboard/       # User dashboard
│   │   ├── components/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SafetyBadge.tsx
│   │   │   ├── ScoreMeters.tsx
│   │   │   └── MapView.tsx
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   └── hooks/
│   │   └── styles/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── database/
│   ├── schema.sql              # PostgreSQL schema with PostGIS
│   ├── migrations/             # Database version control
│   └── seeds/                  # Sample data for testing
├── config/
│   ├── docker-compose.yml      # PostgreSQL + Redis setup
│   └── environment-template/
└── .gitignore
```

##  5-Phase Implementation Plan

### Phase 1: Database Design ✅
- PostgreSQL schema with PostGIS for geospatial queries
- Security: Row-level security (RLS), encrypted sensitive fields
- See: [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

### Phase 2: Backend API ✅
- JWT authentication with refresh tokens
- Rate limiting (100 req/min per IP)
- Input validation on all endpoints
- Error handling with structured responses
- See: [API_SPEC.md](docs/API_SPEC.md)

### Phase 3: Scoring Engine ✅
- Pure function, highly testable
- Mathematical algorithm with weighted sub-scores
- Caching strategy with Redis
- See: [SCORING_ALGORITHM.md](docs/SCORING_ALGORITHM.md)

### Phase 4: AI Integration ✅
- Claude API for plain-language verdicts
- Structured prompt engineering
- Response parsing and caching
- Cost optimization (batched requests)
- See: [API_SPEC.md](docs/API_SPEC.md#ai-verdict-endpoint)

### Phase 5: Frontend ✅
- Next.js 14 with TypeScript
- React Query for data fetching
- Mapbox GL for safety score visualization
- Responsive design (mobile-first)
- See: [Frontend README](frontend/README.md)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional, for PostgreSQL + Redis)

### Setup

```bash
# Clone and navigate
cd nestsafely

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# Frontend setup (in new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔒 Security First

-  JWT tokens with 1-hour expiry + refresh tokens
-  Bcrypt password hashing (12 rounds)
-  Parameterized SQL queries (no injection)
-  Rate limiting on all endpoints
-  CORS locked to approved domains
-  HTTPS enforced in production
-  Sensitive fields encrypted in database
-  Request validation with Zod
-  CSRF protection for state-changing endpoints
-  Security headers (Helmet.js)

See [SECURITY_GUIDELINES.md](docs/SECURITY_GUIDELINES.md) for complete checklist.

## --- Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js, React, Tailwind | 14.x |
| Backend | Node.js, Express, TypeScript | 20.x, 4.x, 5.x |
| Database | PostgreSQL, PostGIS | 14+, 3.x |
| Cache | Redis | 7.x |
| Auth | JWT, bcrypt | - |
| AI | Claude API (Sonnet) | Latest |
| External Data | Google Places API, NADRA, NDMA | - |
| Deployment | Vercel (frontend), Railway/Render (backend) | - |

## 📚 Documentation

1. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture & data flow
2. **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - PostgreSQL schema design
3. **[API_SPEC.md](docs/API_SPEC.md)** - RESTful API specification
4. **[SECURITY_GUIDELINES.md](docs/SECURITY_GUIDELINES.md)** - Security best practices
5. **[SCORING_ALGORITHM.md](docs/SCORING_ALGORITHM.md)** - Scoring logic & formulas
6. **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guide

## 📝 License

MIT

## 🤝 Contributing

See CONTRIBUTING.md for guidelines.
