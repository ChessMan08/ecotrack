import { calculateFullFootprint, buildFootprintSummary, getEmissionRating, formatKgCO2e } from "../lib/calculator";
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

function makeSummary(profile: LifestyleProfile = baseProfile): FootprintSummary {
  return buildFootprintSummary(calculateFullFootprint(profile));
}

describe("Dashboard Data Pipeline", () => {
  test("calculates correct categories summing to 100%", () => {
    const summary = makeSummary();

    expect(summary.categories.length).toBeGreaterThan(0);
    const totalPercentage = summary.categories.reduce((acc, cat) => acc + cat.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 0);
  });

  test("handles zero/extreme low emissions safely", () => {
    const zeroProfile: LifestyleProfile = {
      ...baseProfile,
      electricityGreenPercentage: 100,
      heatingType: "heat_pump",
      vehicleType: "none",
      flightFrequency: "none",
      dietType: "vegan",
      shoppingFrequency: "minimal",
      recyclingLevel: "all",
    };
    const summary = makeSummary(zeroProfile);

    expect(summary.totalKgCO2e).toBeGreaterThanOrEqual(0);

    if (summary.totalKgCO2e > 0) {
      const totalPercentage = summary.categories.reduce((acc, cat) => acc + cat.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    }
  });

  test("all categories have valid labels, colors, and icons", () => {
    const summary = makeSummary();

    for (const cat of summary.categories) {
      expect(cat.label).toBeTruthy();
      expect(cat.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(cat.icon).toBeTruthy();
      expect(cat.kgCO2e).toBeGreaterThanOrEqual(0);
      expect(cat.percentage).toBeGreaterThanOrEqual(0);
      expect(cat.percentage).toBeLessThanOrEqual(100);
    }
  });

  test("getEmissionRating returns valid labels for all ranges", () => {
    const ranges = [500, 1500, 3000, 7000, 12000, 20000];
    for (const kg of ranges) {
      const rating = getEmissionRating(kg);
      expect(rating.label).toBeTruthy();
      expect(rating.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(rating.description).toBeTruthy();
    }
  });

  test("formatKgCO2e handles small and large values", () => {
    expect(formatKgCO2e(500)).toContain("kg");
    expect(formatKgCO2e(5000)).toContain("t");
    expect(formatKgCO2e(0)).toContain("kg");
  });

  test("vsGlobalAverage is calculated correctly", () => {
    const summary = makeSummary();
    // A typical US profile should be above the global average
    expect(summary.vsGlobalAverage).toBeGreaterThan(0);
  });

  test("handles partial/minimal profile without crashing", () => {
    const minimalProfile: LifestyleProfile = {
      location: "GLOBAL",
      householdSize: 1,
      homeType: "studio",
      heatingType: "electricity",
      electricityGreenPercentage: 0,
      homeSizeM2: 30,
      vehicleType: "none",
      weeklyDrivingKm: 0,
      flightFrequency: "none",
      dietType: "vegan",
      localFoodPercentage: 0,
      foodWasteLevel: "low",
      recyclingLevel: "none",
      shoppingFrequency: "minimal",
    };
    const summary = makeSummary(minimalProfile);

    expect(summary.totalKgCO2e).toBeGreaterThanOrEqual(0);
    expect(summary.categories.length).toBe(5);
    expect(summary.generatedAt).toBeTruthy();
  });

  test("high-emission profile produces reasonable totals", () => {
    const highProfile: LifestyleProfile = {
      ...baseProfile,
      weeklyDrivingKm: 1000,
      flightFrequency: "10+",
      dietType: "heavy_meat",
      shoppingFrequency: "frequent",
      recyclingLevel: "none",
    };
    const summary = makeSummary(highProfile);

    // Should be much higher than global average
    expect(summary.totalKgCO2e).toBeGreaterThan(10000);
    expect(summary.vsGlobalAverage).toBeGreaterThan(50);
  });
});
