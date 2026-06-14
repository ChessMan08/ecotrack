// ── Core domain types ────────────────────────────────────────────────────────

export type EmissionCategory =
  | "home_energy"
  | "transportation"
  | "food"
  | "waste"
  | "purchases";

export type TimePeriod = "weekly" | "monthly" | "yearly";

export type DietType =
  | "vegan"
  | "vegetarian"
  | "flexitarian"
  | "omnivore"
  | "heavy_meat";

export type VehicleType =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "electric"
  | "none";

export type HomeType = "apartment" | "house" | "studio";

export type HeatingType =
  | "natural_gas"
  | "electricity"
  | "oil"
  | "heat_pump"
  | "wood"
  | "district";

export type FlightFrequency = "none" | "1-2" | "3-5" | "6-10" | "10+";

// ── User profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  onboardingComplete: boolean;
  lifestyle: LifestyleProfile;
  preferences: UserPreferences;
}

export interface LifestyleProfile {
  location: string; // country code
  householdSize: number;
  homeType: HomeType;
  heatingType: HeatingType;
  electricityGreenPercentage: number; // 0-100
  homeSizeM2: number;
  vehicleType: VehicleType;
  weeklyDrivingKm: number;
  flightFrequency: FlightFrequency;
  dietType: DietType;
  localFoodPercentage: number; // 0-100
  foodWasteLevel: "low" | "medium" | "high";
  recyclingLevel: "none" | "some" | "most" | "all";
  shoppingFrequency: "minimal" | "average" | "frequent";
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  defaultPeriod: TimePeriod;
  weeklyReminders: boolean;
  currency: string;
  units: "metric" | "imperial";
}

// ── Emissions entries ─────────────────────────────────────────────────────────

export interface EmissionEntry {
  id: string;
  uid: string;
  category: EmissionCategory;
  subcategory: string;
  kgCO2e: number;
  label: string;
  inputData: Record<string, number | string>;
  calculationNote: string;
  date: string; // ISO
  period: TimePeriod;
  isEstimated: boolean;
  emissionFactor: string; // source citation
}

export interface CategorySummary {
  category: EmissionCategory;
  label: string;
  kgCO2e: number;
  percentage: number;
  trend: number; // % change vs previous period
  color: string;
  icon: string;
}

export interface FootprintSummary {
  totalKgCO2e: number;
  period: TimePeriod;
  categories: CategorySummary[];
  vsGlobalAverage: number; // % difference
  vsNationalAverage: number; // % difference
  comparisonLabel: string;
  generatedAt: string;
}

// ── Goals ────────────────────────────────────────────────────────────────────

export type GoalStatus = "active" | "completed" | "paused" | "abandoned";

export interface Goal {
  id: string;
  uid: string;
  title: string;
  description: string;
  category: EmissionCategory | "overall";
  targetKgCO2e: number;
  currentKgCO2e: number;
  baselineKgCO2e: number;
  period: TimePeriod;
  startDate: string;
  endDate?: string;
  status: GoalStatus;
  createdAt: string;
  progressPercent: number;
}

// ── Actions / Recommendations ─────────────────────────────────────────────────

export type ActionStatus = "suggested" | "planned" | "done" | "dismissed";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface Action {
  id: string;
  uid: string;
  category: EmissionCategory;
  title: string;
  description: string;
  whyItMatters: string;
  estimatedKgCO2eSaved: number; // per year
  difficultyLevel: DifficultyLevel;
  timeToAdopt: string; // e.g. "1 week", "immediate"
  status: ActionStatus;
  createdAt: string;
  completedAt?: string;
  aiGenerated: boolean;
  sourceLabel?: string;
}

// ── AI Insights ───────────────────────────────────────────────────────────────

export interface AIInsight {
  id: string;
  uid: string;
  type: "summary" | "tip" | "focus" | "explanation" | "encouragement";
  content: string;
  category?: EmissionCategory;
  generatedAt: string;
  thumbsUp?: boolean;
  thumbsDown?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface TrendDataPoint {
  date: string;
  kgCO2e: number;
  label: string;
}

export interface DashboardData {
  footprintSummary: FootprintSummary;
  trendData: TrendDataPoint[];
  topActions: Action[];
  activeGoals: Goal[];
  recentEntries: EmissionEntry[];
  aiInsight?: AIInsight;
  streak: number;
  lastUpdated: string;
}

// ── Calculator inputs ─────────────────────────────────────────────────────────

export interface HomeEnergyInput {
  monthlyElectricityKwh: number;
  monthlyGasM3?: number;
  monthlyGasKwh?: number;
  heatingType: HeatingType;
  greenEnergyPercent: number;
  householdSize: number;
  location: string;
}

export interface TransportInput {
  weeklyCarKm: number;
  vehicleType: VehicleType;
  fuelEfficiencyL100km?: number;
  weeklyPublicTransportKm: number;
  weeklyFlightsShortHaul: number; // number per year
  weeklyFlightsLongHaul: number;  // number per year
  weeklyMotorbikeKm: number;
}

export interface FoodInput {
  dietType: DietType;
  householdSize: number;
  localFoodPercent: number;
  foodWastePercent: number;
  weeklyMeatMeals: number;
  weeklyDairyServings: number;
}

export interface WasteInput {
  weeklyWasteKg: number;
  recyclingPercent: number;
  compostingPercent: number;
  householdSize: number;
}

export interface PurchasesInput {
  monthlySpendClothing: number;
  monthlySpendElectronics: number;
  monthlySpendOther: number;
  currency: string;
}

// ── Emission factors (with source citations) ─────────────────────────────────

export interface EmissionFactor {
  value: number; // kg CO2e per unit
  unit: string;
  source: string;
  year: number;
  region?: string;
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  fields: OnboardingField[];
}

export interface OnboardingField {
  key: keyof LifestyleProfile;
  label: string;
  hint: string;
  type: "select" | "number" | "range" | "radio";
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  defaultValue: string | number;
}

// ── Education ─────────────────────────────────────────────────────────────────

export interface LearnCard {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: EmissionCategory | "basics";
  readTimeMin: number;
  tags: string[];
}

// ── Report / Export ──────────────────────────────────────────────────────────

export interface ReportData {
  user: Pick<UserProfile, "displayName" | "email">;
  summary: FootprintSummary;
  goals: Goal[];
  topActions: Action[];
  trendData: TrendDataPoint[];
  generatedAt: string;
}
