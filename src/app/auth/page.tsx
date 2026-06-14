"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!isValidEmail(email)) e.email = "Enter a valid email address";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (mode === "signup" && !name.trim()) e.name = "Enter your name";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, name.trim());
      } else {
        await signInWithEmail(email, password);
      }
      router.replace("/onboarding");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email-already-in-use")) setAuthError("An account with this email already exists.");
      else if (msg.includes("wrong-password") || msg.includes("user-not-found")) setAuthError("Incorrect email or password.");
      else if (msg.includes("too-many-requests")) setAuthError("Too many attempts. Try again later.");
      else setAuthError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setAuthError("");
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace("/onboarding");
    } catch {
      setAuthError("Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-stone-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-600 text-white shadow-glow-green mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="2">
              <path d="M12 3C7 3 3 7.9 3 12s3 9 9 9 9-3.5 9-8-3-9-9-9z" />
              <path d="M12 8v8M9 11l3-3 3 3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Ecotrack</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-card dark:border-stone-700 dark:bg-stone-900">
          {/* Google button */}
          <Button
            variant="outline"
            fullWidth
            onClick={handleGoogle}
            loading={busy}
            className="mb-6"
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-stone-400 dark:bg-stone-900">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === "signup" && (
              <Input
                label="Full name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rachana Sharma"
                error={errors.name}
                required
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              error={errors.password}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />

            {authError && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400" role="alert">
                {authError}
              </div>
            )}

            <Button type="submit" fullWidth loading={busy} size="lg">
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-500 dark:text-stone-400">
            {mode === "signup" ? "Already have an account?" : "New to Ecotrack?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-medium text-forest-700 hover:underline dark:text-forest-400"
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          By continuing, you agree to our terms. Your data is encrypted and never sold.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
