/**
 * Tests for the recommendation engine.
 */

import {
  generateRecommendations,
  getTopCategoryByEmissions,
  getDifficultyLabel,
  getDifficultyColor,
} from "../lib/recommendations";

import type { LifestyleProfile, FootprintSummary } from "../types";

const mockProfile: LifestyleProfile = {
  location: "US",
  householdSize: 2,
  homeType: "house",
  heatingType: "natural_gas",
  electricityGreenPercentage: 0,
  homeSizeM2: 120,
  vehicleType: "petrol",
  weeklyDrivingKm: 300,
  flightFrequency: "3-5",
  dietType: "omnivore",
  localFoodPercentage: 10,
  foodWasteLevel: "high",
  recyclingLevel: "some",
  shoppingFrequency: "frequent",
};

const mockSummary: FootprintSummary = {
  totalKgCO2e: 16000,
  period: "yearly",
  generatedAt: new Date().toISOString(),
  vsGlobalAverage: 120,
  vsNationalAverage: 0,
  comparisonLabel: "16 t CO₂e/year",
  categories: [
    { category: "transportation", label: "Transportation", kgCO2e: 5000, percentage: 31.25, trend: 0, color: "#3b82f6", icon: "🚗" },
    { category: "home_energy", label: "Home Energy", kgCO2e: 4000, percentage: 25, trend: 0, color: "#f97316", icon: "🏠" },
    { category: "food", label: "Food", kgCO2e: 4000, percentage: 25, trend: 0, color: "#22c55e", icon: "🥗" },
    { category: "purchases", label: "Purchases", kgCO2e: 2000, percentage: 12.5, trend: 0, color: "#ec4899", icon: "🛍️" },
    { category: "waste", label: "Waste", kgCO2e: 1000, percentage: 6.25, trend: 0, color: "#a855f7", icon: "♻️" },
  ],
};

describe("generateRecommendations", () => {
  test("returns an array of actions", () => {
    const recs = generateRecommendations(mockProfile, mockSummary, "uid123");
    expect(Array.isArray(recs)).toBe(true);
  });

  test("respects maxSuggestions limit", () => {
    const recs = generateRecommendations(mockProfile, mockSummary, "uid123", 4);
    expect(recs.length).toBeLessThanOrEqual(4);
  });

  test("returns at least some recommendations for typical lifestyle", () => {
    const recs = generateRecommendations(mockProfile, mockSummary, "uid123");
    expect(recs.length).toBeGreaterThan(0);
  });

  test("all recommendations have required fields", () => {
    const recs = generateRecommendations(mockProfile, mockSummary, "uid123");
    recs.forEach((r) => {
      expect(r.title).toBeTruthy();
      expect(r.description).toBeTruthy();
      expect(r.whyItMatters).toBeTruthy();
      expect(r.estimatedKgCO2eSaved).toBeGreaterThan(0);
      expect(["easy", "medium", "hard"]).toContain(r.difficultyLevel);
      expect(r.timeToAdopt).toBeTruthy();
      expect(r.category).toBeTruthy();
    });
  });

  test("EV owner does not get EV switch recommendation", () => {
    const evProfile: LifestyleProfile = { ...mockProfile, vehicleType: "electric" };
    const recs = generateRecommendations(evProfile, mockSummary, "uid123");
    const evRec = recs.find((r) => r.id.startsWith("switch_to_ev"));
    expect(evRec).toBeUndefined();
  });

  test("no-car profile does not get EV recommendation", () => {
    const noCarProfile: LifestyleProfile = { ...mockProfile, vehicleType: "none" };
    const recs = generateRecommendations(noCarProfile, mockSummary, "uid123");
    const evRec = recs.find((r) => r.title.toLowerCase().includes("electric vehicle"));
    expect(evRec).toBeUndefined();
  });

  test("no-flight profile gets no flight-reduction recommendation", () => {
    const noFlyProfile: LifestyleProfile = { ...mockProfile, flightFrequency: "none" };
    const recs = generateRecommendations(noFlyProfile, mockSummary, "uid123");
    const flightRec = recs.find(
      (r) => r.category === "transportation" && r.title.toLowerCase().includes("flight")
    );
    expect(flightRec).toBeUndefined();
  });

  test("vegan does not get meat reduction recommendation", () => {
    const veganProfile: LifestyleProfile = { ...mockProfile, dietType: "vegan" };
    const recs = generateRecommendations(veganProfile, mockSummary, "uid123");
    const meatRec = recs.find(
      (r) => r.id.startsWith("reduce_red_meat") || r.id.startsWith("go_flexitarian")
    );
    expect(meatRec).toBeUndefined();
  });

  test("high-electricity profile gets green energy recommendation", () => {
    // Use maxSuggestions=15 to ensure this rule is not cut off by limit
    const recs = generateRecommendations(mockProfile, mockSummary, "uid123", 15);
    const greenRec = recs.find((r) => r.id.startsWith("switch_green_energy"));
    expect(greenRec).toBeDefined();
  });

  test("recommendations sorted by impact (highest savings first)", () => {
    const recs = generateRecommendations(mockProfile, mockSummary, "uid123", 5);
    for (let i = 0; i < recs.length - 1; i++) {
      // Allow slight deviation due to difficulty secondary sort
      if (Math.abs(recs[i].estimatedKgCO2eSaved - recs[i + 1].estimatedKgCO2eSaved) > 100) {
        expect(recs[i].estimatedKgCO2eSaved).toBeGreaterThanOrEqual(
          recs[i + 1].estimatedKgCO2eSaved
        );
      }
    }
  });

  test("each recommendation has a uid", () => {
    const recs = generateRecommendations(mockProfile, mockSummary, "uid-abc");
    recs.forEach((r) => {
      expect(r.uid).toBe("uid-abc");
    });
  });

  test("aiGenerated flag is false for deterministic recommendations", () => {
    const recs = generateRecommendations(mockProfile, mockSummary, "uid123");
    recs.forEach((r) => {
      expect(r.aiGenerated).toBe(false);
    });
  });
});

// ── getTopCategoryByEmissions ─────────────────────────────────────────────────

describe("getTopCategoryByEmissions", () => {
  test("returns the category with highest kgCO2e", () => {
    const top = getTopCategoryByEmissions(mockSummary);
    expect(top).toBe("transportation");
  });

  test("returns a fallback for empty categories", () => {
    const emptySummary = { ...mockSummary, categories: [] };
    const top = getTopCategoryByEmissions(emptySummary);
    expect(top).toBeTruthy();
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

describe("getDifficultyLabel", () => {
  test("easy → Quick win", () => {
    expect(getDifficultyLabel("easy")).toBe("Quick win");
  });

  test("medium → Worth the effort", () => {
    expect(getDifficultyLabel("medium")).toBe("Worth the effort");
  });

  test("hard → Big impact", () => {
    expect(getDifficultyLabel("hard")).toBe("Big impact");
  });
});

describe("getDifficultyColor", () => {
  test("easy is green", () => {
    expect(getDifficultyColor("easy")).toBe("#22c55e");
  });

  test("hard is orange", () => {
    expect(getDifficultyColor("hard")).toBe("#f97316");
  });
});
