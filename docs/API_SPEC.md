# API Specification - NestSafely

Complete RESTful API specification for backend services.

## 📋 Overview

- **Base URL**: `https://api.nestsafely.com/v1`
- **Authentication**: JWT Bearer token (1-hour expiry)
- **Rate Limit**: 100 requests/min per IP
- **Response Format**: JSON
- **Timezone**: UTC

## 🔐 Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request**:
```json
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+92-300-1234567",
  "role": "user"  // optional, defaults to 'user'
}
```

**Validation**:
- Email: Valid email format, unique
- Password: Min 8 chars, uppercase, lowercase, number, special char
- Phone: Valid format (optional)
- First name: 2-100 chars, letters only

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "created_at": "2026-06-23T10:30:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Errors**:
- `400 Bad Request`: Validation failed
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Database error

---

### POST /auth/login

Authenticate user and receive tokens.

**Request**:
```json
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "remember_me": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user"
  },
  "tokens": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Set-Cookie**:
```
refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
```

**Errors**:
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Invalid email/password
- `429 Too Many Requests`: Too many login attempts (rate limited)

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request**:
```
POST /auth/refresh
Cookie: refreshToken=eyJhbGc...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Errors**:
- `401 Unauthorized`: Refresh token invalid/expired
- `403 Forbidden`: Refresh token revoked

---

### POST /auth/logout

Invalidate refresh token.

