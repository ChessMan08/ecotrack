/**
 * Demo Seed Data
 */

import type {
  UserProfile,
  EmissionEntry,
  Goal,
  Action,
  AIInsight,
} from "../src/types";

// ── Sample User Profile ───────────────────────────────────────────────────────

export const DEMO_USER_PROFILE: Omit<UserProfile, "uid"> = {
  email: "demo@ecotrack.app",
  displayName: "Alex Demo",
  onboardingComplete: true,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  lifestyle: {
    location: "US",
    householdSize: 2,
    homeType: "apartment",
    heatingType: "natural_gas",
    electricityGreenPercentage: 20,
    homeSizeM2: 80,
    vehicleType: "petrol",
    weeklyDrivingKm: 180,
    flightFrequency: "1-2",
    dietType: "flexitarian",
    localFoodPercentage: 30,
    foodWasteLevel: "medium",
    recyclingLevel: "most",
    shoppingFrequency: "average",
  },
  preferences: {
    theme: "system",
    defaultPeriod: "yearly",
    weeklyReminders: true,
    currency: "USD",
    units: "metric",
  },
};

// ── Sample Emission Entries ───────────────────────────────────────────────────
// Covering the last 6 months — realistic monthly variations

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

export const DEMO_EMISSION_ENTRIES: Omit<EmissionEntry, "id" | "uid">[] = [
  // Month 1 (most recent)
  {
    category: "home_energy",
    subcategory: "electricity",
    kgCO2e: 134.4,
    label: "Home energy — January",
    inputData: { monthlyElectricityKwh: 348, monthlyGasM3: 42, greenEnergyPercent: 20 },
    calculationNote: "US grid 0.386 kg/kWh × 348 kWh × 0.8 green discount + gas 42m³ × 2.04",
    date: daysAgo(5),
    period: "monthly",
    isEstimated: false,
    emissionFactor: "EPA eGRID 2023 + EPA GHG Hub 2024",
  },
  {
    category: "transportation",
    subcategory: "car",
    kgCO2e: 1437.1,
    label: "Transport — yearly estimate",
    inputData: { weeklyCarKm: 180, vehicleType: "petrol", shortHaulFlights: 1.5, longHaulFlights: 0.5 },
    calculationNote: "180km × 0.192 × 52 + 1.5 × 255 + 0.5 × 1620",
    date: daysAgo(5),
    period: "yearly",
    isEstimated: true,
    emissionFactor: "UK DESNZ 2023",
  },
  {
    category: "food",
    subcategory: "diet",
    kgCO2e: 1639.5,
    label: "Food & diet — yearly (flexitarian)",
    inputData: { dietType: "flexitarian", householdSize: 2, localFoodPercent: 30, foodWastePercent: 20 },
    calculationNote: "Scarborough et al. 2023: 1690kg/yr/person × 2 − local saving + waste penalty",
    date: daysAgo(5),
    period: "yearly",
    isEstimated: true,
    emissionFactor: "Scarborough et al. 2023 (Nature Food)",
  },
  {
    category: "waste",
    subcategory: "household_waste",
    kgCO2e: 457.1,
    label: "Waste — yearly estimate",
    inputData: { weeklyWasteKg: 14, recyclingPercent: 60, compostingPercent: 10, householdSize: 2 },
    calculationNote: "14kg/wk × 52 × (0.3 landfill × 0.467 + 0.6 recycle × 0.021 + 0.1 compost × 0.08)",
    date: daysAgo(5),
    period: "yearly",
    isEstimated: true,
    emissionFactor: "EPA WARM Model 2023",
  },
  {
    category: "purchases",
    subcategory: "consumer_goods",
    kgCO2e: 726.0,
    label: "Purchases — yearly estimate",
    inputData: { monthlyClothing: 80, monthlyElectronics: 40, monthlyOther: 100 },
    calculationNote: "Spend-based: clothing×0.5 + electronics×0.3 + other×0.25 × 12 months",
    date: daysAgo(5),
    period: "yearly",
    isEstimated: true,
    emissionFactor: "USEEIO v2.0 (EPA)",
  },
];

// ── Sample Goals ──────────────────────────────────────────────────────────────

