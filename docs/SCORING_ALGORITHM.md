# Scoring Algorithm - NestSafely

Mathematical foundation of the property safety intelligence scoring system.

## 📊 Scoring System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 INPUT: Property + Area Data                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌──────┐    ┌──────┐    ┌──────────────┐
    │Raw   │    │Raw   │    │Raw           │
    │Crime │    │Flood │    │Noise/        │
    │Data  │    │Data  │    │Pollution     │
    └──┬───┘    └──┬───┘    └──┬───────────┘
       │           │           │
       └───────────┼───────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │  NORMALIZATION (0-100)       │
    │  Using Min-Max Scaling       │
    └───┬──────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│ SUB-SCORE CALCULATION (4 Scores)           │
├────────────────────────────────────────────┤
│ AREA_SCORE (30% weight)                    │
│ HISTORY_SCORE (25% weight)                 │
│ FACILITY_SCORE (25% weight)                │
│ COST_SCORE (20% weight)                    │
└───┬────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│ WEIGHTED AVERAGE                           │
│ OVERALL_SCORE = Σ(sub_score × weight)     │
│ Result: 0-100                              │
└───┬────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│ GRADE ASSIGNMENT                           │
│ A (85+) B (70-84) C (55-69)                │
│ D (40-54) F (<40)                          │
└────────────────────────────────────────────┘
```

## 🧮 Mathematical Formulas

### Step 1: Data Normalization

**Min-Max Scaling** (convert any value to 0-100):
$$\text{normalized} = \frac{\text{value} - \text{min}}{\text{max} - \text{min}} \times 100$$

```typescript
function normalize(value: number, min: number, max: number): number {
  if (value < min) return 0;
  if (value > max) return 100;
  return ((value - min) / (max - min)) * 100;
}

// Example: Crime index (scale: 0-1000 crimes per 100k)
const crimeNormalized = normalize(crimeIndex, 0, 1000);
// If crimeIndex = 500, normalized = 50
```

### Step 2: Sub-Score Calculations

#### A. AREA_SCORE (Crime, Flood, Noise)

Components:
- Crime index: 50% weight
- Flood risk: 30% weight
- Noise level: 20% weight

**Formula**:
$$\text{AREA\_SCORE} = \text{normalize}((\text{crime} \times 0.5) + (\text{flood} \times 0.3) + (\text{noise} \times 0.2))$$

**Important**: Crime/Flood/Noise are inverse metrics (higher = worse), so we invert them:
$$\text{crime\_inverted} = 100 - \text{crime\_normalized}$$

```typescript
function calculateAreaScore(areaData: AreaData): number {
  // Normalize each component to 0-100
  const crimeNormalized = normalize(areaData.crimeIndex, 0, 100);
  const floodNormalized = normalize(areaData.floodRiskIndex, 0, 100);
  const noiseNormalized = normalize(areaData.noiseDb, 40, 85); // dB scale
  
  // Invert (higher = better for score)
  const crimeScore = 100 - crimeNormalized;
  const floodScore = 100 - floodNormalized;
  const noiseScore = 100 - noiseNormalized;
  
  // Weighted average
  const areaScore = (crimeScore * 0.5) + (floodScore * 0.3) + (noiseScore * 0.2);
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, areaScore));
}
```

**Example Calculation**:
```
Crime Index: 35 (per 100k) → normalized to 35 → inverted to 65
Flood Risk: 20% → normalized to 20 → inverted to 80
Noise Level: 65 dB → normalized to 60 → inverted to 40

AREA_SCORE = (65 × 0.5) + (80 × 0.3) + (40 × 0.2)
           = 32.5 + 24 + 8
           = 64.5 / 100
```

#### B. HISTORY_SCORE (Disputes, Complaints, Turnover)

Components:
- Ownership disputes: -15 points per dispute
- Complaints: -10 points per complaint
- High turnover (>50% in 5 years): -20 points

**Base Score**: 100
**Formula**:
$$\text{HISTORY\_SCORE} = 100 - (\text{disputes} \times 15) - (\text{complaints} \times 10) - \text{turnover\_penalty}$$

**Minimum**: 0 (cannot go negative)

```typescript
function calculateHistoryScore(history: PropertyHistory[]): number {
  let score = 100;
  
  // Count disputes in last 5 years
  const recentDisputes = history.filter(h => 
    h.eventType === 'dispute' && 
    daysAgo(h.eventDate) <= 5 * 365
  ).length;
  
  // Count complaints
  const complaints = history.filter(h => 
    h.eventType === 'complaint'
  ).length;
  
  // Check turnover
  const ownershipChanges = history.filter(h => 
    h.eventType === 'ownership_change' &&
    daysAgo(h.eventDate) <= 5 * 365
  ).length;
  const highTurnover = ownershipChanges > 3 ? 20 : 0;
  
  // Deduct points
  score -= (recentDisputes * 15);
  score -= (complaints * 10);
  score -= highTurnover;
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}
```

**Example Calculation**:
```
Base Score: 100
- 2 recent disputes: 100 - (2 × 15) = 70
- 1 complaint: 70 - (1 × 10) = 60
- High turnover (4 changes in 5y): 60 - 20 = 40

