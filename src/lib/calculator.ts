/**
 * Emissions Calculator
 *
 * Pure deterministic calculations — no AI, no side effects.
 * All values in kg CO2e. Unit-tested independently.
 *
 * Methodology:
 *  - Home Energy: activity-based (kWh × grid factor + gas × combustion factor)
 *  - Transport: distance-based (km × vehicle factor)
 *  - Food: diet-type baseline adjusted for local food % and waste
 *  - Waste: weight-based (kg × disposal method factors)
 *  - Purchases: spend-based (USD × USEEIO sector factor)
 */

import {
  GRID_INTENSITY,
  NATURAL_GAS_FACTOR,
  VEHICLE_FACTORS,
  TRANSPORT_FACTORS,
  DIET_ANNUAL_KG_CO2E,
  WASTE_FACTORS,
  AVG_WEEKLY_WASTE_KG_PER_PERSON,
  PURCHASE_SPEND_FACTORS,
  BENCHMARKS,
} from "./emission-factors";

import type {
  HomeEnergyInput,
  TransportInput,
  FoodInput,
  WasteInput,
  PurchasesInput,
  FootprintSummary,
  CategorySummary,
  EmissionCategory,
  LifestyleProfile,
} from "@/types";

// ── Period converters ─────────────────────────────────────────────────────────

export function toMonthly(yearlyKg: number): number {
  return yearlyKg / 12;
}

export function toWeekly(yearlyKg: number): number {
  return yearlyKg / 52;
}

export function toYearly(monthlyKg: number): number {
  return monthlyKg * 12;
}

// ── Home Energy ───────────────────────────────────────────────────────────────

export interface HomeEnergyResult {
  totalKgCO2eMonthly: number;
  electricityKgCO2e: number;
  gasKgCO2e: number;
  perPersonMonthly: number;
  assumptions: string[];
  emissionFactorSource: string;
}

export function calculateHomeEnergy(input: HomeEnergyInput): HomeEnergyResult {
  const assumptions: string[] = [];
  const gridFactor = GRID_INTENSITY[input.location]?.value ?? GRID_INTENSITY.GLOBAL.value;
  const gridSource = GRID_INTENSITY[input.location]?.source ?? GRID_INTENSITY.GLOBAL.source;

  if (!GRID_INTENSITY[input.location]) {
    assumptions.push(`No grid data for ${input.location} — using global average (${GRID_INTENSITY.GLOBAL.value} kg CO2e/kWh)`);
  }

  // Electricity: apply green energy discount
  const greenFraction = Math.min(input.greenEnergyPercent, 100) / 100;
  const effectiveGridFactor = gridFactor * (1 - greenFraction);
  const electricityKgCO2e = input.monthlyElectricityKwh * effectiveGridFactor;

  if (input.greenEnergyPercent > 0) {
    assumptions.push(`${input.greenEnergyPercent}% green energy tariff applied — grid emissions reduced proportionally`);
  }

  // Gas
  let gasKgCO2e = 0;
  if (input.monthlyGasM3 && input.monthlyGasM3 > 0) {
    gasKgCO2e = input.monthlyGasM3 * NATURAL_GAS_FACTOR.value;
  } else if (input.monthlyGasKwh && input.monthlyGasKwh > 0) {
    gasKgCO2e = input.monthlyGasKwh * 0.203; // UK DESNZ factor
    assumptions.push("Gas converted from kWh using 0.203 kg CO2e/kWh (UK DESNZ 2023)");
  } else {
    assumptions.push("No gas usage entered — gas emissions assumed zero");
  }

  const totalKgCO2eMonthly = electricityKgCO2e + gasKgCO2e;
  const perPersonMonthly = totalKgCO2eMonthly / Math.max(input.householdSize, 1);

  return {
    totalKgCO2eMonthly,
    electricityKgCO2e,
    gasKgCO2e,
    perPersonMonthly,
    assumptions,
    emissionFactorSource: gridSource,
  };
}

// ── Transport ─────────────────────────────────────────────────────────────────

export interface TransportResult {
  totalKgCO2eYearly: number;
  carKgCO2e: number;
  publicTransportKgCO2e: number;
  flightsKgCO2e: number;
  motorbikeKgCO2e: number;
  assumptions: string[];
}

