/**
 * Local Insights — Deterministic fallback summaries and tips.
 *
 * These pure functions generate useful, human-readable text from the user's
 * footprint data without any AI dependency. They serve as fallbacks when
 * Gemini is unavailable, rate-limited, or misconfigured.
 */

import type { FootprintSummary, LifestyleProfile } from "@/types";
import { formatKgCO2e } from "./calculator";
import { BENCHMARKS } from "./emission-factors";

/**
 * Generate a 2-3 sentence summary of the user's footprint.
 * Fully deterministic — no AI, no network calls.
 */
export function generateLocalSummary(
  summary: FootprintSummary,
  profile: LifestyleProfile,
): string {
  const total = summary.totalKgCO2e;
  const sorted = [...summary.categories].sort((a, b) => b.kgCO2e - a.kgCO2e);
  const top = sorted[0];

  if (!top || total <= 0) {
    return "Complete your profile to see a personalized footprint summary. Your data will be used to calculate emissions across home energy, transport, food, waste, and purchases.";
  }

  // Opening line — how they compare
  let opening: string;
  if (total < BENCHMARKS.targetKgCO2ePerYear) {
    opening = `Great news! Your estimated footprint of ${formatKgCO2e(total)} per year is below the 1.5°C compatible target of ${formatKgCO2e(BENCHMARKS.targetKgCO2ePerYear)}.`;
  } else if (total < BENCHMARKS.globalAvgKgCO2ePerYear) {
    opening = `Your estimated footprint is ${formatKgCO2e(total)} per year — that's below the global average of ${formatKgCO2e(BENCHMARKS.globalAvgKgCO2ePerYear)}.`;
  } else {
    opening = `Your estimated footprint is ${formatKgCO2e(total)} per year, which is ${Math.abs(summary.vsGlobalAverage).toFixed(0)}% ${summary.vsGlobalAverage > 0 ? "above" : "below"} the global average.`;
  }

  // Middle — biggest category
  const topPct = top.percentage.toFixed(0);
  const middle = `Your biggest category is ${top.label} at ${topPct}% of your total (${formatKgCO2e(top.kgCO2e)}/year).`;

  // Tip based on top category
  const tip = getTopCategoryTip(top.category, profile);

  return `${opening} ${middle} ${tip}`;
}

/**
 * Generate a "this week's focus" tip based on the highest-emission category.
 */
export function generateLocalFocusTip(summary: FootprintSummary): string {
  const sorted = [...summary.categories].sort((a, b) => b.kgCO2e - a.kgCO2e);
  const top = sorted[0];

  if (!top) {
    return "Focus on tracking your daily habits — awareness is the first step to reducing emissions.";
  }

  const tips: Record<string, string> = {
    home_energy:
      "This week, try turning your thermostat down by 1°C — this alone can save around 5% on heating energy. Check for draughty windows or doors too.",
    transportation:
      "This week, try replacing one car journey with walking, cycling, or public transport. Even one trip saved makes a difference over a year.",
    food:
      "This week, try having two meat-free dinners. Swapping beef for beans in one meal saves roughly 6 kg CO₂e — that adds up quickly.",
    waste:
      "This week, check what you're throwing away. Separating food scraps for composting or ensuring recyclables are clean can cut your waste emissions significantly.",
    purchases:
      "This week, before buying something new, ask: can I borrow, repair, or buy second-hand? Extending the life of products is one of the easiest wins.",
  };

  return tips[top.category] ?? "Keep tracking your daily habits — progress adds up!";
}

/** Get a concrete, actionable tip for a specific emission category */
function getTopCategoryTip(category: string, profile: LifestyleProfile): string {
  switch (category) {
    case "home_energy":
      if (profile.electricityGreenPercentage < 50) {
        return "Switching to a green energy tariff could significantly cut your home energy emissions.";
      }
      return "Consider upgrading to LED lighting and improving insulation to reduce energy use further.";

    case "transportation":
      if (profile.vehicleType === "petrol" || profile.vehicleType === "diesel") {
        return "Consider switching to a hybrid or electric vehicle — it could cut your driving emissions by 40-70%.";
      }
      if (profile.flightFrequency !== "none") {
        return "Reducing even one return flight per year can save 250-1,600 kg CO₂e depending on distance.";
      }
      return "You're already doing well on transport — keep up the low-emission habits!";

    case "food":
      if (profile.dietType === "omnivore" || profile.dietType === "heavy_meat") {
        return "Trying a few meat-free days per week is one of the most impactful dietary changes you can make.";
      }
      return "Reducing food waste and buying more local produce can further cut your food footprint.";

    case "waste":
      return "Increasing your recycling rate and composting food scraps can significantly reduce waste emissions.";

    case "purchases":
      return "Buying less, choosing quality over quantity, and extending product lifespans are effective ways to reduce this category.";

    default:
      return "Small daily changes add up — every action counts.";
  }
}