HISTORY_SCORE = 40 / 100
```

#### C. FACILITY_SCORE (Proximity to Amenities)

Components:
- Hospital within 5km: +25 points
- School within 5km: +20 points
- Grocery store within 2km: +20 points
- Transportation hub within 3km: +15 points
- Bank/ATM within 2km: +10 points
- Parks/Recreation within 3km: +10 points

**Maximum**: 100 (cap at 100)

```typescript
function calculateFacilityScore(
  property: Property, 
  facilities: Facility[]
): number {
  let score = 0;
  const facilityScores = {
    hospital: { points: 25, maxDistance: 5000 },    // 5km
    school: { points: 20, maxDistance: 5000 },      // 5km
    grocery: { points: 20, maxDistance: 2000 },     // 2km
    transport: { points: 15, maxDistance: 3000 },   // 3km
    bank: { points: 10, maxDistance: 2000 },        // 2km
    park: { points: 10, maxDistance: 3000 }         // 3km
  };
  
  // For each category, check if at least one facility exists within distance
  for (const [category, config] of Object.entries(facilityScores)) {
    const hasNearby = facilities.some(f => 
      f.category === category &&
      distance(property.location, f.location) <= config.maxDistance
    );
    if (hasNearby) {
      score += config.points;
    }
  }
  
  // Bonus for exceptional facility density
  const nearbyFacilitiesCount = facilities.filter(f =>
    distance(property.location, f.location) <= 5000
  ).length;
  
  if (nearbyFacilitiesCount >= 20) score += 10; // Bonus
  
  // Clamp to 0-100
  return Math.min(100, score);
}
```

**Example Calculation**:
```
Hospital within 5km: +25
School within 5km: +20
Grocery within 2km: +20
Bank within 2km: +10
Parks nearby: +10
Facility count 25 (bonus): +10
Missing: Transport hub

FACILITY_SCORE = (25 + 20 + 20 + 10 + 10 + 10) = 95 / 100
```

#### D. COST_SCORE (Market Value, Appreciation, Hidden Costs)

Components:
- Price vs. market average ratio: 40% weight
- Appreciation trend (5-year): 40% weight
- Hidden cost penalties: 20% weight

**Formula**:
$$\text{COST\_SCORE} = (\text{market\_ratio\_score} \times 0.4) + (\text{appreciation\_score} \times 0.4) - (\text{hidden\_cost\_penalty} \times 0.2)$$

```typescript
function calculateCostScore(
  property: Property,
  areaData: AreaData,
  propertyHistory: PropertyHistory[]
): number {
  // 1. Market Ratio Score
  // Ideal ratio: property price = market average (ratio 1.0 = 100 points)
  // If 30% below market: 115 points (good deal)
  // If 50% above market: 50 points (overpriced)
  const marketAvgPrice = areaData.avgPropertyPrice;
  const priceRatio = property.price / marketAvgPrice;
  
  let marketRatioScore: number;
  if (priceRatio < 0.7) marketRatioScore = 115; // 30% below = great deal
  else if (priceRatio < 1.0) marketRatioScore = 100 + ((1 - priceRatio) / 0.3 * 15);
  else if (priceRatio <= 1.3) marketRatioScore = 100 - ((priceRatio - 1) / 0.3 * 50);
  else marketRatioScore = Math.max(0, 50 - ((priceRatio - 1.3) * 20));
  
  // 2. Appreciation Score
  // 5-year appreciation: positive = good investment
  const appreciationPct = areaData.priceAppreciation5Year;
  let appreciationScore = 50 + (appreciationPct * 5); // Scale: +1% appreciation = +5 points
  appreciationScore = Math.max(0, Math.min(100, appreciationScore));
  
  // 3. Hidden Cost Penalty
  let hiddenCostPenalty = 0;
  
  // High electricity costs (frequent outages)
  if (areaData.electricityReliability < 80) hiddenCostPenalty += 15;
  
  // Water shortage
  if (areaData.waterAvailabilityHrsPerDay < 20) hiddenCostPenalty += 20;
  
  // Flood zone
  const isFloodZone = propertyHistory.some(h => 
    h.eventType === 'flood_event' &&
    daysAgo(h.eventDate) <= 5 * 365
  );
  if (isFloodZone) hiddenCostPenalty += 25;
  
  // Calculate final score
  const costScore = (marketRatioScore * 0.4) + (appreciationScore * 0.4) - (hiddenCostPenalty * 0.2);
  return Math.max(0, Math.min(100, costScore));
}
```

**Example Calculation**:
```
Market Ratio:
- Average price per sqft: $200
- Property price: $150,000, size: 800 sqft = $187.5/sqft
- Ratio: 187.5/200 = 0.94 (6% below market)
- Market Ratio Score: ~95