export function calculateTransport(input: TransportInput): TransportResult {
  const assumptions: string[] = [];

  // Car
  const vehicleFactor = VEHICLE_FACTORS[input.vehicleType]?.value ?? 0;
  const carKgCO2eWeekly = input.weeklyCarKm * vehicleFactor;
  const carKgCO2e = carKgCO2eWeekly * 52;

  if (input.vehicleType === "electric") {
    assumptions.push("EV emissions use UK average grid intensity — actual emissions vary by grid");
  }

  // Public transport (mix of bus + rail)
  // Use average of bus + metro factor
  const ptFactor = (TRANSPORT_FACTORS.publicBus.value + TRANSPORT_FACTORS.metroRail.value) / 2;
  const publicTransportKgCO2e = input.weeklyPublicTransportKm * ptFactor * 52;

  // Flights (annual totals)
  const flightsKgCO2e =
    input.weeklyFlightsShortHaul * TRANSPORT_FACTORS.shortHaulFlight.value +
    input.weeklyFlightsLongHaul * TRANSPORT_FACTORS.longHaulFlight.value;

  if (flightsKgCO2e > 0) {
    assumptions.push("Flight emissions include radiative forcing multiplier (1×) — total climate impact may be higher");
  }

  // Motorbike
  const motorbikeKgCO2e = input.weeklyMotorbikeKm * TRANSPORT_FACTORS.motorbike.value * 52;

  const totalKgCO2eYearly =
    carKgCO2e + publicTransportKgCO2e + flightsKgCO2e + motorbikeKgCO2e;

  return {
    totalKgCO2eYearly,
    carKgCO2e,
    publicTransportKgCO2e,
    flightsKgCO2e,
    motorbikeKgCO2e,
    assumptions,
  };
}

// ── Food ──────────────────────────────────────────────────────────────────────

export interface FoodResult {
  totalKgCO2eYearly: number;
  baselineKgCO2e: number;
  localFoodSaving: number;
  wastePenalty: number;
  perPersonYearly: number;
  assumptions: string[];
  dietSource: string;
}

export function calculateFood(input: FoodInput): FoodResult {
  const assumptions: string[] = [];
  const dietData = DIET_ANNUAL_KG_CO2E[input.dietType];
  const baselineKgCO2e = dietData.value * input.householdSize;

  // Local food discount: up to 10% reduction for 100% local
  const localFoodFraction = Math.min(input.localFoodPercent, 100) / 100;
  const localFoodSaving = baselineKgCO2e * localFoodFraction * 0.10;

  // Food waste: +15% for high waste, 0% for low waste
  const wasteFactor = input.foodWastePercent / 100;
  const wastePenalty = baselineKgCO2e * wasteFactor * 0.15;

  if (input.foodWastePercent > 30) {
    assumptions.push("High food waste increases emissions — wasted food accounts for ~8% of global GHG");
  }

  if (localFoodFraction > 0) {
    assumptions.push(`Local food reduces transport emissions by up to 10% (Poore & Nemecek 2018)`);
  }

  const totalKgCO2eYearly = baselineKgCO2e - localFoodSaving + wastePenalty;
  const perPersonYearly = totalKgCO2eYearly / Math.max(input.householdSize, 1);

  return {
    totalKgCO2eYearly,
    baselineKgCO2e,
    localFoodSaving,
    wastePenalty,
    perPersonYearly,
    assumptions,
    dietSource: dietData.source,
  };
}

// ── Waste ─────────────────────────────────────────────────────────────────────

export interface WasteResult {
  totalKgCO2eYearly: number;
  landfillKgCO2e: number;
  recycledKgCO2e: number;
  compostedKgCO2e: number;
  assumptions: string[];
}

export function calculateWaste(input: WasteInput): WasteResult {
  const assumptions: string[] = [];
  const weeklyWaste = input.weeklyWasteKg > 0
    ? input.weeklyWasteKg
    : AVG_WEEKLY_WASTE_KG_PER_PERSON * input.householdSize;

  if (!(input.weeklyWasteKg > 0)) {
    assumptions.push(`No waste entered — using global average of ${AVG_WEEKLY_WASTE_KG_PER_PERSON} kg/person/week`);
  }

  const yearlyWaste = weeklyWaste * 52;
  const recyclingFrac = Math.min(input.recyclingPercent, 100) / 100;
  const compostFrac = Math.min(input.compostingPercent, 100) / 100;
  const landfillFrac = Math.max(1 - recyclingFrac - compostFrac, 0);

  const landfillKgCO2e = yearlyWaste * landfillFrac * WASTE_FACTORS.landfill.value;
  const recycledKgCO2e = yearlyWaste * recyclingFrac * WASTE_FACTORS.recycled.value;
  const compostedKgCO2e = yearlyWaste * compostFrac * WASTE_FACTORS.composted.value;

  const totalKgCO2eYearly = landfillKgCO2e + recycledKgCO2e + compostedKgCO2e;

  return {
    totalKgCO2eYearly,
    landfillKgCO2e,
    recycledKgCO2e,
    compostedKgCO2e,
    assumptions,
  };
}