export const DEMO_GOALS: Omit<Goal, "id" | "uid">[] = [
  {
    title: "Reduce transport emissions by 15%",
    description: "Use public transport more and reduce unnecessary car trips",
    category: "transportation",
    targetKgCO2e: 1221.5,
    currentKgCO2e: 1380.0,
    baselineKgCO2e: 1437.1,
    period: "yearly",
    startDate: daysAgo(25),
    status: "active",
    createdAt: daysAgo(25),
    progressPercent: 25,
  },
  {
    title: "Switch to a green energy tariff",
    description: "Contact supplier and switch to 100% renewable electricity",
    category: "home_energy",
    targetKgCO2e: 80.0,
    currentKgCO2e: 120.0,
    baselineKgCO2e: 134.4,
    period: "monthly",
    startDate: daysAgo(12),
    status: "active",
    createdAt: daysAgo(12),
    progressPercent: 40,
  },
];

// ── Sample Actions ────────────────────────────────────────────────────────────

export const DEMO_ACTIONS: Omit<Action, "id" | "uid">[] = [
  {
    category: "transportation",
    title: "Use public transport for commuting",
    description: "Switch daily commute to bus or metro at least 3 days a week",
    whyItMatters: "Public transport emits 3–10× less per km than a single-occupancy petrol car.",
    estimatedKgCO2eSaved: 600,
    difficultyLevel: "medium",
    timeToAdopt: "1 week",
    status: "planned",
    createdAt: daysAgo(20),
    completedAt: undefined,
    aiGenerated: false,
    sourceLabel: "UK DESNZ 2023",
  },
  {
    category: "home_energy",
    title: "Switch to a 100% renewable electricity tariff",
    description: "Contact your electricity supplier and switch to a tariff backed by renewables",
    whyItMatters: "Switching to certified green electricity can reduce home electricity emissions by up to 80%.",
    estimatedKgCO2eSaved: 800,
    difficultyLevel: "easy",
    timeToAdopt: "1 day",
    status: "done",
    createdAt: daysAgo(18),
    completedAt: daysAgo(10),
    aiGenerated: false,
    sourceLabel: "IEA 2023",
  },
  {
    category: "food",
    title: "Halve your food waste",
    description: "Plan meals, freeze leftovers, and buy only what you need",
    whyItMatters: "Halving household food waste saves up to 150 kg CO₂e/year.",
    estimatedKgCO2eSaved: 150,
    difficultyLevel: "easy",
    timeToAdopt: "1 week",
    status: "suggested",
    createdAt: daysAgo(5),
    completedAt: undefined,
    aiGenerated: false,
    sourceLabel: "FAO 2022",
  },
  {
    category: "transportation",
    title: "Replace one short-haul flight with train",
    description: "For trips under 700 km, a train produces ~80% less emissions",
    whyItMatters: "A return short-haul flight emits roughly 255 kg CO₂e — equal to 3 months of home energy.",
    estimatedKgCO2eSaved: 255,
    difficultyLevel: "medium",
    timeToAdopt: "Plan for next trip",
    status: "suggested",
    createdAt: daysAgo(5),
    completedAt: undefined,
    aiGenerated: false,
    sourceLabel: "UK DESNZ 2023",
  },
];

// ── Sample AI Insight ─────────────────────────────────────────────────────────

export const DEMO_AI_INSIGHT: Omit<AIInsight, "id" | "uid"> = {
  type: "summary",
  content:
    "Your annual footprint of around 4.4 tonnes CO₂e is well below the US average of 17.6 tonnes — great progress! Your flexitarian diet and recycling habits are making a real difference. The biggest opportunity ahead is your transport: reducing car trips and potentially skipping one flight this year could cut another 800 kg from your footprint.",
  generatedAt: daysAgo(5),
};

// ── Aggregate summary for documentation ──────────────────────────────────────

export const DEMO_FOOTPRINT_SUMMARY = {
  totalKgCO2e: 4394.1,
  breakdown: {
    home_energy: 1612.8,   // 12 months
    transportation: 1437.1,
    food: 1639.5,          // household (÷2 per person = 820)
    waste: 457.1,
    purchases: 726.0,
  },
  vsGlobalAverage: -33.4,  // 33% below 6600 kg global avg
  vsUSAverage: -75.0,      // 75% below 17600 kg US avg
  sources: [
    "EPA eGRID 2023",
    "EPA GHG Emission Factors Hub 2024",
    "UK DESNZ 2023",
    "Scarborough et al. 2023 (Nature Food)",
    "Poore & Nemecek 2018 (Science)",
    "EPA WARM Model 2023",
    "USEEIO v2.0",
    "IEA World Energy Outlook 2023",
  ],
};
