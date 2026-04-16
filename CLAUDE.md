# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**BroniSport** (брониспорт) — a frontend-only MVP for a sports facility booking platform (courts, gyms, venues). Single-page React app with no backend; all data is mocked.

## Commands

```bash
npm run dev      # Vite dev server on http://localhost:3000 (auto-opens browser)
npm run build    # Production build to /dist
npm run preview  # Preview the production build
```

There are **no tests, no linter, and no typechecker** configured. Do not suggest `npm test` / `npm run lint` — they don't exist. If adding tests or lint config, update this file.

Docker: the repo ships a multi-stage Dockerfile that builds with Node 20-alpine and serves `/dist` via `serve` on port 3000.

## Architecture

### Role-based routing (critical to understand)

[src/router.jsx](src/router.jsx) renders **completely different route trees** based on the authenticated user's role from `useAuth()`:

- **Admin** → only `/admin`; every other path redirects there.
- **Owner** → only `/owner` and `/owner/add-facility`; other paths redirect.
- **Client / Guest** → the main app inside `<Layout>` (Discover, FacilityDetail, Bookings, Favorites, Profile).

Owner and Admin screens do **not** use the `Layout` wrapper, so they have no TopNav/BottomNav. When adding an owner/admin screen, either add it under the role's branch in `router.jsx` or wrap it in its own layout — it will not inherit the client shell.

### State: three stacked Context providers

[src/App.jsx](src/App.jsx) wraps the app in this order: `AlertProvider` → `AuthProvider` → `BookingProvider`. `BookingContext` depends on `useAuth()`, so provider order matters — don't rearrange.

Consumer hooks:
- `useAuth()` — `user`, `isAuthenticated`, `isAdmin`, `isOwner`, `login`, `logout`, favorites
- `useBookings()` — `bookings`, `createBooking`, `cancelBooking`
- `useAlert()` — `success`, `error`, `warning` toasts

### Data layer

All data lives in [src/utils/mockData.js](src/utils/mockData.js): 12 hardcoded facilities, 4 test users, sample bookings, plus helpers `generateSlots()`, `findUserByEmail()`, `filterFacilities()`. Time slots are randomly generated per facility for 14 days, 8am–10pm.

Persistence is **localStorage only** — user session, favorites, and bookings. No API, no backend calls. The "Add Facility" form does not persist; it's UI-only (as are admin approve/reject actions). Keep this in mind before telling the user a feature "works end-to-end."

### Auth model (important caveat)

Login is **email-only, no password** — `findUserByEmail()` returns a user object if the email matches a mock. Role is determined by which test email is used:

- `client@example.com` — client
- `owner@example.com` — owner
- `admin@sport.ru` — admin

This is intentional for the MVP but means any "auth" changes should not assume real credential checks exist.

### Design system

Tailwind config in [tailwind.config.js](tailwind.config.js) defines custom Material Design 3-inspired tokens. The design language avoids 1px borders — use tonal background nesting (`surface`, `surface-container`) instead. Glassmorphism (blur + transparency) is used for modals. Mobile-first; the client shell has a fixed `BottomNav`.

Fonts: **Manrope** for headings, **Inter** for body. Icons are Google Material Symbols loaded via CDN in [index.html](index.html).

## Known gotchas

- `Layout.jsx` persists scroll position via refs — be careful when changing its structure.
- `BookingContext` imports `useAuth`, creating tight coupling; don't try to use it outside `AuthProvider`.
- External images come from Unsplash URLs in mock data — they're not optimized and not bundled.
- The project uses plain JavaScript (JSX), not TypeScript. Don't add `.ts`/`.tsx` files without converting config.