Appreciation:
- 5-year appreciation: 12%
- Appreciation Score: 50 + (12 × 5) = 110 → capped to 100

Hidden Costs:
- Electricity reliability: 75% → penalty +15
- Water: 18 hrs/day → penalty +20
- No recent floods → penalty 0
- Total penalty: 35

COST_SCORE = (95 × 0.4) + (100 × 0.4) - (35 × 0.2)
           = 38 + 40 - 7
           = 71 / 100
```

### Step 3: Overall Score Calculation

**Weighted Average of All Sub-Scores**:
$$\text{OVERALL} = (\text{AREA} \times 0.30) + (\text{HISTORY} \times 0.25) + (\text{FACILITY} \times 0.25) + (\text{COST} \times 0.20)$$

The weights are configurable in a config file:
- Area: 30% (neighborhood safety most important)
- History: 25% (property-specific issues)
- Facility: 25% (convenience & amenities)
- Cost: 20% (investment value)

```typescript
interface ScoringConfig {
  weights: {
    area: 0.30;
    history: 0.25;
    facility: 0.25;
    cost: 0.20;
  };
}

function calculateOverallScore(
  areaScore: number,
  historyScore: number,
  facilityScore: number,
  costScore: number,
  config: ScoringConfig
): number {
  const overall = 
    (areaScore * config.weights.area) +
    (historyScore * config.weights.history) +
    (facilityScore * config.weights.facility) +
    (costScore * config.weights.cost);
  
  // Round to 2 decimals
  return Math.round(overall * 100) / 100;
}
```

### Step 4: Grade Assignment

```typescript
interface ScoreGrade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  color: string;
  emoji: string;
}

function assignGrade(overallScore: number): ScoreGrade {
  if (overallScore >= 85) {
    return { grade: 'A', label: 'Excellent', color: '#10B981', emoji: '🟢' };
  } else if (overallScore >= 70) {
    return { grade: 'B', label: 'Good', color: '#FBBF24', emoji: '🟡' };
  } else if (overallScore >= 55) {
    return { grade: 'C', label: 'Fair', color: '#F97316', emoji: '🟠' };
  } else if (overallScore >= 40) {
    return { grade: 'D', label: 'Poor', color: '#EF4444', emoji: '🔴' };
  } else {
    return { grade: 'F', label: 'Risky', color: '#7F1D1D', emoji: '⛔' };
  }
}
```

## 🔄 Complete Scoring Example

**Scenario**: Apartment in Karachi, Pakistan

### Data Input:
```
Property:
- Address: XYZ Street, Karachi
- Price: 5,000,000 PKR
- Size: 1,200 sqft
- Bedrooms: 2

Area Data:
- Crime Index: 45/100
- Flood Risk: 25%
- Noise: 72 dB

History:
- 1 ownership dispute (2 years ago)
- No complaints

Facilities:
- Hospital 3km away ✓
- School 2km away ✓
- Grocery 1.5km away ✓
- Bank 1km away ✓
- No parks nearby ✗
```

### Calculation:

```
AREA_SCORE:
- Crime: 45 → inverted to 55
- Flood: 25 → inverted to 75
- Noise: 72dB → normalized to 80 → inverted to 20
- AREA = (55 × 0.5) + (75 × 0.3) + (20 × 0.2) = 27.5 + 22.5 + 4 = 54

HISTORY_SCORE:
- Base: 100
- 1 dispute: -15
- 0 complaints: 0
- Normal turnover: 0
- HISTORY = 85

