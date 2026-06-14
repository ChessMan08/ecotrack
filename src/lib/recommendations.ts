/**
 * Recommendation Engine
 *
 * Generates deterministic, category-aware action suggestions
 * based on the user's current footprint breakdown.
 * AI is used separately for personalization and tone — this module
 * produces the structured data.
 */

import type { Action, EmissionCategory, FootprintSummary, LifestyleProfile } from "@/types";
import { nanoid } from "./utils";

export interface RecommendationRule {
  id: string;
  category: EmissionCategory;
  title: string;
  description: string;
  whyItMatters: string;
  estimatedKgCO2eSavedYearly: number;
  difficultyLevel: "easy" | "medium" | "hard";
  timeToAdopt: string;
  trigger: (profile: LifestyleProfile, summary: FootprintSummary) => boolean;
  sourceLabel: string;
}

// ── Rule library ──────────────────────────────────────────────────────────────

const RECOMMENDATION_RULES: RecommendationRule[] = [
  // ── Transportation ──────────────────────────────────────────────────────
  {
    id: "switch_to_ev",
    category: "transportation",
    title: "Switch to an electric vehicle",
    description: "Replace your petrol or diesel car with an electric vehicle. Modern EVs have a range of 300–500 km and can charge overnight.",
    whyItMatters: "Road transport is one of the largest personal emission sources. Switching from a typical petrol car to an EV can cut driving emissions by 60–80% depending on your grid.",
    estimatedKgCO2eSavedYearly: 1800,
    difficultyLevel: "hard",
    timeToAdopt: "3–12 months",
    trigger: (p) => p.vehicleType === "petrol" || p.vehicleType === "diesel",
    sourceLabel: "UK DESNZ 2023",
  },
  {
    id: "hybrid_upgrade",
    category: "transportation",
    title: "Switch to a hybrid vehicle",
    description: "If a full EV isn't feasible yet, a hybrid is a significant step that halves fuel consumption for city driving.",
    whyItMatters: "Hybrid cars emit roughly 40% less than equivalent petrol cars in mixed driving.",
    estimatedKgCO2eSavedYearly: 900,
    difficultyLevel: "hard",
    timeToAdopt: "3–12 months",
    trigger: (p) => p.vehicleType === "petrol" || p.vehicleType === "diesel",
    sourceLabel: "UK DESNZ 2023",
  },
  {
    id: "reduce_car_km",
    category: "transportation",
    title: "Reduce driving by 20% with active travel",
    description: "Replace short car trips (under 5 km) with cycling or walking. A bike or e-bike pays for itself quickly.",
    whyItMatters: "Trips under 5 km make up ~25% of car journeys but are easily done by bike. Cutting 20% of your driving saves roughly 400 kg CO₂e/year for an average driver.",
    estimatedKgCO2eSavedYearly: 400,
    difficultyLevel: "medium",
    timeToAdopt: "1 week",
    trigger: (p) => p.weeklyDrivingKm > 150,
    sourceLabel: "UK DESNZ 2023",
  },
  {
    id: "use_public_transport",
    category: "transportation",
    title: "Use public transport for commuting",
    description: "Switch your daily commute to bus, metro, or train at least 3 days a week.",
    whyItMatters: "Public transport emits 3–10× less per km than a single-occupancy petrol car. Commuting by bus instead of car for 200 working days saves ~600 kg CO₂e/year.",
    estimatedKgCO2eSavedYearly: 600,
    difficultyLevel: "medium",
    timeToAdopt: "1 week",
    trigger: (p) => p.weeklyDrivingKm > 100 && p.vehicleType !== "none",
    sourceLabel: "UK DESNZ 2023",
  },
  {
    id: "reduce_short_haul_flights",
    category: "transportation",
    title: "Replace one short-haul flight with train",
    description: "For trips under 700 km, a train journey produces ~80% less emissions than flying. Book early for the best fares.",
    whyItMatters: "A single return short-haul flight emits roughly 255 kg CO₂e — equal to 3 months of average home energy. Rail is almost always a viable alternative in Europe.",
    estimatedKgCO2eSavedYearly: 255,
    difficultyLevel: "medium",
    timeToAdopt: "Plan for next trip",
    trigger: (p) => p.flightFrequency !== "none",
    sourceLabel: "UK DESNZ 2023",
  },
  {
    id: "no_fly_year",
    category: "transportation",
    title: "Take a flight-free year",
    description: "Commit to not flying for 12 months. Explore destinations reachable by train, ferry, or coach.",
    whyItMatters: "Aviation is one of the most carbon-intensive activities. A long-haul return flight can emit more than a typical car produces in a year.",
    estimatedKgCO2eSavedYearly: 1620,
    difficultyLevel: "hard",
    timeToAdopt: "12 months",
    trigger: (p) => p.flightFrequency === "6-10" || p.flightFrequency === "10+",
    sourceLabel: "UK DESNZ 2023",
  },

  // ── Home Energy ─────────────────────────────────────────────────────────
  {
    id: "switch_green_energy",
    category: "home_energy",
    title: "Switch to a 100% renewable electricity tariff",
    description: "Contact your electricity supplier and switch to a tariff backed by renewable energy certificates. Takes about 10 minutes online.",
    whyItMatters: "Switching to certified green electricity can reduce your home electricity emissions by up to 80% depending on your country's grid mix.",
    estimatedKgCO2eSavedYearly: 800,
    difficultyLevel: "easy",
    timeToAdopt: "1 day",
    trigger: (p) => p.electricityGreenPercentage < 50,
    sourceLabel: "IEA 2023",
  },
  {
    id: "install_solar",
    category: "home_energy",
    title: "Install rooftop solar panels",
    description: "A 4 kWp solar installation can cover 50–70% of a typical home's electricity in most climates.",
    whyItMatters: "Solar PV has the fastest payback period of any household energy upgrade — typically 7–10 years, and 25+ year system lifespan.",
    estimatedKgCO2eSavedYearly: 1200,
    difficultyLevel: "hard",
    timeToAdopt: "1–3 months",
    trigger: (p) => p.homeType !== "apartment" && p.electricityGreenPercentage < 80,
    sourceLabel: "IEA PVPS 2023",
  },
  {
    id: "improve_insulation",
    category: "home_energy",
    title: "Improve home insulation",
    description: "Add loft insulation, cavity wall insulation, or double-glazing. Often subsidised by government programmes.",
    whyItMatters: "Poorly insulated homes can waste 25–35% of heating energy. Good insulation reduces heating bills and emissions year-round.",
    estimatedKgCO2eSavedYearly: 500,
    difficultyLevel: "hard",
    timeToAdopt: "1–3 months",
    trigger: (p) => p.heatingType === "natural_gas" || p.heatingType === "oil",
    sourceLabel: "UK EnergyEfficiencyHub 2023",
  },
  {
    id: "lower_thermostat",
    category: "home_energy",
    title: "Lower your thermostat by 1°C",
    description: "Turn your heating down by just one degree. Wear an extra layer instead.",
    whyItMatters: "Each 1°C reduction saves roughly 10% on heating bills and around 200 kg CO₂e/year for a gas-heated home.",
    estimatedKgCO2eSavedYearly: 200,
    difficultyLevel: "easy",
    timeToAdopt: "Immediate",
    trigger: (p) => p.heatingType === "natural_gas" || p.heatingType === "oil",
    sourceLabel: "UK Energy Saving Trust 2023",
  },
  {
    id: "switch_heat_pump",
    category: "home_energy",
    title: "Replace gas boiler with a heat pump",
    description: "A modern air-source heat pump is 3–4× more efficient than a gas boiler for space heating.",
    whyItMatters: "Heating is often the biggest home emission source. Heat pumps produce 3× less CO₂e than gas boilers on average grids.",
    estimatedKgCO2eSavedYearly: 1500,
    difficultyLevel: "hard",
    timeToAdopt: "3–6 months",
    trigger: (p) => p.heatingType === "natural_gas" || p.heatingType === "oil",
    sourceLabel: "UK DESNZ 2023",
  },
  {
    id: "led_appliances",
    category: "home_energy",
    title: "Replace all bulbs with LEDs and switch off standby",
    description: "LED bulbs use 75% less energy than incandescent. Switching off devices at the plug rather than standby can save 80–100 kWh/year.",
    whyItMatters: "Lighting and phantom loads can account for 10–15% of home electricity use. LEDs are cheap, last 20× longer, and pay back in months.",
    estimatedKgCO2eSavedYearly: 80,
    difficultyLevel: "easy",
    timeToAdopt: "1 day",
    trigger: () => true,
    sourceLabel: "US DOE 2023",
  },

  // ── Food ────────────────────────────────────────────────────────────────
  {
    id: "reduce_red_meat",
    category: "food",
    title: "Cut red meat to once a week or less",
    description: "Replace beef and lamb in weekday meals with chicken, fish, legumes, or plant-based alternatives.",
    whyItMatters: "Beef emits 60 kg CO₂e per kg — about 20× more than vegetables. Cutting red meat from 4 to 1 meal per week saves roughly 400 kg CO₂e/year.",
    estimatedKgCO2eSavedYearly: 400,
    difficultyLevel: "medium",
    timeToAdopt: "1 week",
    trigger: (p) => p.dietType === "omnivore" || p.dietType === "heavy_meat",
    sourceLabel: "Poore & Nemecek 2018",
  },
  {
    id: "go_flexitarian",
    category: "food",
    title: "Adopt a flexitarian diet",
    description: "Keep meat for weekends only and base weekday meals on vegetables, legumes, and grains.",
    whyItMatters: "Moving from an average omnivore diet to a flexitarian diet saves about 360 kg CO₂e/year per person (Scarborough et al. 2023).",
    estimatedKgCO2eSavedYearly: 360,
    difficultyLevel: "medium",
    timeToAdopt: "2–4 weeks",
    trigger: (p) => p.dietType === "omnivore" || p.dietType === "heavy_meat",
    sourceLabel: "Scarborough et al. 2023",
  },
  {
    id: "reduce_food_waste",
    category: "food",
    title: "Halve your food waste",
    description: "Plan meals, freeze leftovers, and buy only what you need. Use apps like Olio or Too Good To Go to share surplus.",
    whyItMatters: "If food waste were a country it would be the world's third-largest emitter. Halving household food waste saves up to 150 kg CO₂e/year.",
    estimatedKgCO2eSavedYearly: 150,
    difficultyLevel: "easy",
    timeToAdopt: "1 week",
    trigger: (p) => p.foodWasteLevel === "high" || p.foodWasteLevel === "medium",
    sourceLabel: "FAO 2022",
  },

  // ── Waste ───────────────────────────────────────────────────────────────
  {
    id: "recycle_all",
    category: "waste",
    title: "Recycle all eligible materials",
    description: "Sort and recycle paper, cardboard, glass, metal, and plastic. Check your local scheme for accepted materials.",
    whyItMatters: "Recycling diverts waste from landfill where it generates methane — a potent greenhouse gas. Recycling all eligible household waste saves 150–200 kg CO₂e/year.",
    estimatedKgCO2eSavedYearly: 180,
    difficultyLevel: "easy",
    timeToAdopt: "Immediate",
    trigger: (p) => p.recyclingLevel === "none" || p.recyclingLevel === "some",
    sourceLabel: "EPA WARM 2023",
  },
  {
    id: "start_composting",
    category: "waste",
    title: "Start composting food scraps",
    description: "Set up a kitchen caddy and outdoor compost bin or find a local food-waste collection service.",
    whyItMatters: "Food waste in landfill generates methane — a gas 80× more potent than CO₂ over 20 years. Composting eliminates these landfill methane emissions.",
    estimatedKgCO2eSavedYearly: 120,
    difficultyLevel: "easy",
    timeToAdopt: "1 week",
    trigger: () => true,
    sourceLabel: "EPA WARM 2023",
  },

  // ── Purchases ───────────────────────────────────────────────────────────
  {
    id: "buy_less_clothes",
    category: "purchases",
    title: "Buy half as many new clothes",
    description: "Adopt a 'cost-per-wear' mindset. Repair, swap, or buy second-hand instead of buying new.",
    whyItMatters: "The fashion industry accounts for ~10% of global CO₂ emissions. Halving new clothing purchases saves roughly 300 kg CO₂e/year for an average shopper.",
    estimatedKgCO2eSavedYearly: 300,
    difficultyLevel: "medium",
    timeToAdopt: "Ongoing",
    trigger: (p) => p.shoppingFrequency === "frequent" || p.shoppingFrequency === "average",
    sourceLabel: "USEEIO v2.0",
  },
  {
    id: "electronics_longevity",
    category: "purchases",
    title: "Keep electronics 2 years longer",
    description: "Repair rather than replace devices. Extend the life of your smartphone, laptop, and appliances.",
    whyItMatters: "Manufacturing a new smartphone emits ~70 kg CO₂e — 80% of its lifetime footprint. Using a phone for 4 years instead of 2 halves that impact.",
    estimatedKgCO2eSavedYearly: 200,
    difficultyLevel: "medium",
    timeToAdopt: "Ongoing",
    trigger: (p) => p.shoppingFrequency !== "minimal",
    sourceLabel: "USEEIO v2.0",
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

export function generateRecommendations(
  profile: LifestyleProfile,
  summary: FootprintSummary,
  uid: string,
  maxSuggestions = 8,
): Omit<Action, "status" | "completedAt">[] {
  const applicable = RECOMMENDATION_RULES.filter((rule) =>
    rule.trigger(profile, summary)
  );

  // Sort by potential savings descending, then by difficulty (easier first)
  const sorted = applicable.sort((a, b) => {
    const savingsDiff = b.estimatedKgCO2eSavedYearly - a.estimatedKgCO2eSavedYearly;
    if (Math.abs(savingsDiff) > 100) return savingsDiff;
    const diffMap = { easy: 0, medium: 1, hard: 2 };
    return diffMap[a.difficultyLevel] - diffMap[b.difficultyLevel];
  });

  return sorted.slice(0, maxSuggestions).map((rule) => ({
    id: `${rule.id}_${nanoid(6)}`,   // Preserve rule id as prefix for deduplication + testing
    uid,
    category: rule.category,
    title: rule.title,
    description: rule.description,
    whyItMatters: rule.whyItMatters,
    estimatedKgCO2eSaved: rule.estimatedKgCO2eSavedYearly,
    difficultyLevel: rule.difficultyLevel,
    timeToAdopt: rule.timeToAdopt,
    createdAt: new Date().toISOString(),
    aiGenerated: false,
    sourceLabel: rule.sourceLabel,
  }));
}

export function getTopCategoryByEmissions(
  summary: FootprintSummary,
): string {
  if (!summary.categories.length) return "transportation";
  const top = [...summary.categories].sort((a, b) => b.kgCO2e - a.kgCO2e)[0];
  return top.category;
}

export function getDifficultyLabel(level: "easy" | "medium" | "hard"): string {
  return { easy: "Quick win", medium: "Worth the effort", hard: "Big impact" }[level];
}

export function getDifficultyColor(level: "easy" | "medium" | "hard"): string {
  return {
    easy: "#22c55e",
    medium: "#eab308",
    hard: "#f97316",
  }[level];
}
