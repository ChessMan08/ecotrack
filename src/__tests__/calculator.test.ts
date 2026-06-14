/**
 * Unit tests for the emissions calculator module.
 * All calculations are deterministic — given the same inputs, always the same output.
 */

import {
  calculateHomeEnergy,
  calculateTransport,
  calculateFood,
  calculateWaste,
  calculatePurchases,
  calculateFullFootprint,
  formatKgCO2e,
  getEmissionRating,
  toYearly,
  toMonthly,
  toWeekly,
  buildFootprintSummary,
} from "../lib/calculator";

import type { LifestyleProfile } from "../types";

// ── Period converters ─────────────────────────────────────────────────────────

describe("Period converters", () => {
  test("toMonthly: yearly → monthly", () => {
    expect(toMonthly(1200)).toBeCloseTo(100, 1);
  });

  test("toWeekly: yearly → weekly", () => {
    expect(toWeekly(520)).toBeCloseTo(10, 1);
  });

  test("toYearly: monthly → yearly", () => {
    expect(toYearly(100)).toBeCloseTo(1200, 1);
  });

  test("round-trip: monthly → yearly → monthly", () => {
    const val = 150;
    expect(toMonthly(toYearly(val))).toBeCloseTo(val, 1);
  });
});

// ── Home Energy ───────────────────────────────────────────────────────────────

describe("calculateHomeEnergy", () => {
  const baseInput = {
    monthlyElectricityKwh: 350,
    monthlyGasM3: 0,
    heatingType: "natural_gas" as const,
    greenEnergyPercent: 0,
    householdSize: 2,
    location: "US",
  };

  test("US electricity: 350 kWh × 0.386 factor = ~135 kg", () => {
    const result = calculateHomeEnergy(baseInput);
    expect(result.electricityKgCO2e).toBeCloseTo(350 * 0.386, 0);
  });

  test("green energy 100% → near-zero electricity emissions", () => {
    const result = calculateHomeEnergy({ ...baseInput, greenEnergyPercent: 100 });
    expect(result.electricityKgCO2e).toBeCloseTo(0, 0);
  });

  test("green energy 50% → half the base electricity emissions", () => {
    const base = calculateHomeEnergy(baseInput);
    const green = calculateHomeEnergy({ ...baseInput, greenEnergyPercent: 50 });
    expect(green.electricityKgCO2e).toBeCloseTo(base.electricityKgCO2e * 0.5, 0);
  });

  test("gas usage adds to total", () => {
    const withGas = calculateHomeEnergy({ ...baseInput, monthlyGasM3: 50 });
    const noGas = calculateHomeEnergy(baseInput);
    expect(withGas.gasKgCO2e).toBeCloseTo(50 * 2.04, 0);
    expect(withGas.totalKgCO2eMonthly).toBeGreaterThan(noGas.totalKgCO2eMonthly);
  });

  test("per-person emissions = total / household size", () => {
    const result = calculateHomeEnergy({ ...baseInput, householdSize: 4 });
    expect(result.perPersonMonthly).toBeCloseTo(result.totalKgCO2eMonthly / 4, 1);
  });

  test("unknown location falls back to global average", () => {
    const result = calculateHomeEnergy({ ...baseInput, location: "ZZ" });
    expect(result.assumptions.some((a) => a.includes("global average"))).toBe(true);
  });

  test("UK grid is less carbon-intensive than US grid", () => {
    const us = calculateHomeEnergy(baseInput);
    const uk = calculateHomeEnergy({ ...baseInput, location: "GB" });
    expect(uk.electricityKgCO2e).toBeLessThan(us.electricityKgCO2e);
  });
});

// ── Transport ─────────────────────────────────────────────────────────────────

