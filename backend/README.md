# Backend README - NestSafely

Node.js/Express REST API backend with TypeScript, PostgreSQL + PostGIS, and Redis caching.

## 🏗️ Architecture

```
src/
├── api/
│   ├── routes/           # Express route handlers
│   ├── controllers/      # Business logic layer
│   ├── middleware/       # Auth, validation, error handling
│   └── validators/       # Zod schemas for request validation
├── services/
│   ├── scoring.ts        # Core scoring engine
│   ├── ai-verdict.ts     # Claude API integration
│   ├── database.ts       # Database queries
│   ├── cache.ts          # Redis operations
│   └── data-ingestion/   # External API integrations
├── utils/
│   ├── logger.ts         # Structured logging
│   ├── errors.ts         # Custom error classes
│   ├── validators.ts     # Validation helpers
│   └── constants.ts      # App constants
├── config/
│   ├── database.ts       # DB connection pool
│   ├── redis.ts          # Redis client
│   └── env.ts            # Environment validation
└── app.ts                # Express initialization
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ with PostGIS
- Redis 7+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run database migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

Server runs on `http://localhost:3000`

## 📦 Dependencies

### Core
- `express`: Web framework
- `typescript`: Type safety
- `dotenv`: Environment variables

### Database
- `pg`: PostgreSQL client
- `pg-boss`: Job queue
- `typeorm`: ORM (optional, for migrations)

### Caching
- `redis`: Redis client
- `ioredis`: Alternative Redis client

### Security
- `jsonwebtoken`: JWT tokens
- `bcrypt`: Password hashing
- `helmet`: Security headers
- `express-rate-limit`: Rate limiting
- `cors`: CORS handling

### Validation
- `zod`: Schema validation
- `xss`: XSS protection

### API Integration
- `axios`: HTTP client
- `node-fetch`: Alternative HTTP

### Logging
- `winston`: Structured logging
- `morgan`: HTTP request logging

### Utilities
- `uuid`: Generate UUIDs
- `date-fns`: Date manipulation

## 🛠️ Development

### Run in development mode
```bash
npm run dev
```

Watches for file changes and restarts server.

### Run tests
```bash
npm test                  # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Linting & Formatting
```bash
npm run lint             # ESLint
npm run lint:fix         # Fix lint errors
npm run format           # Prettier formatting
npm run format:check     # Check if formatted
```

### Build for production
```bash
npm run build            # Compile TypeScript
npm run build:prod       # Production build
```

## 🔑 Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=nestsafely

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=2592000

# API Keys
CLAUDE_API_KEY=sk-...
GOOGLE_PLACES_API_KEY=AIza...

# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Security
ALLOWED_ORIGINS=http://localhost:3001,https://nestsafely.com
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=debug
```

## 📚 API Documentation

Full API specification: [API_SPEC.md](../docs/API_SPEC.md)

**Key Endpoints**:
- `POST /v1/auth/register` - Register user
- `POST /v1/auth/login` - Login user
- `GET /v1/properties/search` - Search properties
- `GET /v1/properties/:id` - Get property details
- `GET /v1/properties/:id/score` - Get safety score
- `POST /v1/saved-properties` - Save property
- `GET /v1/users/profile` - Get user profile

## 🔒 Security Checklist

- [ ] All endpoints validated with Zod
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] JWT tokens with 1-hour expiry
- [ ] Refresh tokens in HttpOnly cookies
- [ ] Rate limiting enabled
- [ ] CORS locked to approved domains
- [ ] Security headers with Helmet
- [ ] Parameterized SQL queries
- [ ] Input sanitization (XSS prevention)
- [ ] HTTPS enforced in production
- [ ] Error messages don't leak info
- [ ] Sensitive data not logged
- [ ] API key rotation implemented

See [SECURITY_GUIDELINES.md](../docs/SECURITY_GUIDELINES.md) for details.

## 📊 Database

### Connect to database
```bash
psql -h localhost -U postgres -d nestsafely
```

### Run migrations
```bash
npm run db:migrate
```

### Reset database (⚠️ WARNING: Deletes all data)
```bash
npm run db:reset
```

## 💾 Redis Cache

### Connect to Redis
```bash
redis-cli
```

### View cached scores
```bash
redis-cli KEYS "score:*"
redis-cli GET "score:property-uuid"
```

### Clear all cache
```bash
redis-cli FLUSHALL  # WARNING: Clears all data!
```

## 📋 Scoring Engine

The core scoring logic is in `src/services/scoring.ts`:

```typescript
import { calculatePropertyScore } from './scoring';

const score = await calculatePropertyScore(propertyId);
// Returns: { areaScore, historyScore, facilityScore, costScore, overallScore, grade, verdict }
```

See [SCORING_ALGORITHM.md](../docs/SCORING_ALGORITHM.md) for mathematical details.

## 🤖 AI Verdict Engine

Claude API integration in `src/services/ai-verdict.ts`:

```typescript
import { generateVerdictFromScores } from './ai-verdict';

const verdict = await generateVerdictFromScores(scores, propertyData);
// Returns: { text: "recommendation...", verdict: "RENT|BUY|AVOID|NEGOTIATE" }
```

- Structured prompt engineering
- Response parsing and validation
- Caching with 24-hour TTL
- Cost optimization (batched requests)

## 🌐 External Data Integration

### Google Places API
Get facilities (hospitals, schools, grocery stores):
```typescript
import { getNearbyFacilities } from './services/data-ingestion/google-places';

const facilities = await getNearbyFacilities(lat, lng, radius);
```

### NADRA Property Records (Pakistan)
Get property ownership history:
```typescript
import { getNADRARecords } from './services/data-ingestion/nadra';

const records = await getNADRARecords(propertyAddress);
```

### NDMA Flood Data (Pakistan)
Get flood risk info:
```typescript
import { getFloodRisk } from './services/data-ingestion/ndma';

const floodRisk = await getFloodRisk(lat, lng);
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests (requires live DB/Redis)
```bash
npm run test:integration
```

### Test Coverage
```bash
npm run test:coverage
```

### Example Test
```typescript
import { calculateAreaScore } from '../src/services/scoring';

describe('Scoring Engine', () => {
  it('should calculate area score correctly', () => {
    const areaData = {
      crimeIndex: 45,
      floodRiskIndex: 25,
      noiseDb: 72
    };
    
    const score = calculateAreaScore(areaData);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

### Logs
```bash
# View live logs
npm run logs:live

# View error logs
npm run logs:errors
```

## 🚀 Deployment

### Build Docker image
```bash
docker build -t nestsafely-backend .
docker run -p 3000:3000 --env-file .env nestsafely-backend
```

### Deploy to Railway
```bash
railway link
railway up
```

### Deploy to Render
```bash
git push origin main  # Auto-deploys if connected
```

## 📝 Code Style

- **Linter**: ESLint
- **Formatter**: Prettier
- **Type Checker**: TypeScript

### Auto-format before commit
```bash
npm run format
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Database connection error
```bash
# Check PostgreSQL is running
psql -h localhost -U postgres -c "SELECT version();"
```

### Redis connection error
```bash
# Check Redis is running
redis-cli ping
```

### API not responding
```bash
# Check logs
npm run logs:errors

# Restart server
npm run dev
```

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: 2026-06-23  
**Maintainer**: NestSafely Team
