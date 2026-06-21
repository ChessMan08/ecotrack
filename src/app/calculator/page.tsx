"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addEmissionEntry } from "@/lib/firebase";
import {
  calculateHomeEnergy,
  calculateTransport,
  calculateFood,
  calculateWaste,
  calculatePurchases,
  toYearly,
  formatKgCO2e,
} from "@/lib/calculator";
import { nanoid } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Input, Select, RadioGroup, Slider } from "@/components/ui/Input";
import { CategoryPieChart } from "@/components/charts/FootprintChart";
import type { FootprintSummary, LifestyleProfile } from "@/types";

type Category = "home" | "transport" | "food" | "waste" | "purchases";

const CATEGORY_TABS: { id: Category; label: string; icon: string }[] = [
  { id: "home", label: "Home Energy", icon: "🏠" },
  { id: "transport", label: "Transport", icon: "🚗" },
  { id: "food", label: "Food", icon: "🥗" },
  { id: "waste", label: "Waste", icon: "♻️" },
  { id: "purchases", label: "Purchases", icon: "🛍️" },
];

export default function CalculatorPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Category>("home");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Home Energy inputs ──────────────────────────────────────────────────
  const [elecKwh, setElecKwh] = useState(350);
  const [gasM3, setGasM3] = useState(50);
  const [greenPct, setGreenPct] = useState(profile?.lifestyle.electricityGreenPercentage ?? 0);
  const [heatingType, setHeatingType] = useState<LifestyleProfile["heatingType"]>(profile?.lifestyle.heatingType ?? "natural_gas");
  
  const householdSize = profile?.lifestyle.householdSize ?? 2;
  const location = profile?.lifestyle.location ?? "US";

  // ── Transport inputs ────────────────────────────────────────────────────
  const [weeklyCarKm, setWeeklyCarKm] = useState(profile?.lifestyle.weeklyDrivingKm ?? 200);
  const [vehicleType, setVehicleType] = useState<LifestyleProfile["vehicleType"]>(profile?.lifestyle.vehicleType ?? "petrol");
  const [weeklyPtKm, setWeeklyPtKm] = useState(30);
  const [shortFlights, setShortFlights] = useState(1);
  const [longFlights, setLongFlights] = useState(0);

  // ── Food inputs ─────────────────────────────────────────────────────────
  const [dietType, setDietType] = useState<LifestyleProfile["dietType"]>(profile?.lifestyle.dietType ?? "omnivore");
  const [localPct, setLocalPct] = useState(profile?.lifestyle.localFoodPercentage ?? 20);
  const [wastePct, setWastePct] = useState(20);

  // ── Waste inputs ────────────────────────────────────────────────────────
  const [weeklyWasteKg, setWeeklyWasteKg] = useState(7);
  const [recyclingPct, setRecyclingPct] = useState(30);
  const [compostPct, setCompostPct] = useState(10);

  // ── Purchases inputs ────────────────────────────────────────────────────
  const [clothingSpend, setClothingSpend] = useState(80);
  const [electronicsSpend, setElectronicsSpend] = useState(40);
  const [otherSpend, setOtherSpend] = useState(100);

  // ── Live calculations ───────────────────────────────────────────────────
  const homeResult = calculateHomeEnergy({
    monthlyElectricityKwh: elecKwh,
    monthlyGasM3: gasM3,
    heatingType,
    greenEnergyPercent: greenPct,
    householdSize,
    location,
  });

  const transportResult = calculateTransport({
    weeklyCarKm,
    vehicleType,
    weeklyPublicTransportKm: weeklyPtKm,
    weeklyFlightsShortHaul: shortFlights,
    weeklyFlightsLongHaul: longFlights,
    weeklyMotorbikeKm: 0,
  });

  const foodResult = calculateFood({
    dietType,
    householdSize,
    localFoodPercent: localPct,
    foodWastePercent: wastePct,
    weeklyMeatMeals: 0,
    weeklyDairyServings: 0,
  });

  const wasteResult = calculateWaste({
    weeklyWasteKg,
    recyclingPercent: recyclingPct,
    compostingPercent: compostPct,
    householdSize,
  });

  const purchasesResult = calculatePurchases({
    monthlySpendClothing: clothingSpend,
    monthlySpendElectronics: electronicsSpend,
    monthlySpendOther: otherSpend,
    currency: "USD",
  });

  const homeYearly = toYearly(homeResult.totalKgCO2eMonthly);
  const totalYearly =
    homeYearly +
    transportResult.totalKgCO2eYearly +
    foodResult.totalKgCO2eYearly +
    wasteResult.totalKgCO2eYearly +
    purchasesResult.totalKgCO2eYearly;

  const summary: FootprintSummary = {
    totalKgCO2e: totalYearly,
    period: "yearly",
    generatedAt: new Date().toISOString(),
    vsGlobalAverage: ((totalYearly - 6600) / 6600) * 100,
    vsNationalAverage: 0,
    comparisonLabel: formatKgCO2e(totalYearly),
    categories: [
      { category: "home_energy", label: "Home Energy", kgCO2e: homeYearly, percentage: (homeYearly / totalYearly) * 100, trend: 0, color: "#f97316", icon: "🏠" },
      { category: "transportation", label: "Transportation", kgCO2e: transportResult.totalKgCO2eYearly, percentage: (transportResult.totalKgCO2eYearly / totalYearly) * 100, trend: 0, color: "#3b82f6", icon: "🚗" },
      { category: "food", label: "Food & Diet", kgCO2e: foodResult.totalKgCO2eYearly, percentage: (foodResult.totalKgCO2eYearly / totalYearly) * 100, trend: 0, color: "#22c55e", icon: "🥗" },
      { category: "waste", label: "Waste", kgCO2e: wasteResult.totalKgCO2eYearly, percentage: (wasteResult.totalKgCO2eYearly / totalYearly) * 100, trend: 0, color: "#a855f7", icon: "♻️" },
      { category: "purchases", label: "Purchases", kgCO2e: purchasesResult.totalKgCO2eYearly, percentage: (purchasesResult.totalKgCO2eYearly / totalYearly) * 100, trend: 0, color: "#ec4899", icon: "🛍️" },
    ],
  };

  async function saveEntry() {
    if (!user) return;
    setSaving(true);
    try {
      const entries = [
        { category: "home_energy", kgCO2e: homeYearly, label: "Home energy (monthly entry)", assumptions: homeResult.assumptions },
        { category: "transportation", kgCO2e: transportResult.totalKgCO2eYearly, label: "Transport (yearly estimate)", assumptions: transportResult.assumptions },
        { category: "food", kgCO2e: foodResult.totalKgCO2eYearly, label: "Food & diet (yearly estimate)", assumptions: foodResult.assumptions },
        { category: "waste", kgCO2e: wasteResult.totalKgCO2eYearly, label: "Waste (yearly estimate)", assumptions: wasteResult.assumptions },
        { category: "purchases", kgCO2e: purchasesResult.totalKgCO2eYearly, label: "Purchases (yearly estimate)", assumptions: purchasesResult.assumptions },
      ];
      for (const e of entries) {
        await addEmissionEntry(user.uid, {
          id: nanoid(),
          uid: user.uid,
          ...e,
          date: new Date().toISOString(),
          period: "yearly",
          isEstimated: true,
          emissionFactor: "Mixed — EPA, IPCC, UK DESNZ, Poore & Nemecek 2018",
          inputData: {},
          subcategory: e.category,
          calculationNote: e.assumptions?.join("; ") ?? "",
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Carbon Footprint Calculator</h1>
        <p className="section-subtitle">
          All calculations use EPA, IPCC, and IEA emission factors with source citations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Calculator inputs ── */}
        <div className="lg:col-span-2">
          {/* Category tabs */}
          <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-900">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-forest-600 text-white"
                    : "text-stone-600 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-800"
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <Card>
            {/* ── Home Energy ── */}
            {activeTab === "home" && (
              <div className="space-y-5">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">🏠 Home Energy</h2>
                <Input
                  label="Monthly electricity usage"
                  type="number"
                  value={elecKwh}
                  onChange={(e) => setElecKwh(Number(e.target.value))}
                  suffix="kWh"
                  hint="Check your electricity bill — UK avg ~270 kWh/month"
                  min={0}
                />
                <Input
                  label="Monthly natural gas usage"
                  type="number"
                  value={gasM3}
                  onChange={(e) => setGasM3(Number(e.target.value))}
                  suffix="m³"
                  hint="Leave at 0 if you don't use gas"
                  min={0}
                />
                <Select
                  label="Heating system"
                  value={heatingType}
                  onChange={(e) => setHeatingType(e.target.value as "natural_gas" | "electricity" | "oil" | "heat_pump" | "wood" | "district")}
                  options={[
                    { value: "natural_gas", label: "Natural gas boiler" },
                    { value: "electricity", label: "Electric heating" },
                    { value: "heat_pump", label: "Heat pump" },
                    { value: "oil", label: "Oil boiler" },
                    { value: "wood", label: "Wood / biomass" },
                    { value: "district", label: "District heating" },
                  ]}
                />
                <Slider
                  label="Green/renewable electricity"
                  value={greenPct}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={setGreenPct}
                  formatValue={(v) => `${v}%`}
                  hint="From your energy tariff — reduces electricity emissions proportionally"
                />

                {/* Live result */}
                <ResultBox
                  label="Monthly home energy emissions"
                  value={homeResult.totalKgCO2eMonthly}
                  yearly={homeYearly}
                  color="#f97316"
                  assumptions={homeResult.assumptions}
                  source={homeResult.emissionFactorSource}
                />
              </div>
            )}

            {/* ── Transport ── */}
            {activeTab === "transport" && (
              <div className="space-y-5">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">🚗 Transport</h2>
                <RadioGroup
                  label="Vehicle type"
                  value={vehicleType}
                  onChange={(v) => setVehicleType(v as "petrol" | "diesel" | "hybrid" | "electric" | "none")}
                  options={[
                    { value: "petrol", label: "Petrol" },
                    { value: "diesel", label: "Diesel" },
                    { value: "hybrid", label: "Hybrid" },
                    { value: "electric", label: "Electric" },
                    { value: "none", label: "No car" },
                  ]}
                  cols={3}
                />
                {vehicleType !== "none" && (
                  <Slider
                    label="Weekly driving distance"
                    value={weeklyCarKm}
                    min={0}
                    max={1500}
                    step={10}
                    unit=" km"
                    onChange={setWeeklyCarKm}
                    formatValue={(v) => `${v} km`}
                  />
                )}
                <Slider
                  label="Weekly public transport distance"
                  value={weeklyPtKm}
                  min={0}
                  max={500}
                  step={5}
                  unit=" km"
                  onChange={setWeeklyPtKm}
                  formatValue={(v) => `${v} km`}
                  hint="Bus, metro, train — combined"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Short-haul flights/year"
                    type="number"
                    value={shortFlights}
                    onChange={(e) => setShortFlights(Number(e.target.value))}
                    hint="Return trips under ~3h"
                    min={0}
                  />
                  <Input
                    label="Long-haul flights/year"
                    type="number"
                    value={longFlights}
                    onChange={(e) => setLongFlights(Number(e.target.value))}
                    hint="Return trips over ~3h"
                    min={0}
                  />
                </div>
                <ResultBox
                  label="Yearly transport emissions"
                  value={transportResult.totalKgCO2eYearly}
                  color="#3b82f6"
                  assumptions={transportResult.assumptions}
                  source="UK DESNZ 2023"
                />
              </div>
            )}

            {/* ── Food ── */}
            {activeTab === "food" && (
              <div className="space-y-5">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">🥗 Food & Diet</h2>
                <RadioGroup
                  label="Diet type"
                  value={dietType}
                  onChange={(v) => setDietType(v as "vegan" | "vegetarian" | "flexitarian" | "omnivore" | "heavy_meat")}
                  options={[
                    { value: "vegan", label: "Vegan" },
                    { value: "vegetarian", label: "Vegetarian" },
                    { value: "flexitarian", label: "Flexitarian" },
                    { value: "omnivore", label: "Omnivore" },
                    { value: "heavy_meat", label: "Heavy meat" },
                  ]}
                  cols={3}
                />
                <Slider
                  label="Local/seasonal food share"
                  value={localPct}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={setLocalPct}
                  formatValue={(v) => `~${v}%`}
                  hint="Reduces transport emissions — small but real effect"
                />
                <Slider
                  label="Food waste"
                  value={wastePct}
                  min={0}
                  max={60}
                  step={5}
                  unit="%"
                  onChange={setWastePct}
                  formatValue={(v) => `~${v}% wasted`}
                  hint="% of food you buy that ends up thrown away"
                />
                <ResultBox
                  label="Yearly food emissions"
                  value={foodResult.totalKgCO2eYearly}
                  color="#22c55e"
                  assumptions={foodResult.assumptions}
                  source={foodResult.dietSource}
                />
              </div>
            )}

            {/* ── Waste ── */}
            {activeTab === "waste" && (
              <div className="space-y-5">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">♻️ Waste</h2>
                <Slider
                  label="Weekly household waste"
                  value={weeklyWasteKg}
                  min={1}
                  max={30}
                  step={0.5}
                  unit=" kg"
                  onChange={setWeeklyWasteKg}
                  formatValue={(v) => `${v} kg`}
                  hint="UK avg ~7 kg/person/week including recycling"
                />
                <Slider
                  label="Recycling rate"
                  value={recyclingPct}
                  min={0}
                  max={90}
                  step={5}
                  unit="%"
                  onChange={setRecyclingPct}
                  formatValue={(v) => `${v}%`}
                />
                <Slider
                  label="Composting rate"
                  value={compostPct}
                  min={0}
                  max={50}
                  step={5}
                  unit="%"
                  onChange={setCompostPct}
                  formatValue={(v) => `${v}%`}
                  hint="Food scraps composted rather than landfilled"
                />
                <ResultBox
                  label="Yearly waste emissions"
                  value={wasteResult.totalKgCO2eYearly}
                  color="#a855f7"
                  assumptions={wasteResult.assumptions}
                  source="EPA WARM Model 2023"
                />
              </div>
            )}

            {/* ── Purchases ── */}
            {activeTab === "purchases" && (
              <div className="space-y-5">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100">🛍️ Purchases</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Spend-based approach using USEEIO v2.0 emission intensities (EPA). Enter monthly spend in USD.
                </p>
                <Input
                  label="Monthly clothing spend"
                  type="number"
                  value={clothingSpend}
                  onChange={(e) => setClothingSpend(Number(e.target.value))}
                  suffix="USD"
                  hint="New clothes, shoes, accessories"
                  min={0}
                />
                <Input
                  label="Monthly electronics spend"
                  type="number"
                  value={electronicsSpend}
                  onChange={(e) => setElectronicsSpend(Number(e.target.value))}
                  suffix="USD"
                  hint="Phones, laptops, gadgets"
                  min={0}
                />
                <Input
                  label="Monthly other goods spend"
                  type="number"
                  value={otherSpend}
                  onChange={(e) => setOtherSpend(Number(e.target.value))}
                  suffix="USD"
                  hint="Furniture, household items, hobbies"
                  min={0}
                />
                <ResultBox
                  label="Yearly purchases emissions"
                  value={purchasesResult.totalKgCO2eYearly}
                  color="#ec4899"
                  assumptions={purchasesResult.assumptions}
                  source="USEEIO v2.0"
                />
              </div>
            )}
          </Card>
        </div>

        {/* ── Live summary sidebar ── */}
        <div className="space-y-5">
          {/* Total */}
          <Card className="bg-gradient-to-br from-forest-600 to-forest-700 border-0 text-white">
            <p className="text-sm text-forest-200">Total annual footprint</p>
            <p className="mt-1 text-5xl font-black tracking-tight">
              {totalYearly >= 1000
                ? `${(totalYearly / 1000).toFixed(1)}t`
                : `${totalYearly.toFixed(0)}`}
            </p>
            <p className="text-sm text-forest-200">
              {totalYearly >= 1000 ? "" : "kg "}CO₂e per year
            </p>
          </Card>

          {/* Pie chart */}
          <Card>
            <h3 className="mb-3 font-semibold text-stone-900 dark:text-stone-100">Breakdown</h3>
            <CategoryPieChart summary={summary} />
          </Card>

          {/* Save button */}
          <Card>
            <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
              Save this calculation to track your progress over time.
            </p>
            <Button
              fullWidth
              onClick={saveEntry}
              loading={saving}
              variant={saved ? "secondary" : "primary"}
            >
              {saved ? "✓ Saved to history!" : "Save to my history"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ResultBox({
  label,
  value,
  yearly,
  color,
  assumptions,
  source,
}: {
  label: string;
  value: number;
  yearly?: number;
  color: string;
  assumptions?: string[];
  source?: string;
}) {
  const [showAssumptions, setShowAssumptions] = useState(false);

  return (
    <div className="rounded-xl border-2 p-4" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-600 dark:text-stone-400">{label}</p>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color }}>
            {formatKgCO2e(value)}
          </p>
          {yearly !== undefined && yearly !== value && (
            <p className="text-xs text-stone-500">
              {formatKgCO2e(yearly)}/yr
            </p>
          )}
        </div>
      </div>

      {source && (
        <p className="mt-2 text-xs text-stone-400">Source: {source}</p>
      )}

      {assumptions && assumptions.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            {showAssumptions ? "Hide" : "Show"} assumptions ({assumptions.length})
          </button>
          {showAssumptions && (
            <ul className="mt-2 space-y-1">
              {assumptions.map((a, i) => (
                <li key={i} className="text-xs text-stone-500 dark:text-stone-400">
                  • {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
