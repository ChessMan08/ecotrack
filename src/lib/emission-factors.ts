/**
 * Emission Factors Module
 *
 * All values are in kg CO2e per unit.
 * Sources:
 *   - EPA GHG Emission Factors Hub 2024 (https://www.epa.gov/ghgemissions)
 *   - IPCC AR6 Global Warming Potentials
 *   - UK DESNZ/BEIS 2023 Greenhouse Gas Conversion Factors
 *   - IEA World Energy Outlook 2023 (electricity grid factors)
 *   - University of Michigan Carbon Footprint Factsheet 2023
 *   - OURWORLDINDATA.ORG food emission factors (Poore & Nemecek 2018)
 */

import type { EmissionFactor, HeatingType, VehicleType } from "@/types";

// ── Electricity grid intensity by country (kg CO2e / kWh) ────────────────────
// Source: IEA 2023, EIA eGRID 2023
export const GRID_INTENSITY: Record<string, EmissionFactor> = {
  US: { value: 0.386, unit: "kg CO2e/kWh", source: "EPA eGRID 2023", year: 2023, region: "US average" },
  GB: { value: 0.193, unit: "kg CO2e/kWh", source: "UK DESNZ 2023", year: 2023, region: "UK" },
  DE: { value: 0.350, unit: "kg CO2e/kWh", source: "IEA 2023", year: 2023, region: "Germany" },
  IN: { value: 0.713, unit: "kg CO2e/kWh", source: "IEA 2023", year: 2023, region: "India" },
  AU: { value: 0.610, unit: "kg CO2e/kWh", source: "DCCEEW 2023", year: 2023, region: "Australia" },
  CA: { value: 0.120, unit: "kg CO2e/kWh", source: "NIR Canada 2023", year: 2023, region: "Canada" },
  FR: { value: 0.052, unit: "kg CO2e/kWh", source: "IEA 2023", year: 2023, region: "France" },
  CN: { value: 0.555, unit: "kg CO2e/kWh", source: "IEA 2023", year: 2023, region: "China" },
  BR: { value: 0.058, unit: "kg CO2e/kWh", source: "IEA 2023", year: 2023, region: "Brazil" },
  GLOBAL: { value: 0.485, unit: "kg CO2e/kWh", source: "IEA 2023 global average", year: 2023 },
};

// ── Natural gas (kg CO2e / m³) ────────────────────────────────────────────────
// Source: EPA GHG Factors Hub 2024
export const NATURAL_GAS_FACTOR: EmissionFactor = {
  value: 2.04, unit: "kg CO2e/m³", source: "EPA GHG Factors Hub 2024", year: 2024,
};

// Natural gas per kWh for those billing in kWh
export const NATURAL_GAS_KWH_FACTOR: EmissionFactor = {
  value: 0.203, unit: "kg CO2e/kWh", source: "UK DESNZ 2023", year: 2023,
};

// ── Heating oil ───────────────────────────────────────────────────────────────
export const HEATING_OIL_FACTOR: EmissionFactor = {
  value: 2.68, unit: "kg CO2e/litre", source: "EPA GHG Factors Hub 2024", year: 2024,
};

// ── Transport emission factors ────────────────────────────────────────────────
// Source: UK DESNZ 2023, EPA 2024

export const VEHICLE_FACTORS: Record<VehicleType, EmissionFactor> = {
  petrol: { value: 0.192, unit: "kg CO2e/km", source: "UK DESNZ 2023 — avg petrol car", year: 2023 },
  diesel: { value: 0.171, unit: "kg CO2e/km", source: "UK DESNZ 2023 — avg diesel car", year: 2023 },
  hybrid: { value: 0.105, unit: "kg CO2e/km", source: "UK DESNZ 2023 — avg hybrid", year: 2023 },
  electric: { value: 0.053, unit: "kg CO2e/km", source: "UK DESNZ 2023 — avg EV (UK grid)", year: 2023 },
  none: { value: 0, unit: "kg CO2e/km", source: "N/A", year: 2023 },
};

export const TRANSPORT_FACTORS = {
  publicBus: { value: 0.097, unit: "kg CO2e/km", source: "UK DESNZ 2023 — local bus", year: 2023 },
  metroRail: { value: 0.035, unit: "kg CO2e/km", source: "UK DESNZ 2023 — metro/rail", year: 2023 },
  motorbike: { value: 0.114, unit: "kg CO2e/km", source: "UK DESNZ 2023 — average motorbike", year: 2023 },
  shortHaulFlight: { value: 255, unit: "kg CO2e/return flight", source: "UK DESNZ 2023 — avg short-haul return", year: 2023 },
  longHaulFlight: { value: 1620, unit: "kg CO2e/return flight", source: "UK DESNZ 2023 — avg long-haul return", year: 2023 },
};

