# Deployment Guide - NestSafely

Complete guide for deploying NestSafely to production environments.

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Vercel (Frontend)                 │
│  - Next.js auto-deployment                          │
│  - CDN & edge caching                               │
│  - HTTPS + DDoS protection                          │
│  - Serverless functions for API routes              │
└────────────────┬────────────────────────────────────┘
                 │ HTTPS/REST API
┌────────────────▼────────────────────────────────────┐
│         Railway/Render (Backend API)                │
│  - Node.js Express containers                       │
│  - Auto-scaling (CPU/memory based)                  │
│  - Environment variable management                  │
│  - PostgreSQL managed database                      │
│  - Redis cache layer                                │
└─────────────────────────────────────────────────────┘
```

## 📋 Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] API rate limiting configured
- [ ] Security headers enabled
- [ ] HTTPS/SSL certificates ready
- [ ] Backups configured
- [ ] Monitoring & alerting setup
- [ ] Incident response plan documented

## 🚀 Frontend Deployment (Vercel)

### Step 1: Create Vercel Account & Link Repository

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
cd frontend
vercel link
```

### Step 2: Configure Environment Variables

In Vercel Dashboard:
1. Project Settings → Environment Variables
2. Add all variables from `.env.example`:

```
NEXT_PUBLIC_API_URL=https://api.nestsafely.com/v1
NEXT_PUBLIC_FRONTEND_URL=https://nestsafely.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk_...
```

### Step 3: Configure Build & Runtime

In Vercel Dashboard → Project Settings → Build & Development Settings:
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: 20.x

### Step 4: Deploy

```bash
# Manual deployment
vercel deploy --prod

# Or automatic: push to main branch
git push origin main
```

Vercel automatically:
- Builds Next.js optimized bundle
- Runs edge middleware
- Optimizes images
- Deploys to CDN (150+ locations)

**Production URL**: https://nestsafely.vercel.app (or custom domain)

### Domain Configuration

1. Add domain in Vercel Dashboard
2. Update DNS records:
   - ALIAS/CNAME: `cname.vercel.com`
   - Or use Vercel nameservers

### SSL/TLS Certificates

Vercel automatically provisions SSL certificates via Let's Encrypt. No action needed.

---

## 🚀 Backend Deployment (Railway)

### Option A: Deploy via Railway Dashboard

1. **Create Railway Account**: https://railway.app/
2. **Connect GitHub**: Dashboard → New Project → Deploy from GitHub
3. **Select Repository**: `nestsafely/backend`
4. **Configure Variables**: Environment variable setup
5. **Deploy**: Railway auto-deploys on push

### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
cd backend
railway link

# Deploy to production
railway up
```

### Environment Variables in Railway

Add to Railway Dashboard → Variables:

```
DB_HOST=${DATABASE_URL_HOSTNAME}
DB_PORT=${DATABASE_URL_PORT}
DB_USER=${DATABASE_URL_USER}
DB_PASSWORD=${DATABASE_URL_PASSWORD}
DB_NAME=${DATABASE_URL_DATABASE}
JWT_SECRET=your_production_secret_min_32_chars
CLAUDE_API_KEY=sk_...
REDIS_URL=redis://...
NODE_ENV=production
PORT=3000
```

### Database Setup (Railway)

1. Go to Railway Dashboard
2. Create New Service → PostgreSQL
3. Link to backend service
4. Run migrations:
   ```bash
   railway run npm run db:migrate
   ```

### Redis Setup (Railway)

1. Create New Service → Redis
2. Link to backend service
3. Note Redis URL: `${REDIS_URL}`

### Deploy

```bash
# Push to GitHub
git push origin main

# Railway auto-deploys to production
```

**Production API URL**: https://backend-prod.railway.app

---

## 📦 Docker Deployment

### Build Docker Image

```bash
# Backend
cd backend
docker build -t nestsafely-backend:1.0.0 .
docker tag nestsafely-backend:1.0.0 nestsafely-backend:latest

# Frontend
cd ../frontend
docker build -t nestsafely-frontend:1.0.0 .
```

### Docker Compose for Production

```yaml
version: '3.8'
services:
  backend:
    image: nestsafely-backend:latest
    environment:
      DB_HOST: postgres
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  frontend:
    image: nestsafely-frontend:latest
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: https://api.nestsafely.com/v1

  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Push to Docker Registry

