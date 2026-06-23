# Security Guidelines - NestSafely

Comprehensive security checklist and best practices implemented from day one.

## 🔐 Security Checklist

### ✅ Authentication & Authorization

- [ ] **JWT Implementation**
  - Token structure: `header.payload.signature` (HS256)
  - Payload includes: `sub` (user ID), `role`, `iat`, `exp` (1 hour)
  - Signature verified on every request
  - No sensitive data in JWT body (it's readable!)

```typescript
// Backend: Sign token
const token = jwt.sign(
  { sub: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1h', algorithm: 'HS256' }
);

// Frontend: Send with every request
Authorization: Bearer ${token}
```

- [ ] **Password Storage**
  - Never store plain passwords
  - Use bcrypt with minimum 12 rounds
  - Hash should fail gracefully (don't reveal if user exists)

```typescript
// Hash on registration
const salt = await bcrypt.genSalt(12);
const passwordHash = await bcrypt.hash(password, salt);

// Verify on login
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

- [ ] **Refresh Tokens**
  - Issued with 30-day expiry
  - Stored hashed in database
  - One-time use or revocable
  - Separate from access token
  - Sent in HttpOnly cookie (prevents XSS access)

```typescript
// Refresh token stored as HttpOnly cookie (JavaScript cannot access)
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
});
```

- [ ] **Session Management**
  - Sessions stored in Redis with TTL
  - Single session per device (track device IDs)
  - Logout invalidates immediately
  - Idle timeout after 15 minutes

- [ ] **Role-Based Access Control (RBAC)**
  ```typescript
  // Middleware to check roles
  const authorize = (requiredRoles: string[]) => {
    return (req, res, next) => {
      if (!requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  };
  
  // Usage
  router.post('/admin/users', authorize(['admin']), adminController.updateUser);
  ```

### ✅ Input Validation & Sanitization

- [ ] **Zod Validation Schema** (every endpoint)
  ```typescript
  import { z } from 'zod';
  
  const searchPropertiesSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    type: z.enum(['rent', 'sale', 'lease']),
    budget_min: z.number().positive().optional(),
    budget_max: z.number().positive().optional(),
    radius_km: z.number().positive().max(50).default(10),
    page: z.number().positive().default(1)
  });
  
  // Usage in route
  const result = searchPropertiesSchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  ```

- [ ] **Sanitization**
  - XSS prevention: Escape all user input before storing
  - Use libraries like `xss` or `DOMPurify` for HTML
  - Never trust `content-type` header
  - Validate file uploads (size, type, scan for malware)

```typescript
import xss from 'xss';

const sanitizedDescription = xss(req.body.description, {
  whiteList: {}, // Remove all HTML
  stripIgnoredTag: true
});
```

- [ ] **Parameterized Queries** (prevent SQL injection)
  ```typescript
  // ❌ WRONG
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  
  // ✅ CORRECT
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await db.query(query, [email]);
  ```

### ✅ API Security

- [ ] **Rate Limiting**
  ```typescript
  import rateLimit from 'express-rate-limit';
  
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Max 100 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip, // Rate limit by IP
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: req.rateLimit.resetTime
      });
    }
  });
  
  app.use('/api/', limiter);
  ```

- [ ] **CORS (Cross-Origin Resource Sharing)**
  ```typescript
  import cors from 'cors';
  
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS.split(','), // e.g., 'https://nestsafely.com'
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
    maxAge: 86400 // Preflight cache 24 hours
  };
  
  app.use(cors(corsOptions));
  ```

- [ ] **Security Headers** (Helmet.js)
  ```typescript
  import helmet from 'helmet';
  
  app.use(helmet());
  
  // Specifically:
  // - Strict-Transport-Security (HSTS): Force HTTPS
  // - X-Frame-Options: Prevent clickjacking
  // - X-Content-Type-Options: nosniff
  // - Content-Security-Policy: Script injection prevention
  // - X-XSS-Protection: Legacy XSS protection
  ```

- [ ] **HTTPS/TLS 1.3**
  - Enforce HTTPS in production
  - Certificate pinning for API calls
  - Redirect HTTP to HTTPS

```typescript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