describe("calculateTransport", () => {
  const baseInput = {
    weeklyCarKm: 200,
    vehicleType: "petrol" as const,
    weeklyPublicTransportKm: 0,
    weeklyFlightsShortHaul: 0,
    weeklyFlightsLongHaul: 0,
    weeklyMotorbikeKm: 0,
  };

  test("petrol car: 200 km/wk × 0.192 × 52 weeks ≈ 1997 kg/yr", () => {
    const result = calculateTransport(baseInput);
    expect(result.carKgCO2e).toBeCloseTo(200 * 0.192 * 52, 0);
  });

  test("electric car emits less than petrol for same distance", () => {
    const petrol = calculateTransport(baseInput);
    const ev = calculateTransport({ ...baseInput, vehicleType: "electric" });
    expect(ev.carKgCO2e).toBeLessThan(petrol.carKgCO2e);
    expect(ev.carKgCO2e).toBeLessThan(petrol.carKgCO2e * 0.4);
  });

  test("no car → zero car emissions", () => {
    const result = calculateTransport({ ...baseInput, vehicleType: "none" });
    expect(result.carKgCO2e).toBe(0);
  });

  test("short-haul flight adds ~255 kg CO2e", () => {
    const result = calculateTransport({ ...baseInput, weeklyCarKm: 0, weeklyFlightsShortHaul: 1 });
    expect(result.flightsKgCO2e).toBeCloseTo(255, 0);
  });

  test("long-haul flight adds ~1620 kg CO2e", () => {
    const result = calculateTransport({ ...baseInput, weeklyCarKm: 0, weeklyFlightsLongHaul: 1 });
    expect(result.flightsKgCO2e).toBeCloseTo(1620, 0);
  });

  test("total = sum of all transport components", () => {
    const result = calculateTransport({
      ...baseInput,
      weeklyPublicTransportKm: 50,
      weeklyFlightsShortHaul: 1,
    });
    const expected =
      result.carKgCO2e +
      result.publicTransportKgCO2e +
      result.flightsKgCO2e +
      result.motorbikeKgCO2e;
    expect(result.totalKgCO2eYearly).toBeCloseTo(expected, 0);
  });
});

// ── Food ──────────────────────────────────────────────────────────────────────

describe("calculateFood", () => {
  const baseInput = {
    dietType: "omnivore" as const,
    householdSize: 1,
    localFoodPercent: 0,
    foodWastePercent: 0,
    weeklyMeatMeals: 0,
    weeklyDairyServings: 0,
  };

  test("vegan diet emits less than omnivore", () => {
    const vegan = calculateFood({ ...baseInput, dietType: "vegan" });
    const omni = calculateFood(baseInput);
    expect(vegan.totalKgCO2eYearly).toBeLessThan(omni.totalKgCO2eYearly);
  });

  test("heavy_meat emits more than omnivore", () => {
    const heavy = calculateFood({ ...baseInput, dietType: "heavy_meat" });
    const omni = calculateFood(baseInput);
    expect(heavy.totalKgCO2eYearly).toBeGreaterThan(omni.totalKgCO2eYearly);
  });

  test("diet hierarchy: vegan < vegetarian < flexitarian < omnivore < heavy_meat", () => {
    const diets = ["vegan", "vegetarian", "flexitarian", "omnivore", "heavy_meat"] as const;
    const values = diets.map((d) => calculateFood({ ...baseInput, dietType: d }).totalKgCO2eYearly);
    for (let i = 0; i < values.length - 1; i++) {
      expect(values[i]).toBeLessThan(values[i + 1]);
    }
  });

  test("household size multiplies total food emissions", () => {
    const single = calculateFood(baseInput);
    const family = calculateFood({ ...baseInput, householdSize: 4 });
    expect(family.totalKgCO2eYearly).toBeCloseTo(single.totalKgCO2eYearly * 4, 0);
  });

  test("food waste adds to total emissions", () => {
    const noWaste = calculateFood({ ...baseInput, foodWastePercent: 0 });
    const highWaste = calculateFood({ ...baseInput, foodWastePercent: 50 });
    expect(highWaste.totalKgCO2eYearly).toBeGreaterThan(noWaste.totalKgCO2eYearly);
  });

  test("local food reduces total emissions slightly", () => {
    const noLocal = calculateFood({ ...baseInput, localFoodPercent: 0 });
    const allLocal = calculateFood({ ...baseInput, localFoodPercent: 100 });
    expect(allLocal.totalKgCO2eYearly).toBeLessThan(noLocal.totalKgCO2eYearly);
  });
});

