"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  createUserProfile,
  type User,
} from "@/lib/firebase";
import { calculateFullFootprint, buildFootprintSummary } from "@/lib/calculator";
import type { UserProfile, LifestyleProfile, FootprintSummary } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  summary: FootprintSummary | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

const defaultLifestyle: LifestyleProfile = {
  location: "GLOBAL",
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

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  summary: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
});

/** Maximum time (ms) to wait for auth + profile before forcing render */
const AUTH_TIMEOUT_MS = 12_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (u: User) => {
    try {
      setError(null);
      let data = await getUserProfile(u.uid);
      if (!data) {
        // First login — create profile with safe defaults
        const newProfile: Omit<UserProfile, "uid"> = {
          email: u.email ?? "",
          displayName: u.displayName ?? "User",
          photoURL: u.photoURL ?? undefined,
          createdAt: new Date().toISOString(),
          onboardingComplete: false,
          lifestyle: defaultLifestyle,
          preferences: {
            theme: "system",
            defaultPeriod: "yearly",
            weeklyReminders: false,
            currency: "USD",
            units: "metric",
          },
        };
        try {
          await createUserProfile(u.uid, newProfile);
        } catch (createErr) {
          console.error("Failed to create profile:", createErr);
          // Still use the local profile so the app renders
        }
        data = newProfile;
      }
      setProfile({ ...data, uid: u.uid } as UserProfile);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Failed to load your profile. Some features may be limited.");
      // Set a fallback profile so pages can still render
      setProfile({
        uid: u.uid,
        email: u.email ?? "",
        displayName: u.displayName ?? "User",
        photoURL: u.photoURL ?? undefined,
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
        lifestyle: defaultLifestyle,
        preferences: {
          theme: "system",
          defaultPeriod: "yearly",
          weeklyReminders: false,
          currency: "USD",
          units: "metric",
        },
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfile(user);
  }, [user, loadProfile]);

  useEffect(() => {
    // Safety timeout: if auth hasn't resolved in AUTH_TIMEOUT_MS, stop loading
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("Auth timeout — forcing app render");
          return false;
        }
        return prev;
      });
    }, AUTH_TIMEOUT_MS);

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [loadProfile]);

  const summary = useMemo(() => {
    if (!profile) return null;
    return buildFootprintSummary(calculateFullFootprint(profile.lifestyle));
  }, [profile]);

  return (
    <AuthContext.Provider value={{ user, profile, summary, loading, error, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