// ── Purchases ─────────────────────────────────────────────────────────────────

export interface PurchasesResult {
  totalKgCO2eYearly: number;
  clothingKgCO2e: number;
  electronicsKgCO2e: number;
  otherKgCO2e: number;
  assumptions: string[];
}

export function calculatePurchases(input: PurchasesInput): PurchasesResult {
  const assumptions: string[] = [
    "Spend-based approach using USEEIO v2.0 (EPA) sector-level emission intensities",
    "Assumes USD — other currencies should be converted at current exchange rate",
  ];

  const clothingKgCO2e = input.monthlySpendClothing * PURCHASE_SPEND_FACTORS.clothing.value * 12;
  const electronicsKgCO2e = input.monthlySpendElectronics * PURCHASE_SPEND_FACTORS.electronics.value * 12;
  const otherKgCO2e = input.monthlySpendOther * PURCHASE_SPEND_FACTORS.general.value * 12;

  const totalKgCO2eYearly = clothingKgCO2e + electronicsKgCO2e + otherKgCO2e;

  return {
    totalKgCO2eYearly,
    clothingKgCO2e,
    electronicsKgCO2e,
    otherKgCO2e,
    assumptions,
  };
}

// ── Full footprint from lifestyle profile ─────────────────────────────────────

export interface FullFootprintResult {
  totalKgCO2eYearly: number;
  categories: Record<EmissionCategory, number>;
  assumptions: string[];
  sources: string[];
}