- [ ] **Content Security Policy**
  ```typescript
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Minimize unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.nestsafely.com'],
      fontSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }));
  ```

### ✅ Data Security

- [ ] **Encryption at Rest**
  - PostgreSQL: Use pgcrypto extension
  - Sensitive fields: national ID, SSN, payment info
  - Never encrypt passwords (hash instead)
  - Key rotation every 90 days

```sql
-- Encrypt sensitive data
UPDATE users 
SET national_id_encrypted = pgp_sym_encrypt(national_id, 'secret_key')
WHERE national_id IS NOT NULL;

-- Decrypt on retrieval
SELECT pgp_sym_decrypt(decode(national_id_encrypted, 'hex'), 'secret_key')
FROM users WHERE id = $1;
```

- [ ] **Encryption in Transit**
  - TLS 1.3 minimum
  - Certificate pinning for critical APIs
  - All API responses gzipped

- [ ] **Field-Level Security**
  ```typescript
  // Redact sensitive fields in API responses
  const safeUser = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    role: user.role
    // ❌ NEVER return: password_hash, refresh_token, national_id
  };
  ```

- [ ] **Data Masking in Logs**
  ```typescript
  const maskSensitiveData = (data: any) => {
    const masked = { ...data };
    if (masked.email) masked.email = masked.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    if (masked.phone) masked.phone = masked.phone.slice(-4).padStart(masked.phone.length, '*');
    return masked;
  };
  
  logger.info('User action', maskSensitiveData(userData));
  ```

### ✅ API Error Handling

