"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firebase";
import { COUNTRIES } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Select, RadioGroup, Slider } from "@/components/ui/Input";
import type { LifestyleProfile } from "@/types";

const defaultLifestyle: LifestyleProfile = {
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

const STEPS = [
  {
    id: "home",
    title: "Where do you live?",
    subtitle: "This sets the right electricity grid intensity for your location.",
    icon: "🏠",
  },
  {
    id: "energy",
    title: "Home energy",
    subtitle: "How you heat and power your home is often the biggest emission source.",
    icon: "⚡",
  },
  {
    id: "transport",
    title: "How do you get around?",
    subtitle: "Transport is the second-largest personal emission category on average.",
    icon: "🚗",
  },
  {
    id: "food",
    title: "What do you eat?",
    subtitle: "Food systems account for ~26% of global emissions.",
    icon: "🥗",
  },
  {
    id: "lifestyle",
    title: "Shopping & waste",
    subtitle: "What we buy and throw away matters more than most people realise.",
    icon: "🛍️",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [lifestyle, setLifestyle] = useState<LifestyleProfile>(defaultLifestyle);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof LifestyleProfile>(key: K, value: LifestyleProfile[K]) {
    setLifestyle((prev) => ({ ...prev, [key]: value }));
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        lifestyle,
        onboardingComplete: true,
      });
      await refreshProfile();
      router.replace("/dashboard");
    } catch {
      setSaving(false);
    }
  }

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
              Step {step + 1} of {STEPS.length}
            </span>
            <button
              onClick={() => router.replace("/dashboard")}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              Skip for now →
            </button>
          </div>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-forest-500" : "bg-stone-200 dark:bg-stone-700"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-card dark:border-stone-700 dark:bg-stone-900">
          {/* Step header */}
          <div className="mb-7">
            <div className="mb-3 text-4xl">{currentStep.icon}</div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{currentStep.title}</h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{currentStep.subtitle}</p>
          </div>

          {/* Step content */}
          <div className="space-y-5">
            {step === 0 && (
              <>
                <Select
                  label="Country"
                  hint="Used to apply the right electricity grid emission factor"
                  value={lifestyle.location}
                  onChange={(e) => update("location", e.target.value)}
                  options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                />
                <Slider
                  label="People in your household"
                  value={lifestyle.householdSize}
                  min={1}
                  max={8}
                  onChange={(v) => update("householdSize", v)}
                  hint="Including yourself"
                  formatValue={(v) => `${v} ${v === 1 ? "person" : "people"}`}
                />
                <RadioGroup
                  label="Home type"
                  value={lifestyle.homeType}
                  onChange={(v) => update("homeType", v)}
                  options={[
                    { value: "apartment", label: "Apartment / flat" },
                    { value: "house", label: "House" },
                    { value: "studio", label: "Studio / bedsit" },
                  ]}
                />
              </>
            )}

            {step === 1 && (
              <>
                <RadioGroup
                  label="Primary heating source"
                  value={lifestyle.heatingType}
                  onChange={(v) => update("heatingType", v)}
                  options={[
                    { value: "natural_gas", label: "Natural gas" },
                    { value: "electricity", label: "Electric (resistance)" },
                    { value: "heat_pump", label: "Heat pump" },
                    { value: "oil", label: "Heating oil" },
                    { value: "wood", label: "Wood / biomass" },
                    { value: "district", label: "District heating" },
                  ]}
                  cols={2}
                />
                <Slider
                  label="Green / renewable electricity"
                  value={lifestyle.electricityGreenPercentage}
                  min={0}
                  max={100}
                  step={10}
                  unit="%"
                  onChange={(v) => update("electricityGreenPercentage", v)}
                  hint="Check your energy bill or tariff — if unsure, leave at 0"
                  formatValue={(v) => `${v}%`}
                />
              </>
            )}

            {step === 2 && (
              <>
                <RadioGroup
                  label="Main vehicle type"
                  value={lifestyle.vehicleType}
                  onChange={(v) => update("vehicleType", v)}
                  options={[
                    { value: "petrol", label: "Petrol / gasoline" },
                    { value: "diesel", label: "Diesel" },
                    { value: "hybrid", label: "Hybrid" },
                    { value: "electric", label: "Electric (EV)" },
                    { value: "none", label: "No car" },
                  ]}
                  cols={2}
                />
                {lifestyle.vehicleType !== "none" && (
                  <Slider
                    label="Weekly driving distance"
                    value={lifestyle.weeklyDrivingKm}
                    min={0}
                    max={1000}
                    step={10}
                    unit=" km"
                    onChange={(v) => update("weeklyDrivingKm", v)}
                    hint="Rough estimate is fine"
                    formatValue={(v) => `${v} km`}
                  />
                )}
                <RadioGroup
                  label="Flights per year (return trips)"
                  value={lifestyle.flightFrequency}
                  onChange={(v) => update("flightFrequency", v)}
                  options={[
                    { value: "none", label: "None" },
                    { value: "1-2", label: "1–2" },
                    { value: "3-5", label: "3–5" },
                    { value: "6-10", label: "6–10" },
                    { value: "10+", label: "10+" },
                  ]}
                  cols={3}
                />
              </>
            )}

            {step === 3 && (
              <>
                <RadioGroup
                  label="Diet type"
                  hint="Choose the closest description"
                  value={lifestyle.dietType}
                  onChange={(v) => update("dietType", v)}
                  options={[
                    { value: "vegan", label: "Vegan", description: "No animal products" },
                    { value: "vegetarian", label: "Vegetarian", description: "No meat or fish" },
                    { value: "flexitarian", label: "Flexitarian", description: "Mostly plant-based" },
                    { value: "omnivore", label: "Omnivore", description: "Meat most days" },
                    { value: "heavy_meat", label: "Heavy meat", description: "Meat every meal" },
                  ]}
                  cols={2}
                />
                <Slider
                  label="Locally grown food"
                  value={lifestyle.localFoodPercentage}
                  min={0}
                  max={100}
                  step={10}
                  unit="%"
                  onChange={(v) => update("localFoodPercentage", v)}
                  hint="Farmers markets, local produce, home-grown, etc."
                  formatValue={(v) => `~${v}%`}
                />
                <RadioGroup
                  label="Food waste level"
                  value={lifestyle.foodWasteLevel}
                  onChange={(v) => update("foodWasteLevel", v)}
                  options={[
                    { value: "low", label: "Low", description: "I rarely throw food away" },
                    { value: "medium", label: "Medium", description: "Some waste occasionally" },
                    { value: "high", label: "High", description: "Regular waste" },
                  ]}
                  cols={3}
                />
              </>
            )}

            {step === 4 && (
              <>
                <RadioGroup
                  label="Recycling level"
                  value={lifestyle.recyclingLevel}
                  onChange={(v) => update("recyclingLevel", v)}
                  options={[
                    { value: "none", label: "None", description: "Everything to landfill" },
                    { value: "some", label: "Some", description: "A few things" },
                    { value: "most", label: "Most", description: "Most recyclables" },
                    { value: "all", label: "Almost all", description: "Careful sorter" },
                  ]}
                  cols={2}
                />
                <RadioGroup
                  label="New purchases frequency"
                  value={lifestyle.shoppingFrequency}
                  onChange={(v) => update("shoppingFrequency", v)}
                  options={[
                    { value: "minimal", label: "Minimal", description: "Only essentials" },
                    { value: "average", label: "Average", description: "Regular shopper" },
                    { value: "frequent", label: "Frequent", description: "Regular new buys" },
                  ]}
                  cols={3}
                />
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next →
              </Button>
            ) : (
              <Button onClick={finish} loading={saving}>
                View my footprint →
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          You can update any of these later in your profile settings.
        </p>
      </div>
    </div>
  );
}
