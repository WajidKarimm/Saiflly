# Frontend README - NestSafely

Next.js 14 frontend with React, TypeScript, Tailwind CSS, React Query, and Mapbox GL.

## 🏗️ Architecture

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── properties/          # Property listing/detail pages
│   │   ├── page.tsx         # Search & grid
│   │   └── [id]/page.tsx    # Detail page
│   ├── dashboard/           # User dashboard
│   │   ├── page.tsx
│   │   └── saved/page.tsx
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── SearchBar.tsx        # Location search
│   ├── SafetyBadge.tsx      # Score badge
│   ├── ScoreMeters.tsx      # Score visualization
│   ├── MapView.tsx          # Mapbox integration
│   ├── PropertyCard.tsx     # Listing card
│   ├── PropertyDetail.tsx   # Detail view
│   └── common/              # Reusable components
├── lib/
│   ├── api-client.ts        # API integration
│   ├── auth.ts              # Auth helpers
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProperties.ts
│   │   └── useSavedProperties.ts
│   └── utils/               # Utility functions
├── styles/
│   ├── globals.css          # Global styles
│   └── variables.css        # CSS variables
└── types/
    └── index.ts             # TypeScript types
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Backend API running on `http://localhost:3000`

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your settings
nano .env.local

# Start development server
npm run dev
```

App runs on `http://localhost:3001`

## 📦 Dependencies

### Core
- `next`: React framework
- `react`: UI library
- `typescript`: Type safety

### Styling
- `tailwindcss`: Utility CSS
- `tailwindcss-animated`: Animation helpers
- `postcss`: CSS processing

### Data Fetching
- `@tanstack/react-query`: Data sync & caching
- `axios`: HTTP client

### Maps
- `mapbox-gl`: Map library
- `@mapbox/mapbox-gl-draw`: Draw tools

### Forms
- `react-hook-form`: Form state
- `zod`: Validation

### UI Components
- `@headlessui/react`: Accessible components
- `@heroicons/react`: Icons
- `recharts`: Charts & data visualization

### Authentication
- `next-auth`: Session management (optional)
- `js-cookie`: Cookie handling

### Utilities
- `clsx`: Class merging
- `date-fns`: Date manipulation
- `lodash-es`: Utilities

## 🛠️ Development

### Run development server
```bash
npm run dev
```

Runs on `http://localhost:3001` with hot-reload.

### Build for production
```bash
npm run build
```

Creates optimized production build in `.next/`.

### Start production server
```bash
npm run start
```

Runs the production build.

### Run tests
```bash
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Linting & Formatting
```bash
npm run lint           # ESLint
npm run lint:fix       # Fix lint errors
npm run format         # Prettier
npm run format:check   # Check formatting
```

## 🔑 Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001

# Mapbox API
NEXT_PUBLIC_MAPBOX_TOKEN=pk_your_mapbox_token_here

# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_STRIPE=false
```

Note: Variables prefixed with `NEXT_PUBLIC_` are exposed to browser.

## 🎨 UI Components

### Safety Badge
```tsx
import { SafetyBadge } from '@/components/SafetyBadge';

<SafetyBadge 
  score={78.5} 
  grade="B" 
  verdict="RENT"
/>
```

### Score Meters
```tsx
import { ScoreMeters } from '@/components/ScoreMeters';

<ScoreMeters 
  areaScore={78}
  historyScore={85}
  facilityScore={72}
  costScore={71}
/>
```

### Map View
```tsx
import { MapView } from '@/components/MapView';

<MapView 
  properties={properties}
  center={{ lat: 31.5204, lng: 74.3587 }}
  zoom={12}
/>
```

## 🔗 API Integration

### Using React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { searchProperties } from '@/lib/api-client';

export function SearchResults() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', { lat, lng, type, budget }],
    queryFn: () => searchProperties({ lat, lng, type, budget }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading properties</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

### Auth Context

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

export function Profile() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.first_name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 📱 Pages

### Search Page (`/properties`)
- Location picker with Mapbox
- Filter: type, budget, bedrooms
- Property grid with safety badges
- Pagination

### Detail Page (`/properties/[id]`)
- Full property information
- High-resolution images
- Safety score breakdown
- AI verdict with explanation
- Nearby facilities
- Property history timeline
- Save/bookmark button
- Contact owner form

### Dashboard (`/dashboard`)
- Saved properties
- Search history
- User profile
- Preferences

### Auth Pages
- Register: Email, password, profile info
- Login: Email, password, remember me
- Forgot Password: Email recovery

## 🗺️ Mapbox Integration

### Setup

1. Get API token: https://account.mapbox.com/
2. Add to `.env.local`:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk_your_token_here
```

3. Usage:
```tsx
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [74.3587, 31.5204],
  zoom: 12
});
```

## 📊 Data Visualization

### Score Chart
```tsx
import { BarChart } from 'recharts';

<BarChart data={[
  { name: 'Area', value: 78 },
  { name: 'History', value: 85 },
  { name: 'Facility', value: 72 },
  { name: 'Cost', value: 71 }
]}>
  <Bar dataKey="value" fill="#3b82f6" />
</BarChart>
```

## 🔒 Security

### Token Management
```typescript
// Store in memory (cleared on logout)
let accessToken: string | null = null;

// Refresh token in HttpOnly cookie (secure)
// Automatic via API interceptor

// Clear on logout
localStorage.clear();
sessionStorage.clear();
```

### CSRF Protection
```typescript
// Automatically added to forms
<input name="csrfToken" type="hidden" value={csrfToken} />
```

### Input Sanitization
```typescript
import DOMPurify from 'dompurify';

const safeHTML = DOMPurify.sanitize(userInput);
```

## 📱 Responsive Design

Mobile-first design with breakpoints:
- Mobile: 0-640px
- Tablet: 640-1024px
- Desktop: 1024px+

Using Tailwind CSS:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

Example:
```typescript
import { render, screen } from '@testing-library/react';
import { SafetyBadge } from '@/components/SafetyBadge';

describe('SafetyBadge', () => {
  it('displays correct grade', () => {
    render(<SafetyBadge score={85} grade="A" verdict="BUY" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Connect repository
vercel link

# Deploy
vercel deploy

# Production
git push origin main  # Auto-deploys
```

### Docker
```bash
docker build -t nestsafely-frontend .
docker run -p 3001:3001 nestsafely-frontend
```

### Environment Setup in Vercel
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.example`
3. Redeploy

## 📈 Performance

### Next.js Optimizations
- Image optimization: `<Image>` component
- Code splitting: Automatic
- CSS-in-JS: Tailwind (minimal runtime)
- API routes caching with React Query

### Lighthouse Score Target
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

Check: `npm run lighthouse`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Mapbox Documentation](https://docs.mapbox.com/)

---

**Last Updated**: 2026-06-23  
**Maintainer**: NestSafely Team