- [ ] **Generic Error Messages** (don't leak info)
  ```typescript
  // ❌ WRONG
  res.status(400).json({
    error: 'User with email admin@example.com not found'
  });
  
  // ✅ CORRECT
  res.status(400).json({
    error: 'Invalid email or password',
    code: 'AUTH_FAILED'
  });
  ```

- [ ] **Error Logging** (log details, return generic message)
  ```typescript
  try {
    // Database query
  } catch (error) {
    logger.error('Database error', {
      userId: req.user?.id,
      query: sanitizeQuery(req.body),
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      error: 'An unexpected error occurred',
      requestId: req.id // For support inquiries
    });
  }
  ```

### ✅ Database Security

- [ ] **Connection Pooling**
  - Limit concurrent connections
  - Close idle connections
  - Prevent connection exhaustion DoS

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // Max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

- [ ] **Least Privilege Principle**
  ```sql
  -- Create read-only user for API
  CREATE USER api_readonly WITH PASSWORD 'secure_password';
  GRANT CONNECT ON DATABASE nestsafely TO api_readonly;
  GRANT USAGE ON SCHEMA public TO api_readonly;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO api_readonly;
  
  -- Create write user for specific operations
  CREATE USER api_write WITH PASSWORD 'secure_password';
  GRANT USAGE ON SCHEMA public TO api_write;
  GRANT SELECT, INSERT, UPDATE ON properties TO api_write;
  ```

- [ ] **Backup Encryption**
  - Encrypt database backups
  - Store in separate secure location
  - Test restore process monthly

### ✅ Third-Party Integrations

- [ ] **API Key Management**
  - Store API keys in `.env` (never in code)
  - Rotate keys every 90 days
  - Use separate keys for dev/staging/prod
  - Track API key usage

```typescript
// ❌ WRONG
const GOOGLE_PLACES_API_KEY = 'AIzaSy...';

// ✅ CORRECT
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_PLACES_API_KEY) {
  throw new Error('GOOGLE_PLACES_API_KEY not configured');
}
```

- [ ] **Claude API Security**
  - Never log full API requests
  - Validate response before parsing
  - Implement timeout (10 seconds max)
  - Rate limit Claude calls (expensive!)

```typescript
const callClaudeAPI = async (scores: SafetyScores) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'content-type': 'application/json'
      },
      timeout: 10000, // 10 second timeout
      body: JSON.stringify({
        model: 'claude-3-sonnet-4.6-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: buildPrompt(scores)
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return validateVerdictResponse(data);
  } catch (error) {
    logger.error('Claude API call failed', { error: error.message });
    throw new Error('Failed to generate verdict');
  }
};
```

### ✅ Frontend Security

- [ ] **XSS Prevention**
  - Never use `innerHTML`
  - Use React's built-in escaping
  - Sanitize if needed: `DOMPurify.sanitize()`

```typescript
// ❌ WRONG
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ CORRECT
<div>{userInput}</div> // React escapes automatically
```

- [ ] **CSRF Protection**
  - Double-Submit Cookie pattern
  - SameSite cookie attribute

```typescript
// Frontend: Include CSRF token in requests
const response = await fetch('/api/properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
  },
  credentials: 'include', // Send cookies
  body: JSON.stringify(data)
});

// Backend: Verify token
router.post('/properties', (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  const cookieToken = req.cookies.csrfToken;
  
  if (token !== cookieToken) {
    return res.status(403).json({ error: 'CSRF token mismatch' });
  }
  next();
});
```

- [ ] **Secure Token Storage**
  - Access token: Memory (cleared on logout)
  - Refresh token: HttpOnly cookie (inaccessible to JavaScript)

```typescript
// Do NOT store tokens in localStorage (vulnerable to XSS)
// ✅ Better approach:
localStorage.clear(); // Clear on logout
sessionStorage.clear();

// Store refresh token in HttpOnly cookie (server sets it)
// Store access token in memory/state
```

### ✅ Infrastructure Security

- [ ] **Environment Variables**
  - Never commit `.env` to git
  - Use `.env.example` template
  - Validate all required vars on startup

```typescript
// Startup validation
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_PASSWORD',
  'CLAUDE_API_KEY',
  'REDIS_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

- [ ] **Secrets Management**
  - Use Vercel Secrets (frontend deployment)
  - Use Railway/Render Secrets (backend deployment)
  - Never hardcode secrets
  - Rotate regularly

- [ ] **Logging & Monitoring**
  - Log all authentication events
  - Monitor for suspicious patterns (multiple failed logins)
  - Alert on security events
  - Never log sensitive data

```typescript
const securityLogger = createLogger('security');

// Login attempt
securityLogger.info('Login attempt', {
  email: user.email,
  ip: req.ip,
  success: true,
  timestamp: new Date().toISOString()
});

// Failed login
securityLogger.warn('Failed login attempt', {
  email: req.body.email,
  ip: req.ip,
  reason: 'Invalid password',
  timestamp: new Date().toISOString()
});
```

### ✅ Deployment Security

- [ ] **Container Security** (if using Docker)
  - Don't run as root
  - Use minimal base images (alpine)
  - Scan for vulnerabilities

```dockerfile
FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

- [ ] **Network Security**
  - Firewall rules (allow only necessary ports)
  - Private database (not exposed to internet)
  - VPN for admin access

## 🔍 Security Testing Checklist

- [ ] OWASP Top 10 audit
- [ ] SQL injection testing
- [ ] XSS vulnerability scanning
- [ ] CSRF token validation
- [ ] Authentication bypass attempts
- [ ] Authorization boundary testing
- [ ] Rate limiting effectiveness
- [ ] Encryption validation
- [ ] Password policy enforcement
- [ ] Dependency vulnerability scan (`npm audit`)

## 📋 Incident Response Plan

### If Breach Occurs:
1. **Immediate**: Rotate all secrets and keys
2. **Within 1 hour**: Notify affected users
3. **Within 24 hours**: Audit logs for scope
4. **Within 48 hours**: Publish incident report
5. **Ongoing**: Implement preventive measures

## 🚀 Continuous Security

- Weekly: Run `npm audit` for dependencies
- Monthly: Security header review
- Quarterly: Penetration testing
- Yearly: Full security audit

---

**Last Updated**: 2026-06-23  
**Review Cycle**: Quarterly
