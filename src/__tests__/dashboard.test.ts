import { calculateFullFootprint, buildFootprintSummary } from "../lib/calculator";
import type { LifestyleProfile } from "../types";

describe("Dashboard Data Pipeline", () => {
  const profile: LifestyleProfile = {
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

  test("calculates correct categories summing to 100%", () => {
    const result = calculateFullFootprint(profile);
    const summary = buildFootprintSummary(result);
    
    expect(summary.categories.length).toBeGreaterThan(0);
    const totalPercentage = summary.categories.reduce((acc, cat) => acc + cat.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 0);
  });

  test("handles zero/extreme low emissions safely", () => {
    const zeroProfile: LifestyleProfile = {
      ...profile,
      electricityGreenPercentage: 100,
      heatingType: "heat_pump",
      vehicleType: "none",
      flightFrequency: "none",
      dietType: "vegan",
      shoppingFrequency: "minimal",
      recyclingLevel: "all",
    };
    const result = calculateFullFootprint(zeroProfile);
    const summary = buildFootprintSummary(result);
    
    expect(summary.totalKgCO2e).toBeGreaterThanOrEqual(0);
    
    if (summary.totalKgCO2e > 0) {
      const totalPercentage = summary.categories.reduce((acc, cat) => acc + cat.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    }
  });
});