**Request**:
```
POST /auth/logout
Authorization: Bearer eyJhbGc...
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🏠 Property Endpoints

### GET /properties/search

Search properties by location and filters.

**Request**:
```
GET /properties/search?lat=31.5204&lng=74.3587&type=rent&budget_min=5000&budget_max=50000&radius_km=10&page=1&limit=20
Authorization: Bearer eyJhbGc...
```

**Query Parameters**:
| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| lat | number | Yes | - | -90 to 90 |
| lng | number | Yes | - | -180 to 180 |
| type | enum | No | all | rent, sale, lease |
| budget_min | number | No | 0 | positive |
| budget_max | number | No | ∞ | positive |
| radius_km | number | No | 10 | 1-50 |
| bedrooms | number | No | - | 0-10 |
| page | number | No | 1 | positive |
| limit | number | No | 20 | 1-100 |
| sort_by | enum | No | relevance | relevance, price_asc, price_desc, newest |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Cozy 2-bed apartment in DHA",
        "address": "123 Main Street, Karachi",
        "type": "rent",
        "price": 35000,
        "currency": "PKR",
        "bedrooms": 2,
        "bathrooms": 2,
        "area_sqft": 1200,
        "images_count": 5,
        "location": {
          "lat": 31.5204,
          "lng": 74.3587
        },
        "distance_km": 0.5,
        "safety_score": {
          "overall": 78.5,
          "grade": "B",
          "verdict": "RENT"
        },
        "owner": {
          "id": "user-id",
          "name": "John Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 342,
      "total_pages": 18
    }
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Token missing/invalid
- `429 Too Many Requests`: Rate limit exceeded

---

### GET /properties/:id

Get detailed property information.

**Request**:
```
GET /properties/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Cozy 2-bed apartment in DHA",
    "description": "Well-maintained apartment with modern amenities...",
    "type": "rent",
    "category": "apartment",
    "status": "active",
    "address": "123 Main Street, Karachi",
    "city": "Karachi",
    "area": "DHA",
    "postal_code": "75500",
    "location": { "lat": 31.5204, "lng": 74.3587 },
    "bedrooms": 2,
    "bathrooms": 2,
    "area_sqft": 1200,
    "constructed_year": 2015,
    "price": 35000,
    "price_per_sqft": 29.17,
    "currency": "PKR",
    "utilities": {
      "has_electricity": true,
      "has_gas": true,
      "has_water": true,
      "has_sewerage": true
    },
    "owner": {
      "id": "owner-id",
      "name": "John Doe",
      "email": "john@example.com",
      "rating": 4.8,
      "properties_count": 12
    },
    "safety_score": {
      "area_score": 78,
      "history_score": 85,
      "facility_score": 72,
      "cost_score": 71,
      "overall_score": 78.5,
      "grade": "B",
      "verdict": "RENT",
      "ai_verdict_text": "This property offers good value in a reasonably safe neighborhood. Recommended for long-term rent.",
      "breakdown": {
        "crime": "low",
        "flood_zone": "none",
        "nearby_schools": 3,
        "nearby_hospitals": 2,
        "market_ratio": "+8%",
        "appreciation": "12% (5-year)"
      }
    },
    "area_data": {
      "crime_index": 22,
      "flood_risk": "low",
      "noise_level": "moderate",
      "electricity_reliability": "92%",
      "water_availability": "22 hrs/day"
    },
    "nearby_facilities": {
      "hospitals": [
        { "name": "Aga Khan Hospital", "distance_km": 2.1, "rating": 4.8 },
        { "name": "Combined Military Hospital", "distance_km": 3.5, "rating": 4.5 }
      ],
      "schools": [
        { "name": "Lahore Grammar School", "distance_km": 1.2, "rating": 4.7 },
        { "name": "ICS", "distance_km": 2.3, "rating": 4.6 }
      ],
      "groceries": [
        { "name": "Carrefour", "distance_km": 0.8, "rating": 4.3 }
      ]
    },
    "history": [
      {
        "id": "hist-1",
        "event_type": "ownership_change",
        "title": "Ownership changed",
        "date": "2024-01-15",
        "severity": "low",
        "verified": true
      }
    ],
    "images": [
      {
        "url": "https://cdn.nestsafely.com/property-550e8400/1.jpg",
        "caption": "Front view",
        "order": 1
      }
    ],
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2026-06-15T15:45:00Z"
  }
}
```

**Errors**:
- `404 Not Found`: Property doesn't exist
- `401 Unauthorized`: Token missing/invalid

---

### POST /properties

Create a new property listing (agents/admins only).

**Request**:
```json
POST /properties
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Luxury 3-bed villa",
  "description": "Spacious villa with modern amenities",
  "type": "sale",
  "category": "house",
  "address": "123 Main Street",
  "city": "Karachi",
  "area": "DHA",
  "postal_code": "75500",
  "location": {
    "lat": 31.5204,
    "lng": 74.3587
  },
  "bedrooms": 3,
  "bathrooms": 3,
  "area_sqft": 3500,
  "constructed_year": 2020,
  "price": 25000000,
  "currency": "PKR",
  "has_electricity": true,
  "has_gas": true,
  "has_water": true,
  "has_sewerage": true
}
```

**Authorization**: Role must be `agent` or `admin`

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Luxury 3-bed villa",
    "status": "active",
    "created_at": "2026-06-23T10:30:00Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Validation failed
- `403 Forbidden`: Insufficient permissions
- `401 Unauthorized`: Token missing

---

### PUT /properties/:id

Update property listing.

**Request**:
```json
PUT /properties/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "price": 26000000,
  "status": "sold"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Luxury 3-bed villa",
    "updated_at": "2026-06-23T10:45:00Z"
  }
}
```

**Errors**:
- `404 Not Found`: Property doesn't exist
- `403 Forbidden`: Not the owner (unless admin)
- `400 Bad Request`: Invalid update data

---

### DELETE /properties/:id

Delete property listing (owner or admin only).

**Request**:
```
DELETE /properties/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGc...
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Property deleted"
}
```

---

## 📊 Safety Score Endpoints

### GET /properties/:id/score

Get safety score and details (cached or computed on-demand).

**Request**:
```
GET /properties/550e8400-e29b-41d4-a716-446655440000/score?detailed=true
Authorization: Bearer eyJhbGc...
```

**Query Parameters**:
| Parameter | Type | Default |
|-----------|------|---------|
| detailed | bool | false |
| include_breakdown | bool | false |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "property_id": "550e8400-e29b-41d4-a716-446655440000",
    "scores": {
      "area_score": 78,
      "history_score": 85,
      "facility_score": 72,
      "cost_score": 71,
      "overall_score": 78.5
    },
    "grade": "B",
    "verdict": "RENT",
    "ai_verdict": "This property offers good value in a reasonably safe neighborhood...",
    "computed_at": "2026-06-23T08:00:00Z",
    "expires_at": "2026-06-24T08:00:00Z",
    "source": "cache",
    "breakdown": {
      "area": {
        "crime_score": 80,
        "flood_score": 85,
        "noise_score": 70
      },
      "history": {
        "disputes": 0,
        "complaints": 0,
        "turnover": "normal"
      },
      "facility": {
        "hospitals": 2,
        "schools": 3,
        "grocery": true,
        "transportation": true
      },
      "cost": {
        "market_ratio": 95,
        "appreciation": 12,
        "hidden_costs_penalty": 10
      }
    }
  }
}
```

---

### POST /properties/:id/score/recalculate

Force recalculation of property score (admin only).

**Request**:
```
POST /properties/550e8400-e29b-41d4-a716-446655440000/score/recalculate
Authorization: Bearer eyJhbGc...
X-CSRF-Token: token123
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "Score recalculation queued",
  "job_id": "job-uuid",
  "estimated_time_seconds": 15
}
```

---

### GET /properties/:id/history

Get property history (disputes, complaints, events).

**Request**:
```
GET /properties/550e8400-e29b-41d4-a716-446655440000/history?event_type=dispute&limit=50
Authorization: Bearer eyJhbGc...
```

