# 🌿 Ecotrack — Carbon Footprint Awareness Platform

> **Track, understand, and reduce your personal carbon footprint** with science-backed calculations and personalized AI insights powered by Google Gemini.

---

## Vertical

**Climate tech / individual sustainability** — specifically, personal carbon footprint tracking and behavior change. The app sits at the intersection of consumer climate awareness tools (like carbon calculators) and habit-tracking apps, combining the rigor of an emissions calculator with the engagement of a goals-and-streaks product.

The target user is a non-expert individual who wants to understand their environmental impact without needing to interpret spreadsheets, IPCC reports, or jargon-heavy sustainability content.

---

## Approach & Logic

The guiding principle behind every design decision: **AI explains, it never calculates.**

Carbon footprint numbers carry real weight — people use them to make decisions, compare themselves to others, and set goals. If an AI model hallucinates an emission factor or invents a comparison statistic, the user has no way to know. So the architecture draws a hard line:

1. **All emission numbers come from deterministic TypeScript functions** (`src/lib/calculator.ts`) using published, cited emission factors (`src/lib/emission-factors.ts`). These are pure functions — same input always produces the same output, and every formula is unit tested.

2. **Gemini AI is used only for language** — turning a structured `FootprintSummary` object into a warm, plain-language explanation, a weekly coaching tip, or a conversational answer. Every AI prompt is built server-side and explicitly instructed to use *only* the numbers provided in the prompt, never to fabricate statistics, and to label any assumptions clearly.

3. **The recommendation engine is rule-based, not AI-generated.** A library of 16 rules with trigger conditions (e.g. "if vehicleType is petrol or diesel → suggest EV/hybrid") produces the action list. This guarantees an EV owner never sees "switch to an EV," and a vegan never sees "eat less meat." AI is reserved for framing *why* an action matters in a supportive tone — not for deciding *which* actions to suggest.

4. **Transparency over polish.** Every calculated value in the UI can be expanded to show its source citation and the assumptions used (e.g. "No gas usage entered — gas emissions assumed zero"). The goal is a tool the user can trust and verify, not a black box.

---

## How the Solution Works

**End-to-end flow:**

1. **Onboarding** — a 5-step questionnaire collects lifestyle data (location, home energy, transport, diet, waste/shopping habits). Every question is skippable and falls back to a sensible default, so the app is useful even with minimal input.

2. **Calculation** — the lifestyle profile is passed to `calculateFullFootprint()`, which runs five independent calculators (home energy, transportation, food, waste, purchases), each returning a yearly kg CO₂e value plus a list of assumptions made. These are combined into a `FootprintSummary` with category breakdowns, percentages, and benchmark comparisons (global average, national average, 1.5°C target).

3. **Dashboard** — the summary renders as cards, a category breakdown chart, and a trend chart (Recharts). This is the "awareness" layer — the user sees exactly where their emissions come from and how they compare.

4. **AI insight (Gemini)** — the `FootprintSummary` and lifestyle profile are sent to a server-side API route (`/api/ai/summary`), which builds a prompt embedding the real numbers and grounding instructions, then calls Gemini 1.5 Flash. The response — a 3-4 sentence plain-language summary — is displayed with an "AI-generated" label.

5. **Action plan** — the same summary is run through the recommendation engine (`generateRecommendations()`), which filters the 16-rule library against the user's profile and sorts by estimated impact. Each suggested action shows estimated savings, difficulty, time to adopt, and a source citation. Users can mark actions as planned/done/dismissed, which persists to Firestore.

6. **Goals** — users set a reduction target (percentage-based or custom) for any category or their overall footprint. Progress is tracked against a baseline snapshot taken when the goal was created.

7. **Chat assistant** — a full conversational interface (`/api/ai/chat`) where Gemini answers questions about the user's footprint, grounded in the same `FootprintSummary` data, with multi-turn conversation history.

8. **Education hub & export** — static learning content (CO₂e explained, common myths, category deep-dives) plus CSV/HTML report export of the user's current footprint.

**Data persistence**: Firebase Authentication handles sign-in (email/password + Google); Firestore stores per-user profiles, emission entries, goals, and actions under `users/{uid}/...` with security rules enforcing strict ownership.

---

## Assumptions & Limitations

1. **Spend-based purchases**: The purchases category uses sector-level emission intensities (USEEIO v2.0) applied to estimated monthly spend, not product-level lifecycle data. This is standard for individual footprint calculators but less precise than full product LCA.

2. **Flight radiative forcing**: Flight emissions use a 1× CO₂ multiplier. The actual climate impact at altitude is estimated to be 2-4× higher due to non-CO₂ effects (contrails, NOx), but this is not yet standard practice in consumer-facing calculators, so it's omitted for simplicity.

3. **Household vs. per-person figures**: Food and waste scale with household size (entered during onboarding). Home energy is calculated as a household total and divided by household size for per-person comparisons.

4. **Currency assumption**: Purchase spend inputs are assumed to be in USD. Users in other currencies should mentally convert at current exchange rates — this is noted in the UI.

5. **Grid intensity is country-level**: Electricity emission factors use national grid averages (e.g. one figure for the entire US). Regional variation (e.g. a coal-heavy state vs. a hydro-heavy state) is not modeled.

6. **Defaults for missing data**: Where a user skips an input, the calculator substitutes a documented default (e.g. average household waste of 7 kg/person/week) and flags this explicitly as an assumption in the UI rather than silently guessing.

7. **AI grounding is prompt-based, not hard-enforced**: Gemini is instructed not to fabricate numbers, and prompts only include verified data — but like any LLM, it could theoretically still produce an unexpected response. All AI output is visually labeled so users know which parts of the app are AI-generated vs. calculated.

8. **No embodied/lifecycle emissions for durable goods**: The calculator covers operational/direct emissions (energy use, fuel burned, food consumed, waste generated). It does not include the embodied carbon of, for example, the car itself or the building structure — only its ongoing use.

---

## Quick Start

```bash
git clone https://github.com/your-org/ecotrack.git
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

*Built for the PromptWars Challenge · Emission factors from EPA, IPCC, IEA, and peer-reviewed science*