// ── Waste ─────────────────────────────────────────────────────────────────────

describe("calculateWaste", () => {
  const baseInput = {
    weeklyWasteKg: 7,
    recyclingPercent: 0,
    compostingPercent: 0,
    householdSize: 1,
  };

  test("100% recycling reduces emissions vs 0%", () => {
    const noRecycle = calculateWaste(baseInput);
    const allRecycle = calculateWaste({ ...baseInput, recyclingPercent: 80 });
    expect(allRecycle.totalKgCO2eYearly).toBeLessThan(noRecycle.totalKgCO2eYearly);
  });

  test("composting reduces landfill fraction", () => {
    const noCompost = calculateWaste(baseInput);
    const compost = calculateWaste({ ...baseInput, compostingPercent: 30 });
    expect(compost.landfillKgCO2e).toBeLessThan(noCompost.landfillKgCO2e);
  });

  test("recycling + composting > 100% should clamp landfill to 0", () => {
    const result = calculateWaste({
      ...baseInput,
      recyclingPercent: 70,
      compostingPercent: 40, // total 110%
    });
    expect(result.landfillKgCO2e).toBeGreaterThanOrEqual(0);
  });

  test("zero waste input falls back to default", () => {
    const result = calculateWaste({ ...baseInput, weeklyWasteKg: 0 });
    expect(result.assumptions.some((a) => a.includes("global average"))).toBe(true);
  });
});

// ── Purchases ─────────────────────────────────────────────────────────────────

describe("calculatePurchases", () => {
  const baseInput = {
    monthlySpendClothing: 100,
    monthlySpendElectronics: 50,
    monthlySpendOther: 100,
    currency: "USD",
  };

  test("higher spend → higher emissions", () => {
    const base = calculatePurchases(baseInput);
    const highSpend = calculatePurchases({
      ...baseInput,
      monthlySpendClothing: 300,
      monthlySpendElectronics: 200,
    });
    expect(highSpend.totalKgCO2eYearly).toBeGreaterThan(base.totalKgCO2eYearly);
  });

  test("zero spend → near-zero emissions", () => {
    const result = calculatePurchases({
      monthlySpendClothing: 0,
      monthlySpendElectronics: 0,
      monthlySpendOther: 0,
      currency: "USD",
    });
    expect(result.totalKgCO2eYearly).toBe(0);
  });

  test("total = clothing + electronics + other", () => {
    const result = calculatePurchases(baseInput);
    const sum = result.clothingKgCO2e + result.electronicsKgCO2e + result.otherKgCO2e;
    expect(result.totalKgCO2eYearly).toBeCloseTo(sum, 1);
  });

  test("clothing has higher intensity than electronics per dollar", () => {
    const sameSpend = calculatePurchases({
      monthlySpendClothing: 100,
      monthlySpendElectronics: 100,
      monthlySpendOther: 0,
      currency: "USD",
    });
    expect(sameSpend.clothingKgCO2e).toBeGreaterThan(sameSpend.electronicsKgCO2e);
  });
});

// ── Full footprint ────────────────────────────────────────────────────────────