// ── Food emission factors (kg CO2e per kg food) ──────────────────────────────
// Source: Poore & Nemecek 2018 (Science), OURWORLDINDATA 2023
export const FOOD_FACTORS = {
  beef: { value: 60.0, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  lamb: { value: 24.0, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  pork: { value: 7.6, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  poultry: { value: 9.9, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  fish: { value: 5.1, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  dairy: { value: 3.2, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  eggs: { value: 4.8, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  vegetables: { value: 2.0, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  fruit: { value: 1.1, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  grains: { value: 1.4, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
  legumes: { value: 0.9, unit: "kg CO2e/kg", source: "Poore & Nemecek 2018", year: 2018 },
};

// Annual diet baselines by diet type (kg CO2e/year per person)
// Source: Scarborough et al. 2023 (Nature Food)
export const DIET_ANNUAL_KG_CO2E: Record<string, { value: number; source: string }> = {
  vegan:       { value: 1100, source: "Scarborough et al. 2023 (Nature Food)" },
  vegetarian:  { value: 1390, source: "Scarborough et al. 2023 (Nature Food)" },
  flexitarian: { value: 1690, source: "Scarborough et al. 2023 (Nature Food)" },
  omnivore:    { value: 2050, source: "Scarborough et al. 2023 (Nature Food)" },
  heavy_meat:  { value: 2510, source: "Scarborough et al. 2023 (Nature Food)" },
};

// ── Waste emission factors ─────────────────────────────────────────────────────
// Source: EPA WARM Model 2023
export const WASTE_FACTORS = {
  landfill: { value: 0.467, unit: "kg CO2e/kg waste", source: "EPA WARM Model 2023", year: 2023 },
  recycled: { value: 0.021, unit: "kg CO2e/kg waste", source: "EPA WARM Model 2023", year: 2023 },
  composted: { value: 0.080, unit: "kg CO2e/kg waste", source: "EPA WARM Model 2023", year: 2023 },
};

// Average weekly waste per person (kg)
export const AVG_WEEKLY_WASTE_KG_PER_PERSON = 7; // ~365 kg/yr

// ── Purchases emission factors ────────────────────────────────────────────────
// Spend-based approach: kg CO2e per USD spent
// Source: USEEIO v2.0 (US EPA), Carnegie Mellon EIOLCA
export const PURCHASE_SPEND_FACTORS = {
  clothing: { value: 0.5, unit: "kg CO2e/USD", source: "USEEIO v2.0", year: 2022 },
  electronics: { value: 0.3, unit: "kg CO2e/USD", source: "USEEIO v2.0", year: 2022 },
  general: { value: 0.25, unit: "kg CO2e/USD", source: "USEEIO v2.0", year: 2022 },
};

// ── Global / National averages for benchmarking ──────────────────────────────
// Source: University of Michigan Factsheet 2023, World Bank 2022
export const BENCHMARKS = {
  globalAvgKgCO2ePerYear: 6600,
  usAvgKgCO2ePerYear: 17600,
  ukAvgKgCO2ePerYear: 10000,
  euAvgKgCO2ePerYear: 9000,
  inAvgKgCO2ePerYear: 2300,
  targetKgCO2ePerYear: 2000, // 1.5°C compatible per person by 2030
};

// ── Heating factors ────────────────────────────────────────────────────────────
export const HEATING_FACTORS: Record<HeatingType, EmissionFactor> = {
  natural_gas: { value: 0.203, unit: "kg CO2e/kWh heat", source: "UK DESNZ 2023", year: 2023 },
  electricity: { value: 0.193, unit: "kg CO2e/kWh (grid-dependent)", source: "UK grid avg 2023", year: 2023 },
  oil: { value: 0.298, unit: "kg CO2e/kWh heat", source: "UK DESNZ 2023", year: 2023 },
  heat_pump: { value: 0.064, unit: "kg CO2e/kWh heat", source: "UK DESNZ 2023 — CoP 3", year: 2023 },
  wood: { value: 0.030, unit: "kg CO2e/kWh heat", source: "UK DESNZ 2023 (sustainably sourced)", year: 2023 },
  district: { value: 0.150, unit: "kg CO2e/kWh heat", source: "IEA district heating avg 2022", year: 2022 },
};
