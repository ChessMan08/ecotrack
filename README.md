# 🌿 Ecotrack — Carbon Footprint Awareness Platform

> **Track, understand, and reduce your personal carbon footprint** with science-backed calculations and personalized AI insights powered by Google Gemini.

---

## Quick Start

```bash
git clone https://github.com/ChessMan08/ecotrack.git
cd ecotrack
npm install
cp .env.example .env.local   # Fill in Firebase + Gemini keys
npm run dev                  # http://localhost:3000
```

**Run tests:**
```bash
npm test        # 88 tests, all passing
```

**Build:**
```bash
npm run build
```

---

## Architecture Overview

```
Next.js App Router (TypeScript)
  ├── /api/ai/*            → Server routes → Gemini 1.5 Flash (key never in browser)
  ├── /dashboard           → Footprint summary, charts, AI insight, actions
  ├── /calculator          → Live calculator (5 categories, transparent assumptions)
  ├── /actions             → Rule-based recommendation engine (16 rules)
  ├── /goals               → Goal setting and progress tracking
  ├── /education           → Learning hub (9 cards, FAQ)
  └── /profile             → Settings + AI chat assistant + export

src/lib/
  ├── calculator.ts        → Pure deterministic emission calculations
  ├── emission-factors.ts  → All factors with source citations
  ├── recommendations.ts   → Rule-based action suggestions
  ├── gemini.ts            → Prompt builders (server-side only)
  └── firebase.ts          → Auth + Firestore CRUD

Firebase:
  ├── Authentication       → Email/pass + Google Sign-In
  └── Firestore            → users/{uid}/{emissions,goals,actions,insights}
```

**Key principle**: Gemini AI *explains and coaches* — it never *calculates*. All emission numbers come from deterministic TypeScript functions using published factors.

---

## Environment Variables

```env
# Firebase (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google Gemini — SERVER SIDE ONLY (no NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=
```

---

## Emission Factors & Sources

| Category | Methodology | Primary Source |
|---|---|---|
| Electricity | kWh × grid intensity by country | EPA eGRID 2023, IEA 2023 |
| Natural gas | m³ × combustion factor | EPA GHG Factors Hub 2024 |
| Cars | km × vehicle factor by type | UK DESNZ 2023 |
| Flights | Per-flight factor (short/long) | UK DESNZ 2023 |
| Food / Diet | Annual diet-type baseline | Scarborough et al. 2023 (Nature Food) |
| Waste | kg × disposal method factor | EPA WARM Model 2023 |
| Purchases | USD spend × sector factor | USEEIO v2.0 (EPA) |

GWP values: IPCC AR6. Benchmarks: World Bank 2022, University of Michigan 2023.

---

## Google Services Used

| Service | Where | Purpose |
|---|---|---|
| **Gemini 1.5 Flash** | `/api/ai/summary`, `/focus`, `/chat` | Footprint summaries, weekly coaching, chat Q&A |
| **Firebase Auth** | `/auth`, `AuthContext` | Email/password + Google Sign-In |
| **Cloud Firestore** | `firebase.ts` | All user data (profiles, emissions, goals, actions) |
| **Firebase Hosting** | `firebase.json` | Production deployment with security headers |

---

## Testing

88 unit tests across 3 suites:

```
src/__tests__/
├── calculator.test.ts      # 54 tests — emission calculations
├── recommendations.test.ts # 20 tests — recommendation engine
└── utils.test.ts           # 14 tests — utility functions
```

Tests cover: period converters, home energy (US/UK/IN grids, green energy), transport (all vehicle types, flights), food (diet hierarchy, waste, local food), waste (landfill/recycle/compost), purchases (spend-based), full footprint integration, formatting helpers, recommendation triggers, and utility functions.

---

## Deployment — Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,firestore:indexes
npm run build
firebase deploy --only hosting
```

Or deploy to **Vercel**:
```bash
vercel --prod
```

---

## Project Structure

```
src/
├── app/            → Next.js pages + API routes
├── components/     → UI system (Button, Card, Input, Charts, etc.)
├── lib/            → Business logic (calculator, recommendations, firebase, gemini)
├── context/        → AuthContext (Firebase auth state)
├── types/          → All TypeScript types
└── __tests__/      → Unit tests

scripts/seed-data.ts → Demo data + Firestore data shape documentation
firestore.rules      → Firestore security rules (strict user isolation)
firestore.indexes.json → Composite index definitions
```

---

## Security

- Gemini API key is server-side only — never exposed to the browser
- Firebase keys are public but protected by strict Firestore security rules
- Users can only read/write their own data (`users/{uid}/**`)
- All emission entry values are server-validated (0 ≤ kgCO₂e ≤ 1,000,000)
- XSS protection via React's default escaping + `sanitizeText()` utility
- Security headers configured in `firebase.json` (X-Frame-Options, X-XSS-Protection)

---

*Built for the Google AI Challenge · Emission factors from EPA, IPCC, IEA, and peer-reviewed science*
