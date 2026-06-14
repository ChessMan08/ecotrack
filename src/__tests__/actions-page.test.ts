import { generateRecommendations } from "../lib/recommendations";
import { calculateFullFootprint, buildFootprintSummary } from "../lib/calculator";
import type { LifestyleProfile } from "../types";

describe("Actions Page Pipeline", () => {
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

  test("generates valid recommendations for average profile", () => {
    const result = calculateFullFootprint(profile);
    const summary = buildFootprintSummary(result);
    const recommendations = generateRecommendations(profile, summary, "test-uid", 5);
    
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(5);
    expect(recommendations[0].uid).toBe("test-uid");
  });

  test("generates different recommendations when footprint changes", () => {
    const veganProfile: LifestyleProfile = { ...profile, dietType: "vegan" };
    const veganResult = calculateFullFootprint(veganProfile);
    const veganSummary = buildFootprintSummary(veganResult);
    const veganRecs = generateRecommendations(veganProfile, veganSummary, "test-uid");
    
    const omniResult = calculateFullFootprint(profile);
    const omniSummary = buildFootprintSummary(omniResult);
    const omniRecs = generateRecommendations(profile, omniSummary, "test-uid");

    // Recs should differ
    expect(veganRecs).not.toEqual(omniRecs);
    
    // Vegan profile should not have "eat less meat" actions
    const hasMeatAction = veganRecs.some(r => r.id.includes("meat") || r.id.includes("flexitarian"));
    expect(hasMeatAction).toBe(false);
  });
});
