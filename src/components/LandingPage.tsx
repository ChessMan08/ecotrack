"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const STATS = [
  { value: "6.6t", label: "Global average CO₂e per person/year", icon: "🌍" },
  { value: "17.6t", label: "US average — nearly 3× the global mean", icon: "🇺🇸" },
  { value: "2.0t", label: "1.5°C-compatible target by 2030", icon: "🎯" },
];

const HOW_STEPS = [
  {
    step: "1",
    icon: "🧮",
    title: "Calculate",
    desc: "Enter your energy use, travel, diet, and shopping habits. We compute your footprint using EPA and IPCC emission factors — no guesswork.",
  },
  {
    step: "2",
    icon: "📊",
    title: "Understand",
    desc: "See a clear breakdown of where your emissions come from, how you compare to global averages, and which categories have the biggest impact.",
  },
  {
    step: "3",
    icon: "⚡",
    title: "Act",
    desc: "Get a personalized action plan powered by Google Gemini. Mark actions as done, set goals, and watch your footprint shrink over time.",
  },
];

const FEATURES = [
  { icon: "🌿", title: "Science-backed calculations", desc: "EPA, IPCC, and IEA emission factors with full source citations." },
  { icon: "🤖", title: "Gemini AI insights", desc: "Personalized summaries and tips from Google's Gemini — not generic advice." },
  { icon: "📈", title: "Progress tracking", desc: "Charts and trends show your improvement over weeks and months." },
  { icon: "🎯", title: "Goal setting", desc: "Set weekly or monthly reduction targets and track your streaks." },
  { icon: "📚", title: "Education hub", desc: "Learn what CO₂e means, why it matters, and how everyday choices add up." },
  { icon: "🔒", title: "Private & secure", desc: "Firebase Auth and Firestore. Your data stays yours." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* ── Nav ── */}
      <header
        className={`sticky top-0 z-40 transition-shadow ${
          scrolled ? "shadow-sm bg-white/95 backdrop-blur dark:bg-stone-950/95" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                <path d="M12 3C7 3 3 7.9 3 12s3 9 9 9 9-3.5 9-8-3-9-9-9z" />
                <path d="M12 8v8M9 11l3-3 3 3" />
              </svg>
            </div>
            <span className="font-bold text-stone-900 dark:text-white">Ecotrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="rounded-xl bg-forest-600 px-4 py-2 text-sm font-medium text-white hover:bg-forest-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-20 md:pt-32">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-forest-100/60 blur-3xl dark:bg-forest-950/40" aria-hidden />
        <div className="pointer-events-none absolute -right-32 top-64 h-[400px] w-[400px] rounded-full bg-moss-100/60 blur-3xl dark:bg-moss-950/30" aria-hidden />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-4 py-1.5 text-sm text-forest-700 dark:border-forest-800 dark:bg-forest-950/60 dark:text-forest-300">
            <span>🌱</span>
            <span>Powered by Google Gemini + Firebase</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-stone-900 dark:text-white md:text-6xl lg:text-7xl">
            Know your{" "}
            <span className="bg-gradient-to-r from-forest-600 to-moss-500 bg-clip-text text-transparent">
              carbon footprint.
            </span>
            <br />
            Change it.
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-stone-600 dark:text-stone-400">
            Ecotrack calculates your personal CO₂ emissions from home energy, transport, food, and shopping — then shows you exactly how to reduce them with AI-powered guidance.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth?mode=signup"
              className="w-full rounded-2xl bg-forest-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-forest-700 active:bg-forest-800 transition-colors sm:w-auto"
            >
              Calculate my footprint →
            </Link>
            <Link
              href="/auth?demo=true"
              className="w-full rounded-2xl border border-stone-200 bg-white px-8 py-4 text-base font-semibold text-stone-700 hover:bg-stone-50 transition-colors dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 sm:w-auto"
            >
              Try demo
            </Link>
          </div>

          <p className="mt-4 text-xs text-stone-400">
            Free to use · No credit card · Data backed by EPA, IPCC, IEA sources
          </p>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-card dark:border-stone-700 dark:bg-stone-900 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.value} className="text-center">
                <div className="text-3xl" aria-hidden>{s.icon}</div>
                <div className="mt-1 text-2xl font-bold text-forest-700 dark:text-forest-400">{s.value}</div>
                <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-stone-400">
            Sources: World Bank 2022, EPA 2023, University of Michigan Carbon Footprint Factsheet 2023
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white px-4 py-20 dark:bg-stone-900">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-stone-900 dark:text-white">How it works</h2>
            <p className="mt-2 text-stone-500 dark:text-stone-400">Three steps from confusion to clarity</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div key={s.step} className="relative">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-50 text-2xl dark:bg-forest-950/40">
                    {s.icon}
                  </div>
                  <span className="text-4xl font-black text-stone-100 dark:text-stone-800 select-none">{s.step}</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-stone-900 dark:text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-stone-900 dark:text-white">
              Everything you need to act on climate
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1 font-semibold text-stone-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-forest-700 px-4 py-20 dark:bg-forest-900">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to understand your impact?
          </h2>
          <p className="mb-8 text-forest-200">
            It takes 3 minutes to see your carbon footprint breakdown. Start with what you know and fill in the rest later.
          </p>
          <Link
            href="/auth?mode=signup"
            className="inline-block rounded-2xl bg-white px-8 py-4 text-base font-semibold text-forest-800 hover:bg-forest-50 transition-colors shadow-lg"
          >
            Get started — it&apos;s free →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-200 bg-white px-4 py-8 dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-forest-600 text-white text-xs">🌿</div>
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Ecotrack</span>
          </div>
          <p className="text-xs text-stone-400">
            Emission factors: EPA GHG Hub 2024 · IPCC AR6 · IEA 2023 · Poore &amp; Nemecek 2018
          </p>
          <p className="text-xs text-stone-400">Built for the Google AI challenge</p>
        </div>
      </footer>
    </div>
  );
}