FACILITY_SCORE:
- Hospital within 5km: +25 ✓
- School within 5km: +20 ✓
- Grocery within 2km: +20 ✓
- Bank within 2km: +10 ✓
- No parks: 0
- FACILITY = 75

COST_SCORE:
- Market ratio: 0.95 (5% below average) → 95
- Appreciation: 8% trend → score 90
- Hidden costs: Electricity 85% + Water 22hrs → penalty 10
- COST = (95 × 0.4) + (90 × 0.4) - (10 × 0.2) = 38 + 36 - 2 = 72

OVERALL_SCORE:
= (54 × 0.30) + (85 × 0.25) + (75 × 0.25) + (72 × 0.20)
= 16.2 + 21.25 + 18.75 + 14.4
= 70.6

GRADE: B (Good)
```

## 💾 Storage in Database

```sql
INSERT INTO safety_scores (
  property_id,
  area_score,
  history_score,
  facility_score,
  cost_score,
  overall_score,
  grade,
  score_breakdown,
  computed_at
) VALUES (
  '...',
  54.0,
  85.0,
  75.0,
  72.0,
  70.6,
  'B',
  '{
    "area": {"crime": 55, "flood": 75, "noise": 20},
    "history": {"disputes": 1, "complaints": 0},
    "facilities": {"hospital": true, "school": true, "grocery": true, "bank": true},
    "cost": {"market_ratio": 95, "appreciation": 90, "hidden_costs": 10}
  }',
  NOW()
);
```

## 🔄 Score Caching & Invalidation

```typescript
// Cache duration
const SCORE_TTL = 24 * 60 * 60; // 24 hours

// Check cache first
async function getPropertyScore(propertyId: string): Promise<SafetyScores> {
  // 1. Try Redis
  const cached = await redis.get(`score:${propertyId}`);
  if (cached) return JSON.parse(cached);
  
  // 2. Try database (might be recent but expired)
  const dbScore = await db.query(
    'SELECT * FROM safety_scores WHERE property_id = $1 AND expires_at > NOW()',
    [propertyId]
  );
  if (dbScore.rows.length > 0) {
    const score = dbScore.rows[0];
    // Refresh cache
    await redis.setex(`score:${propertyId}`, SCORE_TTL, JSON.stringify(score));
    return score;
  }
  
  // 3. Compute new score
  const score = await computePropertyScore(propertyId);
  
  // 4. Cache and store
  await redis.setex(`score:${propertyId}`, SCORE_TTL, JSON.stringify(score));
  await saveScore(score);
  
  return score;
}

// Invalidate cache when property/area data updates
async function invalidateScoreCache(propertyId: string): Promise<void> {
  await redis.del(`score:${propertyId}`);
  // Also invalidate all properties in that area (within 5km)
  const property = await getProperty(propertyId);
  const nearbyProperties = await getNearbyProperties(property.location, 5000);
  
  for (const nearby of nearbyProperties) {
    await redis.del(`score:${nearby.id}`);
  }
}
```

## 🎯 Weighting Rationale

Why these specific weights?

| Factor | Weight | Rationale |
|--------|--------|-----------|
| Area Safety | 30% | Most important: affects all residents, can't be changed |
| History | 25% | Critical: past issues indicate future problems |
| Facilities | 25% | Equal to History: daily quality of life |
| Cost | 20% | Important but secondary: score exists even for affordable properties |

## 📊 Score Interpretation Guide

```
A (85+): Exceptional
- Safe area with low crime
- No property disputes
- Good amenities nearby
- Fair or good market value
→ Verdict: RENT/BUY (safe choice)

B (70-84): Good
- Reasonably safe area
- Minor history issues
- Some amenities nearby
- Market value acceptable
→ Verdict: RENT/BUY (proceed with due diligence)

C (55-69): Fair
- Moderate safety concerns
- Several past issues or old incidents
- Limited amenities
- Higher or lower market value
→ Verdict: NEGOTIATE (requires negotiation)

D (40-54): Poor
- Safety concerns
- Multiple property issues
- Few amenities
- Overpriced or in decline
→ Verdict: AVOID/NEGOTIATE

F (<40): Risky
- Serious safety/environmental issues
- Major property history
- Minimal amenities
- Poor value proposition
→ Verdict: AVOID (high risk)
```

---

**Last Updated**: 2026-06-23  
**Review Cycle**: Quarterly (adjust weights based on user feedback)