**Query Parameters**:
| Parameter | Type | Values |
|-----------|------|--------|
| event_type | enum | dispute, complaint, flood_event, ownership_change, legal_issue |
| limit | number | 1-100 |
| offset | number | ≥0 |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "hist-1",
        "event_type": "ownership_change",
        "title": "Ownership changed",
        "description": "Property transferred from John Doe to Jane Smith",
        "date": "2024-01-15",
        "severity": "low",
        "source": "government_registry",
        "verified": true,
        "resolved": true
      },
      {
        "id": "hist-2",
        "event_type": "complaint",
        "title": "Water supply complaint",
        "description": "Residents complained about irregular water supply",
        "date": "2023-06-20",
        "severity": "medium",
        "source": "user_report",
        "verified": false,
        "resolved": false
      }
    ],
    "total": 2
  }
}
```

---

## 💾 Saved Properties Endpoints

### POST /saved-properties

Save property to user's list.

**Request**:
```json
POST /saved-properties
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "property_id": "550e8400-e29b-41d4-a716-446655440000",
  "notes": "Good option, need to visit",
  "rating": 4
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "saved-1",
    "property_id": "550e8400-e29b-41d4-a716-446655440000",
    "saved_at": "2026-06-23T10:30:00Z"
  }
}
```

**Errors**:
- `409 Conflict`: Property already saved

---

### GET /saved-properties

Get user's saved properties.

**Request**:
```
GET /saved-properties?page=1&limit=20&sort=newest
Authorization: Bearer eyJhbGc...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Cozy 2-bed apartment",
        "price": 35000,
        "safety_score": 78.5,
        "grade": "B",
        "saved_at": "2026-06-23T10:30:00Z",
        "notes": "Good option, need to visit",
        "rating": 4
      }
    ],
    "pagination": {
      "page": 1,
      "total": 15
    }
  }
}
```

---

### DELETE /saved-properties/:property_id

Remove property from saved list.

**Request**:
```
DELETE /saved-properties/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Property removed from saved"
}
```

---

## 👤 User Endpoints

### GET /users/profile

Get current user profile.

**Request**:
```
GET /users/profile
Authorization: Bearer eyJhbGc...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+92-300-1234567",
    "role": "user",
    "status": "active",
    "notification_enabled": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### PUT /users/profile

Update user profile.

**Request**:
```json
PUT /users/profile
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "first_name": "Jonathan",
  "phone_number": "+92-300-9876543",
  "notification_enabled": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "updated_at": "2026-06-23T10:45:00Z"
  }
}
```

---

### PUT /users/password

Change password.

**Request**:
```json
PUT /users/password
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!",
  "confirm_password": "NewPassword456!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Errors**:
- `400 Bad Request`: Passwords don't match or validation failed
- `401 Unauthorized`: Current password incorrect

---

## 🗺️ Area Data Endpoints

### GET /areas/:area_id/data

Get area statistics and metrics.

**Request**:
```
GET /areas/karachi-dha/data
Authorization: Bearer eyJhbGc...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "area_name": "DHA, Karachi",
    "center": { "lat": 31.5204, "lng": 74.3587 },
    "crime": {
      "index": 22,
      "trend": "decreasing",
      "violent_crimes_per_100k": 12,
      "property_crimes_per_100k": 28
    },
    "environment": {
      "flood_zone": "low",
      "flood_risk_index": 15,
      "noise_level_db": 65,
      "air_quality_index": 78,
      "water_quality_index": 82
    },
    "infrastructure": {
      "electricity_reliability": "92%",
      "water_availability_hrs_per_day": 22,
      "internet_speed_mbps": 50
    },
    "economic": {
      "avg_property_price_per_sqft": 200,
      "price_trend_yearly": "12%",
      "rental_yield": "4.2%"
    },
    "demographics": {
      "population_density": 8500,
      "median_income_usd": 45000
    },
    "last_updated": "2026-06-20T00:00:00Z"
  }
}
```

---

## 📊 Analytics Endpoints (Admin)

### GET /analytics/dashboard

Admin dashboard with system statistics.

**Request**:
```
GET /analytics/dashboard?date_from=2026-06-01&date_to=2026-06-23
Authorization: Bearer eyJhbGc...
```

**Authorization**: Role must be `admin`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "properties": {
      "total": 1250,
      "new_this_month": 145,
      "active": 1180,
      "sold": 65,
      "rented": 68
    },
    "users": {
      "total": 3450,
      "new_this_month": 280,
      "active_last_30_days": 2100
    },
    "scores": {
      "avg_overall_score": 72.4,
      "recalculations_this_month": 4230,
      "avg_computation_time_ms": 245
    },
    "api": {
      "requests_this_month": 125430,
      "avg_response_time_ms": 187,
      "error_rate": "0.23%"
    }
  }
}
```

---

## 🔄 Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Email is required",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "request_id": "req-12345",
  "timestamp": "2026-06-23T10:30:00Z"
}
```

**Common Error Codes**:
- `VALIDATION_FAILED`: Input validation failed
- `AUTH_FAILED`: Authentication error
- `FORBIDDEN`: Authorization error
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `RESOURCE_CONFLICT`: Conflict (e.g., duplicate)

---

## 📝 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 202 | Accepted - Request queued |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource conflict |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error - Server error |

---

## 🔒 Security Headers

All responses include:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
```

---

**Last Updated**: 2026-06-23  
**Version**: 1.0