export function calculateFullFootprint(profile: LifestyleProfile): FullFootprintResult {
  const allAssumptions: string[] = [];
  const sources: string[] = [
    "EPA GHG Emission Factors Hub 2024",
    "IEA World Energy Outlook 2023",
    "Scarborough et al. 2023 (Nature Food)",
    "Poore & Nemecek 2018 (Science)",
    "UK DESNZ 2023",
    "EPA WARM Model 2023",
    "USEEIO v2.0",
  ];

  // Home Energy
  const homeResult = calculateHomeEnergy({
    monthlyElectricityKwh: estimateElectricityKwh(profile),
    heatingType: profile.heatingType,
    greenEnergyPercent: profile.electricityGreenPercentage,
    householdSize: profile.householdSize,
    location: profile.location,
  });
  allAssumptions.push(...homeResult.assumptions);

  // Transport
  const flightCounts = parseFlightFrequency(profile.flightFrequency);
  const transportResult = calculateTransport({
    weeklyCarKm: profile.weeklyDrivingKm,
    vehicleType: profile.vehicleType,
    weeklyPublicTransportKm: 0,
    weeklyFlightsShortHaul: flightCounts.short,
    weeklyFlightsLongHaul: flightCounts.long,
    weeklyMotorbikeKm: 0,
  });
  allAssumptions.push(...transportResult.assumptions);

  // Food
  const foodResult = calculateFood({
    dietType: profile.dietType,
    householdSize: profile.householdSize,
    localFoodPercent: profile.localFoodPercentage,
    foodWastePercent: profile.foodWasteLevel === "high" ? 35 : profile.foodWasteLevel === "medium" ? 20 : 8,
    weeklyMeatMeals: 0,
    weeklyDairyServings: 0,
  });
  allAssumptions.push(...foodResult.assumptions);

  // Waste
  const wasteResult = calculateWaste({
    weeklyWasteKg: AVG_WEEKLY_WASTE_KG_PER_PERSON * profile.householdSize,
    recyclingPercent: profile.recyclingLevel === "all" ? 80 : profile.recyclingLevel === "most" ? 60 : profile.recyclingLevel === "some" ? 30 : 5,
    compostingPercent: 0,
    householdSize: profile.householdSize,
  });
  allAssumptions.push(...wasteResult.assumptions);

  // Purchases
  const purchasesResult = calculatePurchases({
    monthlySpendClothing: profile.shoppingFrequency === "frequent" ? 150 : profile.shoppingFrequency === "average" ? 80 : 30,
    monthlySpendElectronics: profile.shoppingFrequency === "frequent" ? 100 : profile.shoppingFrequency === "average" ? 40 : 15,
    monthlySpendOther: profile.shoppingFrequency === "frequent" ? 200 : profile.shoppingFrequency === "average" ? 100 : 40,
    currency: "USD",
  });
  allAssumptions.push(...purchasesResult.assumptions);

  const homeYearly = toYearly(homeResult.totalKgCO2eMonthly);
  const categories: Record<EmissionCategory, number> = {
    home_energy: homeYearly,
    transportation: transportResult.totalKgCO2eYearly,
    food: foodResult.totalKgCO2eYearly,
    waste: wasteResult.totalKgCO2eYearly,
    purchases: purchasesResult.totalKgCO2eYearly,
  };

  const totalKgCO2eYearly = Object.values(categories).reduce((a, b) => a + b, 0);

  return {
    totalKgCO2eYearly,
    categories,
    assumptions: [...new Set(allAssumptions)],
    sources,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function estimateElectricityKwh(profile: LifestyleProfile): number {
  // UK average ~3,200 kWh/yr per household; US ~10,500; scale by household size
  const base = profile.location === "US" ? 875 : 267; // monthly per household
  return base * Math.min(profile.householdSize, 5) / 2.5;
}

function parseFlightFrequency(freq: string): { short: number; long: number } {
  switch (freq) {
    case "none": return { short: 0, long: 0 };
    case "1-2": return { short: 1.5, long: 0.5 };
    case "3-5": return { short: 3, long: 1.5 };
    case "6-10": return { short: 5, long: 3 };
    case "10+": return { short: 7, long: 5 };
    default: return { short: 0, long: 0 };
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatKgCO2e(kg: number, precision = 1): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(precision)} t CO₂e`;
  }
  return `${kg.toFixed(precision)} kg CO₂e`;
}

export function getEmissionRating(yearlyKg: number): {
  label: string;
  color: string;
  description: string;
} {
  if (yearlyKg < 2000) {
    return { label: "Excellent", color: "#22c55e", description: "Below the 1.5°C compatible target" };
  } else if (yearlyKg < 5000) {
    return { label: "Good", color: "#84cc16", description: "Below the global average" };
  } else if (yearlyKg < 10000) {
    return { label: "Average", color: "#eab308", description: "Around the global average" };
  } else if (yearlyKg < 15000) {
    return { label: "High", color: "#f97316", description: "Above average for developed countries" };
  } else {
    return { label: "Very High", color: "#ef4444", description: "Significantly above global average" };
  }
}

// Module-level constants — avoids re-creating objects on every call
const CATEGORY_LABELS: Record<EmissionCategory, string> = {
  home_energy: "Home Energy",
  transportation: "Transportation",
  food: "Food & Diet",
  waste: "Waste",
  purchases: "Purchases",
};

const CATEGORY_COLORS: Record<EmissionCategory, string> = {
  home_energy: "#f97316",
  transportation: "#3b82f6",
  food: "#22c55e",
  waste: "#a855f7",
  purchases: "#ec4899",
};

const CATEGORY_ICONS: Record<EmissionCategory, string> = {
  home_energy: "🏠",
  transportation: "🚗",
  food: "🥗",
  waste: "♻️",
  purchases: "🛍️",
};

export function getCategoryLabel(category: EmissionCategory): string {
  return CATEGORY_LABELS[category];
}

export function getCategoryColor(category: EmissionCategory): string {
  return CATEGORY_COLORS[category];
}

export function getCategoryIcon(category: EmissionCategory): string {
  return CATEGORY_ICONS[category];
}

// ── Build FootprintSummary from FullFootprintResult ───────────────────────────

export function buildFootprintSummary(
  result: FullFootprintResult,
  nationalAvgKgPerYear = 10000,
): FootprintSummary {
  const total = result.totalKgCO2eYearly;
  const categories: CategorySummary[] = (
    Object.entries(result.categories) as [EmissionCategory, number][]
  ).map(([cat, kg]) => ({
    category: cat,
    label: getCategoryLabel(cat),
    kgCO2e: kg,
    percentage: total > 0 ? (kg / total) * 100 : 0,
    trend: 0,
    color: getCategoryColor(cat),
    icon: getCategoryIcon(cat),
  }));

  return {
    totalKgCO2e: total,
    period: "yearly",
    categories,
    vsGlobalAverage: ((total - BENCHMARKS.globalAvgKgCO2ePerYear) / BENCHMARKS.globalAvgKgCO2ePerYear) * 100,
    vsNationalAverage: ((total - nationalAvgKgPerYear) / nationalAvgKgPerYear) * 100,
    comparisonLabel: `${formatKgCO2e(total)} per year`,
    generatedAt: new Date().toISOString(),
  };
}
