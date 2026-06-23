# Complete Project Execution Guide - NestSafely

Step-by-step guide to build, understand, and deploy the entire NestSafely application from scratch.

## 📚 Table of Contents

1. [Understanding the Design](#understanding-the-design)
2. [Project Setup](#project-setup)
3. [Development Workflow](#development-workflow)
4. [Building Each Component](#building-each-component)
5. [Testing & Validation](#testing--validation)
6. [Deployment](#deployment)
7. [Maintenance](#maintenance)

---

## 📖 Understanding the Design

### Core Concept
NestSafely provides a **safety intelligence score** for every property combining:
- **Area Safety** (30%): Crime, floods, noise
- **Property History** (25%): Disputes, legal issues
- **Facilities** (25%): Nearby amenities
- **Cost Value** (20%): Market analysis

### Key Data Flow
```
User searches location → API queries PostGIS database → 
Compute scores (or retrieve from Redis) → 
Call Claude for plain-language verdict → 
Return results with safety badge
```

### Tech Stack Decision
- **Frontend**: Next.js (fast, SEO-friendly, serverless ready)
- **Backend**: Express.js (lightweight, flexible)
- **Database**: PostgreSQL + PostGIS (geospatial queries)
- **Cache**: Redis (scoring engine, session management)
- **AI**: Claude API (structured prompt engineering)
- **Deploy**: Vercel (frontend), Railway (backend)

---

## 🛠️ Project Setup

### Prerequisites Installation

**macOS**:
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install node postgresql redis git
brew services start postgresql
brew services start redis
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib redis-server git

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server
```

**Windows**:
```powershell
# Using Chocolatey
choco install nodejs postgres redis git

# Or use Docker Desktop (recommended)
docker run -d -p 5432:5432 postgis/postgis:15-3.3
docker run -d -p 6379:6379 redis:7-alpine
```

### Clone & Setup Project

```bash
# Clone repository
git clone https://github.com/your-org/nestsafely.git
cd nestsafely

# Create branch
git checkout -b development

# Initialize git hooks (optional)
npm run prepare
```

### Install Dependencies

```bash
# Backend
cd backend
npm install
cp .env.example .env

# Frontend  
cd ../frontend
npm install
cp .env.example .env.local
```

### Configure Environment Variables

**Backend** (`backend/.env`):
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nestsafely

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev_secret_min_32_chars_long_key_here
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=2592000

# External APIs
CLAUDE_API_KEY=sk_your_claude_key
GOOGLE_PLACES_API_KEY=your_google_key

# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Security
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_MAPBOX_TOKEN=pk_your_mapbox_token
```

### Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql:
CREATE DATABASE nestsafely;
CREATE EXTENSION postgis;
\q

# Run schema
psql -U postgres -d nestsafely < database/schema.sql

# Verify
psql -U postgres -d nestsafely -c "SELECT postgis_version();"
```

Or using Docker:
```bash
# Start services
docker compose -f config/docker-compose.yml up -d

# Wait 30 seconds for services to start
sleep 30

# Run migrations
docker exec -it nestsafely-postgres psql -U postgres -d nestsafely -f /docker-entrypoint-initdb.d/01-schema.sql
```

---

## 🚀 Development Workflow

### Start Development Servers

**Terminal 1: Backend**
```bash
cd backend
npm run dev
# Listens on http://localhost:3000
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
# Listens on http://localhost:3001
```

**Terminal 3: Monitor logs**
```bash
docker logs -f nestsafely-postgres
redis-cli MONITOR
```

### Development Process

1. **Create feature branch**: `git checkout -b feature/property-search`
2. **Code & test locally**: Use Postman/curl for API testing
3. **Run tests**: `npm test`
4. **Format & lint**: `npm run format && npm run lint:fix`
5. **Commit**: `git commit -m "feat: add property search"`
6. **Push**: `git push origin feature/property-search`
7. **Create PR**: GitHub pull request
8. **Review & merge**: To development branch

### Testing API Endpoints

**Using curl**:
```bash
# Register user
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123!","first_name":"John"}'

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test123!"}'

# Search properties
curl -X GET "http://localhost:3000/v1/properties/search?lat=31.5204&lng=74.3587" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Using Postman**:
1. Import collection: `postman/NestSafely.postman_collection.json`
2. Set environment variables
3. Run requests

### Hot Reload

- **Frontend**: Next.js auto-reloads on file save
- **Backend**: Nodemon auto-restarts on TypeScript changes
- **Database**: Manual schema updates (use migrations)

---

## 🏗️ Building Each Component

### Phase 1: Database (Week 1)

**Deliverables**:
- ✅ PostgreSQL instance running
- ✅ PostGIS extension enabled
- ✅ All tables created with proper indexes
- ✅ Sample data loaded

**Tasks**:
```bash
# 1. Verify PostGIS installation
psql -U postgres -d nestsafely -c "SELECT postgis_version();"

# 2. List all tables
psql -U postgres -d nestsafely -c "\dt"

# 3. Verify indexes
psql -U postgres -d nestsafely -c "\di"

# 4. Test geospatial query
psql -U postgres -d nestsafely -c "
  SELECT ST_Distance(
    ST_Point(74.3587, 31.5204)::geography,
    ST_Point(74.3500, 31.5100)::geography
  ) / 1000 as distance_km;
"
```

### Phase 2: Backend API (Week 2-3)

**Deliverables**:
- ✅ Authentication (register, login, refresh)
- ✅ Property search with geospatial queries
- ✅ Safety scoring engine
- ✅ Claude AI integration
- ✅ Error handling & validation
- ✅ Rate limiting & security

**Key Endpoints to Test**:
```typescript
// src/api/routes/auth.ts
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout

// src/api/routes/properties.ts
GET /properties/search
GET /properties/:id
GET /properties/:id/score
POST /properties/:id/score/recalculate

// src/api/routes/users.ts
GET /users/profile
PUT /users/profile
PUT /users/password
```

**Implementation Order**:
1. Express app setup with middleware
2. JWT authentication
3. Database connection & pooling
4. Input validation schemas (Zod)
5. Property search endpoint
6. Scoring engine (pure function)
7. AI verdict integration
8. Error handling
9. Rate limiting
10. Tests

### Phase 3: Frontend (Week 3-4)

**Deliverables**:
- ✅ Login/Register pages
- ✅ Search properties page with map
- ✅ Property detail page with scores
- ✅ User dashboard
- ✅ Responsive design

**Key Pages**:
```
src/app/
├── auth/login/page.tsx              # Form + validation
├── auth/register/page.tsx           # Form + profile
├── properties/page.tsx              # Search + grid + map
├── properties/[id]/page.tsx         # Detail + breakdown
└── dashboard/saved/page.tsx         # Saved properties
```

**Component Development**:
```bash
# Create components
src/components/SearchBar.tsx         # Location input + filters
src/components/SafetyBadge.tsx      # Score display (A-F grade)
src/components/ScoreMeters.tsx      # Sub-score visualization
src/components/MapView.tsx          # Mapbox integration
src/components/PropertyCard.tsx     # Listing card component
```

### Phase 4: Integration & Testing (Week 4)

**End-to-end flows**:
1. User registration → Verification email (mock)
2. User login → Token received
3. Search properties → Results with scores
4. View detail → Full breakdown + AI verdict
5. Save property → Saved to dashboard
6. Logout → Session cleared

---

## ✅ Testing & Validation

### Unit Tests

**Backend**:
```bash
# Scoring engine tests
npm run test -- scoring.test.ts

# Test score calculation
describe('Scoring Engine', () => {
  test('calculates area score correctly', () => {
    const score = calculateAreaScore({
      crimeIndex: 45,
      floodRiskIndex: 25,
      noiseDb: 72
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

**Frontend**:
```bash
# Component tests
npm run test -- SafetyBadge.test.tsx

# Test badge rendering
describe('SafetyBadge', () => {
  test('displays correct grade', () => {
    render(<SafetyBadge score={85} grade="A" verdict="BUY" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
```

### Integration Tests

```bash
# Backend API integration
npm run test:integration

# Test complete flow
describe('Property Search API', () => {
  test('returns properties with scores', async () => {
    const response = await request(app)
      .get('/v1/properties/search?lat=31.5&lng=74.3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body.data.properties).toHaveLength(20);
    expect(response.body.data.properties[0]).toHaveProperty('safety_score');
  });
});
```

### Manual Testing

**Security Checklist**:
- [ ] SQL injection attempt blocked
- [ ] XSS attempt sanitized
- [ ] CSRF token validated
- [ ] Rate limiting works
- [ ] Auth token expires
- [ ] Refresh token works

**Performance Checklist**:
- [ ] API response < 200ms
- [ ] Search returns < 2 seconds
- [ ] Score calculation < 500ms
- [ ] Frontend Lighthouse > 90
- [ ] No memory leaks (DevTools)

**Functionality Checklist**:
- [ ] Search by location works
- [ ] Filters work correctly
- [ ] Scores update properly
- [ ] AI verdict generates
- [ ] Maps display correctly
- [ ] Saved properties persist
- [ ] User profile updates
- [ ] Logout clears session

---

## 🚀 Deployment

### Staging Deployment

```bash
# Deploy to staging
git checkout -b staging
git push origin staging

# Automatic deployment via CI/CD
# Runs tests → builds → deploys

# Verify staging
curl https://staging-api.nestsafely.com/health
```

### Production Deployment

**Step 1: Merge to main**
```bash
git checkout main
git pull origin development
git merge --no-ff feature/property-search
git push origin main
```

**Step 2: CI/CD pipeline runs**
- ✅ Tests pass
- ✅ Linting passes
- ✅ Build succeeds
- ✅ Security scan passes

**Step 3: Manual review**
- Review deployment checklist
- Monitor logs for errors
- Test critical paths

**Step 4: Production live**
```bash
# Frontend auto-deployed on Vercel
# Backend auto-deployed on Railway

# Verify
curl https://nestsafely.com
curl https://api.nestsafely.com/health
```

### Rollback Procedure

```bash
# If something goes wrong
git revert HEAD~1
git push origin main

# Or re-deploy previous stable version
railway redeploy <previous-deployment-id>
vercel rollback
```

---

## 🔧 Maintenance

### Regular Tasks

**Daily**:
- Monitor error logs
- Check API response times
- Review user feedback

**Weekly**:
- Review security logs
- Update dependencies
- Backup database
- Performance analysis

**Monthly**:
- Security audit
- Performance optimization
- Cost analysis
- Feature planning

### Updates & Patches

```bash
# Check for dependency updates
npm outdated

# Update patch versions
npm update

# Update to latest versions (test first!)
npm install package@latest

# Run tests after updates
npm test
```

### Monitoring

**Health Check**:
```bash
# API health
curl https://api.nestsafely.com/health

# Database health
psql -c "SELECT NOW();"

# Redis health
redis-cli PING

# Frontend health
curl https://nestsafely.com/api/health
```

### Incident Response

**API Down**:
```bash
# 1. Check logs
railway logs -f

# 2. Restart service
railway redeploy

# 3. If still down, rollback
git revert HEAD
git push origin main
```

**Database Issues**:
```bash
# 1. Check connections
SELECT count(*) FROM pg_stat_activity;

# 2. Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE idle_in_transaction_session_timeout IS NULL;

# 3. Restore from backup
pg_restore backup.sql
```

---

## 📞 Support & Resources

### Documentation
- [Architecture Guide](docs/ARCHITECTURE.md)
- [API Specification](docs/API_SPEC.md)
- [Scoring Algorithm](docs/SCORING_ALGORITHM.md)
- [Security Guidelines](docs/SECURITY_GUIDELINES.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)

### External Resources
- [Express.js Docs](https://expressjs.com/)
- [Next.js Docs](https://nextjs.org/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [PostGIS Docs](https://postgis.net/docs/)
- [Redis Docs](https://redis.io/docs/)

### Getting Help
- GitHub Issues: Report bugs
- GitHub Discussions: Ask questions
- Slack: Team communication
- Email: support@nestsafely.com

---

## ✨ Completion Checklist

- [ ] All documentation complete
- [ ] Backend fully functional
- [ ] Frontend fully functional
- [ ] Database set up with proper indexing
- [ ] Scoring engine working
- [ ] AI integration complete
- [ ] Tests passing (unit + integration)
- [ ] Security hardened
- [ ] Performance optimized
- [ ] Monitoring configured
- [ ] Deployment automated
- [ ] Team trained
- [ ] Go-live checklist completed
- [ ] Incident response plan ready
- [ ] Support documentation ready

---

**Last Updated**: 2026-06-23  
**Project Lead**: NestSafely Team  
**Status**: 🟢 Ready for Development
