# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**BroniSport** (брониспорт) — full-stack sports facility booking platform. React frontend + Node.js/Express backend + PostgreSQL. Two roles: athlete (booking, favorites, reviews) and organizer (facility management, booking management).

## Commands

### Frontend (root)
```bash
npm run dev      # Vite dev server on http://localhost:3000
npm run build    # Production build to /dist
```

### Backend (backend/)
```bash
npm run dev              # Node --watch on http://localhost:4000
npm run start            # Production start
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # DB GUI
npm run db:seed          # Seed test data (2 users + 12 facilities)
npm run moderate:list    # List pending facilities
npm run moderate:approve -- <id>
npm run moderate:reject  -- <id> --reason="..."
```

### Full stack
```bash
./start-dev.sh           # Docker Postgres + backend + frontend in one command
./start-dev.sh --fresh   # Wipe DB and reseed
```

There are **no tests and no linter** configured.

## Architecture

### Tech stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Query, Axios
- **Backend**: Node.js 20, Express, Prisma ORM, PostgreSQL 15
- **Auth**: JWT (access 15m + refresh 7d in HTTPOnly cookie), bcrypt
- **Storage**: Yandex S3 (Object Storage) for photos, sharp for optimization
- **Email**: Resend (password reset codes)
- **Deploy**: Docker Compose (postgres + api + frontend)

### Role-based routing

[src/router.jsx](src/router.jsx) renders different route trees based on `useAuth().isOwner`:

- **Organizer** → `/owner` (dashboard), `/owner/add-facility`, `/owner/edit-facility/:id`
- **Athlete / Guest** → `<Layout>` with Discover, FacilityDetail, Bookings, Favorites, Profile

No admin UI — moderation is done via CLI scripts (`npm run moderate:*`).

### State management

- **AuthContext** ([src/context/AuthContext.jsx](src/context/AuthContext.jsx)) — user session, login/register/logout via API, token refresh
- **AlertContext** — toast notifications
- **React Query** — all data fetching via hooks in [src/api/hooks/](src/api/hooks/)

No BookingContext or local mock data — everything goes through the backend API.

### API client

[src/api/client.js](src/api/client.js) — Axios instance with:
- Access token in memory (not localStorage)
- Auto-refresh on 401 via HTTPOnly cookie (single-flight)
- `resolveUploadUrl()` for S3/local photo URLs

### Backend structure

```
backend/src/
├── routes/        # Express routers (auth, facilities, bookings, favorites, reviews, owner, users)
├── services/      # Business logic (one service per domain)
├── middleware/     # auth (JWT), validate (Zod), upload (S3 + sharp)
├── utils/         # httpError, jwt helpers
├── scripts/       # seed, moderate (CLI)
└── prisma.js      # PrismaClient singleton
```

### Key business rules

- Facilities require moderation (`isApproved: false` on create, approve via CLI)
- Bookings: 1–4 hour duration, UNIQUE constraint on `(facilityId, date, startTime)` prevents double-booking, overlap check for multi-hour bookings
- Bookings limited to 14 days ahead, past slots hidden
- Reviews: only after a completed/past booking
- Organizer can create guest bookings (phone bookings) with `guestName`/`guestPhone`
- Photos optimized via sharp (→ 1920×1440 webp q85) and stored in Yandex S3

### Design system

Tailwind with Material Design 3-inspired tokens. No 1px borders — tonal nesting (`surface`, `surface-container`). Mobile-first. Fonts: Manrope (headings), Inter (body). Icons: Google Material Symbols via CDN.

## Environment variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000/api
```

### Backend (backend/.env)
```
DATABASE_URL, PORT, NODE_ENV
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
CORS_ORIGIN
S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
RESEND_API_KEY, RESEND_FROM
```