```bash
# Docker Hub
docker login
docker push nestsafely-backend:latest
docker push nestsafely-frontend:latest

# Or AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag nestsafely-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/nestsafely-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/nestsafely-backend:latest
```

---

## 🗄️ Database Deployment

### PostgreSQL Managed Service

**Option 1: Railway PostgreSQL**
- Automatic backups
- Read replicas
- High availability
- See Railway Dashboard

**Option 2: AWS RDS**
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier nestsafely-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --allocated-storage 20
```

**Option 3: DigitalOcean Managed Database**
- Simple setup
- Automatic backups
- Connection pooling

### Run Migrations on Production

```bash
# Via Railway
railway run npm run db:migrate

# Via direct connection
psql postgresql://user:password@prod-db.com:5432/nestsafely < database/schema.sql
```

### Backup Strategy

```bash
# Daily automated backups (usually included in managed service)

# Manual backup
pg_dump postgresql://user:password@host:5432/db > backup-$(date +%Y%m%d).sql

# Restore from backup
psql postgresql://user:password@host/db < backup-20260623.sql

# Store backups in S3
aws s3 cp backup-20260623.sql s3://nestsafely-backups/
```

---

## 🔐 Security Hardening

### 1. SSL/TLS Certificates

- **Vercel**: Automatic (Let's Encrypt)
- **Railway**: Automatic
- **Custom**: Use Certbot:

```bash
sudo certbot certonly --standalone -d nestsafely.com -d api.nestsafely.com
```

### 2. Firewall Rules

```bash
# Allow only necessary traffic
# SSH (22)
# HTTP (80)
# HTTPS (443)
# PostgreSQL (5432) - only from backend
# Redis (6379) - only from backend
```

### 3. HTTPS Redirect

All HTTP requests redirect to HTTPS:

```typescript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### 4. Environment Secrets

Never commit `.env` files. Use:
- Vercel Secrets (frontend)
- Railway Environment Variables (backend)
- AWS Secrets Manager (advanced)

### 5. Rate Limiting

```typescript
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:'
  })
});

app.use('/api/', limiter);
```

### 6. CORS Configuration

```typescript
const corsOptions = {
  origin: ['https://nestsafely.com', 'https://www.nestsafely.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  maxAge: 86400
};

app.use(cors(corsOptions));
```

---

## 📊 Monitoring & Logging

### Error Tracking (Sentry)

```bash
# Setup Sentry
npm install @sentry/node @sentry/tracing

# Configure in backend
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Application Performance Monitoring

**Option 1: Datadog**
```typescript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'YOUR_APPLICATION_ID',
  clientToken: 'YOUR_CLIENT_TOKEN',
  site: 'datadoghq.com',
  service: 'nestsafely-frontend',
  env: 'production'
});
```

**Option 2: New Relic**
```typescript
require('newrelic');
// Initialize before anything else
```

### Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### Uptime Monitoring

Use UptimeRobot or similar:
- Monitor: `https://api.nestsafely.com/health`
- Alert on 5xx errors
- SMS/Email notifications

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📝 Post-Deployment Checklist

- [ ] Health check endpoint responding
- [ ] Database migrations successful
- [ ] API endpoints accessible
- [ ] Frontend loads without errors
- [ ] Authentication working
- [ ] Search/scoring functionality working
- [ ] Email notifications sending
- [ ] Logging working
- [ ] Monitoring alerts active
- [ ] DNS propagated
- [ ] SSL certificate valid
- [ ] Backups running
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] Performance acceptable (Lighthouse 90+)

## 🚨 Incident Response

### Database Down
1. Check managed service dashboard
2. Review recent logs
3. Restore from backup if needed
4. Notify users

### API Service Down
1. Check Railway/hosting dashboard
2. Review logs for errors
3. Restart service or rollback
4. Notify users

### Security Breach
1. Rotate all secrets immediately
2. Review audit logs
3. Notify affected users
4. Update security measures

---

**Last Updated**: 2026-06-23  
**Next Review**: 2026-07-23