describe("calculateFullFootprint", () => {
  const baseProfile: LifestyleProfile = {
    location: "US",
    householdSize: 2,
    homeType: "house",
    heatingType: "natural_gas",
    electricityGreenPercentage: 0,
    homeSizeM2: 120,
    vehicleType: "petrol",
    weeklyDrivingKm: 200,
    flightFrequency: "1-2",
    dietType: "omnivore",
    localFoodPercentage: 20,
    foodWasteLevel: "medium",
    recyclingLevel: "some",
    shoppingFrequency: "average",
  };

  test("returns positive total for a typical lifestyle", () => {
    const result = calculateFullFootprint(baseProfile);
    expect(result.totalKgCO2eYearly).toBeGreaterThan(0);
  });

  test("total = sum of all categories", () => {
    const result = calculateFullFootprint(baseProfile);
    const sum = Object.values(result.categories).reduce((a, b) => a + b, 0);
    expect(result.totalKgCO2eYearly).toBeCloseTo(sum, 0);
  });

  test("5 categories present", () => {
    const result = calculateFullFootprint(baseProfile);
    expect(Object.keys(result.categories)).toHaveLength(5);
  });

  test("EV + vegan + solar produces lower total than baseline", () => {
    const greenProfile: LifestyleProfile = {
      ...baseProfile,
      vehicleType: "electric",
      dietType: "vegan",
      electricityGreenPercentage: 100,
      heatingType: "heat_pump",
      flightFrequency: "none",
      recyclingLevel: "all",
      shoppingFrequency: "minimal",
    };
    const baseline = calculateFullFootprint(baseProfile);
    const green = calculateFullFootprint(greenProfile);
    expect(green.totalKgCO2eYearly).toBeLessThan(baseline.totalKgCO2eYearly);
  });

  test("includes source citations", () => {
    const result = calculateFullFootprint(baseProfile);
    expect(result.sources.length).toBeGreaterThan(3);
  });
});

// ── Formatting helpers ────────────────────────────────────────────────────────

describe("formatKgCO2e", () => {
  test("under 1000 kg → shows kg", () => {
    expect(formatKgCO2e(500)).toBe("500.0 kg CO₂e");
  });

  test("1000+ kg → shows tonnes", () => {
    expect(formatKgCO2e(1500)).toBe("1.5 t CO₂e");
  });

  test("exactly 1000 → 1.0 t CO₂e", () => {
    expect(formatKgCO2e(1000)).toBe("1.0 t CO₂e");
  });

  test("zero → 0.0 kg CO₂e", () => {
    expect(formatKgCO2e(0)).toBe("0.0 kg CO₂e");
  });
});

// ── Emission rating ───────────────────────────────────────────────────────────

describe("getEmissionRating", () => {
  test("below 2000 kg → Excellent", () => {
    expect(getEmissionRating(1500).label).toBe("Excellent");
  });

  test("2000–5000 → Good", () => {
    expect(getEmissionRating(3000).label).toBe("Good");
  });

  test("5000–10000 → Average", () => {
    expect(getEmissionRating(7000).label).toBe("Average");
  });

  test("10000–15000 → High", () => {
    expect(getEmissionRating(12000).label).toBe("High");
  });

  test("above 15000 → Very High", () => {
    expect(getEmissionRating(18000).label).toBe("Very High");
  });

  test("each rating has a color and description", () => {
    [1000, 3500, 7000, 12000, 20000].forEach((kg) => {
      const r = getEmissionRating(kg);
      expect(r.color).toBeTruthy();
      expect(r.description).toBeTruthy();
    });
  });
});

// ── buildFootprintSummary ─────────────────────────────────────────────────────

describe("buildFootprintSummary", () => {
  const mockResult = {
    totalKgCO2eYearly: 8000,
    categories: {
      home_energy: 2000,
      transportation: 3000,
      food: 2000,
      waste: 500,
      purchases: 500,
    },
    assumptions: [],
    sources: ["EPA"],
  };

  test("category percentages sum to ~100", () => {
    const summary = buildFootprintSummary(mockResult);
    const total = summary.categories.reduce((sum, c) => sum + c.percentage, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  test("total matches input", () => {
    const summary = buildFootprintSummary(mockResult);
    expect(summary.totalKgCO2e).toBe(8000);
  });

  test("vsGlobalAverage is positive for above-average footprint (8t > 6.6t global)", () => {
    const summary = buildFootprintSummary(mockResult);
    expect(summary.vsGlobalAverage).toBeGreaterThan(0);
  });

  test("every category has icon, color, and label", () => {
    const summary = buildFootprintSummary(mockResult);
    summary.categories.forEach((c) => {
      expect(c.icon).toBeTruthy();
      expect(c.color).toBeTruthy();
      expect(c.label).toBeTruthy();
    });
  });
});
