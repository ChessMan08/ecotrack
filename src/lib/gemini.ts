/**
 * Gemini AI Integration
 *
 * All AI calls are server-side only via API routes.
 * Client code calls /api/ai/* routes which proxy to Gemini.
 *
 * This file provides the server-side Gemini client and prompt builders.
 */

import type { FootprintSummary, LifestyleProfile, Action, Goal } from "@/types";
import { formatKgCO2e, getCategoryLabel } from "./calculator";
import { BENCHMARKS } from "./emission-factors";

// ── Prompt builders ───────────────────────────────────────────────────────────

export function buildFootprintSummaryPrompt(
  summary: FootprintSummary,
  profile: LifestyleProfile,
): string {
  const categories = summary.categories
    .sort((a, b) => b.kgCO2e - a.kgCO2e)
    .map((c) => `- ${c.label}: ${formatKgCO2e(c.kgCO2e)} (${c.percentage.toFixed(1)}% of total)`)
    .join("\n");

  const vsGlobal = summary.vsGlobalAverage > 0
    ? `${Math.abs(summary.vsGlobalAverage).toFixed(0)}% above the global average`
    : `${Math.abs(summary.vsGlobalAverage).toFixed(0)}% below the global average`;

  return `You are a friendly, non-judgmental climate coach. Your job is to help a user understand their personal carbon footprint in plain, encouraging language.

Here is the user's annual carbon footprint data (all values are deterministically calculated, not AI estimates):

Total: ${formatKgCO2e(summary.totalKgCO2e)} per year
That's ${vsGlobal} (global average: ${formatKgCO2e(BENCHMARKS.globalAvgKgCO2ePerYear)}).
The 1.5°C compatible target per person is ${formatKgCO2e(BENCHMARKS.targetKgCO2ePerYear)}.

Breakdown by category:
${categories}

User profile context:
- Location: ${profile.location}
- Household size: ${profile.householdSize} people
- Diet: ${profile.dietType}
- Vehicle: ${profile.vehicleType}
- Flight frequency: ${profile.flightFrequency} flights per year
- Green energy: ${profile.electricityGreenPercentage}% of electricity

Write a brief, warm, 3-4 sentence summary of this footprint. Be encouraging, not preachy. Mention the biggest category and one concrete positive they could do. Use plain language — no jargon. Do not present any estimates as facts. Do not fabricate numbers — use only those provided above.`;
}

export function buildReductionTipsPrompt(
  summary: FootprintSummary,
  topCategory: string,
  existingActions: Action[],
): string {
  const alreadyPlanned = existingActions
    .filter((a) => a.status === "planned" || a.status === "done")
    .map((a) => a.title)
    .join(", ") || "none yet";

  const topCategoryKg = summary.categories.find((c) => c.category === topCategory);

  return `You are a friendly climate coach. Give the user 3 specific, practical tips to reduce their ${getCategoryLabel(topCategory as never)} emissions.

Their ${getCategoryLabel(topCategory as never)} footprint is ${topCategoryKg ? formatKgCO2e(topCategoryKg.kgCO2e) : "significant"} per year.

Actions they are already working on: ${alreadyPlanned}

Rules:
- Give exactly 3 tips numbered 1, 2, 3
- Each tip: one short bold action title, then 1-2 sentences of practical explanation
- Be specific and actionable, not generic platitudes
- Do not repeat actions they're already doing
- Keep a warm, supportive tone
- Do not make up emission numbers`;
}

export function buildWeeklyFocusPrompt(
  summary: FootprintSummary,
  goals: Goal[],
  recentActions: Action[],
): string {
  const completedThisWeek = recentActions.filter(
    (a) =>
      a.status === "done" &&
      a.completedAt &&
      new Date(a.completedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  ).length;

  const activeGoals = goals.filter((g) => g.status === "active").slice(0, 2);
  const goalsText = activeGoals.length
    ? activeGoals.map((g) => `- ${g.title}: ${g.progressPercent.toFixed(0)}% complete`).join("\n")
    : "No active goals yet";

  return `You are a friendly climate coach giving a Monday morning focus for the week.

User's footprint this week:
${summary.categories.map((c) => `- ${c.label}: ${formatKgCO2e(c.kgCO2e / 52)} this week`).join("\n")}

Their active goals:
${goalsText}

Actions completed this week: ${completedThisWeek}

Write a "This Week's Focus" message of exactly 2-3 sentences:
- Pick ONE specific category or habit to focus on this week
- Give one concrete thing to do TODAY
- Be encouraging and specific, not generic
- If they completed actions this week, acknowledge that warmly
- Do not make up numbers`;
}

export function buildChatSystemPrompt(
  summary: FootprintSummary,
  profile: LifestyleProfile,
): string {
  const categories = summary.categories
    .map((c) => `${c.label}: ${formatKgCO2e(c.kgCO2e)}/year`)
    .join(", ");

  return `You are a friendly, knowledgeable climate coach built into a carbon footprint tracking app.

The user's current footprint:
- Total: ${formatKgCO2e(summary.totalKgCO2e)} per year
- Breakdown: ${categories}
- Location: ${profile.location}, Diet: ${profile.dietType}, Vehicle: ${profile.vehicleType}

Your role:
- Answer questions about their carbon footprint honestly and helpfully
- Explain what CO2e means, why emissions matter, how to reduce them
- Be encouraging, non-judgmental, and practical
- When discussing emissions data, always use the actual numbers from their profile above
- Clearly label any estimates or assumptions as such
- Keep responses concise (2-4 sentences unless more detail is asked for)
- Do not fabricate emission statistics — cite the source if you reference a fact
- If asked something outside climate/sustainability, politely redirect`;
}

// ── Response parsing ──────────────────────────────────────────────────────────

export function parseGeminiText(responseText: string): string {
  // Strip markdown formatting for plain display
  return responseText
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .trim();
}
