import { generateLocalSummary, generateLocalFocusTip } from "../lib/local-insights";
import { calculateFullFootprint, buildFootprintSummary } from "../lib/calculator";
import type { LifestyleProfile, FootprintSummary } from "../types";

const baseProfile: LifestyleProfile = {
  location: "US",
  householdSize: 2,
  homeType: "apartment",
  heatingType: "natural_gas",
  electricityGreenPercentage: 0,
  homeSizeM2: 80,
  vehicleType: "petrol",
  weeklyDrivingKm: 200,
  flightFrequency: "1-2",
  dietType: "omnivore",
  localFoodPercentage: 20,
  foodWasteLevel: "medium",
  recyclingLevel: "some",
  shoppingFrequency: "average",
};

function makeSummary(profile: LifestyleProfile): FootprintSummary {
  return buildFootprintSummary(calculateFullFootprint(profile));
}

describe("Local Insights — Fallback System", () => {
  describe("generateLocalSummary", () => {
    test("produces non-empty text for a typical profile", () => {
      const summary = makeSummary(baseProfile);
      const text = generateLocalSummary(summary, baseProfile);

      expect(text.length).toBeGreaterThan(50);
      expect(text).toContain("CO₂e");
    });

    test("mentions the biggest emission category", () => {
      const summary = makeSummary(baseProfile);
      const sorted = [...summary.categories].sort((a, b) => b.kgCO2e - a.kgCO2e);
      const topLabel = sorted[0].label;
      const text = generateLocalSummary(summary, baseProfile);

      expect(text).toContain(topLabel);
    });

    test("handles a low-emission vegan profile", () => {
      const veganProfile: LifestyleProfile = {
        ...baseProfile,
        vehicleType: "none",
        flightFrequency: "none",
        dietType: "vegan",
        shoppingFrequency: "minimal",
        recyclingLevel: "all",
        electricityGreenPercentage: 100,
      };
      const summary = makeSummary(veganProfile);
      const text = generateLocalSummary(summary, veganProfile);

      expect(text.length).toBeGreaterThan(20);
      // Low-emission profiles should get positive framing
      expect(text).not.toContain("above");
    });

    test("handles zero-total summary gracefully", () => {
      const emptySummary: FootprintSummary = {
        totalKgCO2e: 0,
        period: "yearly",
        categories: [],
        vsGlobalAverage: -100,
        vsNationalAverage: -100,
        comparisonLabel: "0 kg CO₂e per year",
        generatedAt: new Date().toISOString(),
      };
      const text = generateLocalSummary(emptySummary, baseProfile);

      expect(text.length).toBeGreaterThan(10);
      expect(text).not.toContain("undefined");
      expect(text).not.toContain("NaN");
    });
  });

  describe("generateLocalFocusTip", () => {
    test("returns a tip referencing a real action", () => {
      const summary = makeSummary(baseProfile);
      const tip = generateLocalFocusTip(summary);

      expect(tip.length).toBeGreaterThan(20);
      expect(tip).toContain("week");
    });

    test("returns a fallback for an empty summary", () => {
      const emptySummary: FootprintSummary = {
        totalKgCO2e: 0,
        period: "yearly",
        categories: [],
        vsGlobalAverage: 0,
        vsNationalAverage: 0,
        comparisonLabel: "",
        generatedAt: new Date().toISOString(),
      };
      const tip = generateLocalFocusTip(emptySummary);

      expect(tip.length).toBeGreaterThan(10);
    });

    test("generates different tips for different top categories", () => {
      const transportProfile: LifestyleProfile = {
        ...baseProfile,
        weeklyDrivingKm: 800,
        flightFrequency: "10+",
      };
      const foodProfile: LifestyleProfile = {
        ...baseProfile,
        dietType: "heavy_meat",
        vehicleType: "none",
        flightFrequency: "none",
        weeklyDrivingKm: 0,
      };

      const transportTip = generateLocalFocusTip(makeSummary(transportProfile));
      const foodTip = generateLocalFocusTip(makeSummary(foodProfile));

      // They should be different tips based on their top category
      expect(transportTip).not.toEqual(foodTip);
    });
  });
});
