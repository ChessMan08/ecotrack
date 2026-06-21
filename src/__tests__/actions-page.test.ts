import { generateRecommendations } from "../lib/recommendations";
import { calculateFullFootprint, buildFootprintSummary } from "../lib/calculator";
import type { LifestyleProfile } from "../types";

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

function makeRecommendations(profile: LifestyleProfile, count?: number) {
  const result = calculateFullFootprint(profile);
  const summary = buildFootprintSummary(result);
  return generateRecommendations(profile, summary, "test-uid", count);
}

describe("Actions Page Pipeline", () => {
  test("generates valid recommendations for average profile", () => {
    const recommendations = makeRecommendations(baseProfile, 5);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(5);
    expect(recommendations[0].uid).toBe("test-uid");
  });

  test("generates different recommendations when footprint changes", () => {
    const veganProfile: LifestyleProfile = { ...baseProfile, dietType: "vegan" };
    const veganRecs = makeRecommendations(veganProfile);
    const omniRecs = makeRecommendations(baseProfile);

    // Recs should differ
    expect(veganRecs).not.toEqual(omniRecs);

    // Vegan profile should not have "eat less meat" actions
    const hasMeatAction = veganRecs.some(r => r.id.includes("meat") || r.id.includes("flexitarian"));
    expect(hasMeatAction).toBe(false);
  });

  test("all recommendations have required fields", () => {
    const recs = makeRecommendations(baseProfile, 8);

    for (const rec of recs) {
      expect(rec.id).toBeTruthy();
      expect(rec.uid).toBe("test-uid");
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.category).toBeTruthy();
      expect(rec.estimatedKgCO2eSaved).toBeGreaterThanOrEqual(0);
      expect(["easy", "medium", "hard"]).toContain(rec.difficultyLevel);
    }
  });

  test("generates recommendations for a minimal/new user profile", () => {
    const newUserProfile: LifestyleProfile = {
      location: "GLOBAL",
      householdSize: 1,
      homeType: "apartment",
      heatingType: "electricity",
      electricityGreenPercentage: 0,
      homeSizeM2: 50,
      vehicleType: "none",
      weeklyDrivingKm: 0,
      flightFrequency: "none",
      dietType: "vegan",
      localFoodPercentage: 0,
      foodWasteLevel: "low",
      recyclingLevel: "none",
      shoppingFrequency: "minimal",
    };
    const recs = makeRecommendations(newUserProfile, 5);

    // Should still produce some recommendations even for low-emission profiles
    expect(recs.length).toBeGreaterThan(0);
  });

  test("recommendations respect the requested count limit", () => {
    const recs3 = makeRecommendations(baseProfile, 3);
    const recs8 = makeRecommendations(baseProfile, 8);

    expect(recs3.length).toBeLessThanOrEqual(3);
    expect(recs8.length).toBeLessThanOrEqual(8);
    expect(recs8.length).toBeGreaterThan(recs3.length);
  });

  test("high-emission transport profile gets transport recommendations", () => {
    const driverProfile: LifestyleProfile = {
      ...baseProfile,
      weeklyDrivingKm: 800,
      flightFrequency: "10+",
      vehicleType: "petrol",
    };
    const recs = makeRecommendations(driverProfile, 8);

    const hasTransportRec = recs.some(r => r.category === "transportation");
    expect(hasTransportRec).toBe(true);
  });
});
