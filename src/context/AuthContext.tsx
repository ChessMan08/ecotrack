"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  auth,
  onAuthStateChanged,
  getUserProfile,
  createUserProfile,
  type User,
} from "@/lib/firebase";
import type { UserProfile, LifestyleProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
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
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: User) => {
    try {
      let data = await getUserProfile(u.uid);
      if (!data) {
        // First login — create profile
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
        await createUserProfile(u.uid, newProfile);
        data = newProfile;
      }
      setProfile({ ...data, uid: u.uid } as UserProfile);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }, []);

  async function refreshProfile() {
    if (!user) return;
    await loadProfile(user);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
