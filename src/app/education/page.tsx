"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";

const LEARN_CARDS = [
  {
    id: "co2e",
    icon: "🔬",
    title: "What is CO₂e?",
    summary: "The universal unit for measuring greenhouse gas emissions.",
    content: `CO₂e stands for "carbon dioxide equivalent." It's a way to express the warming effect of all greenhouse gases — CO₂, methane (CH₄), nitrous oxide (N₂O), and others — using a single number.

Because different gases have different warming effects, scientists use a "global warming potential" (GWP) factor to convert them. Methane is ~80× more potent than CO₂ over 20 years, so 1 kg of methane = 80 kg CO₂e.

When you see your footprint expressed as "kg CO₂e," it already accounts for all the gases your activities produce.

📚 Source: IPCC Sixth Assessment Report (AR6), 2021`,
    category: "basics",
  },
  {
    id: "avg",
    icon: "🌍",
    title: "Global vs national averages",
    summary: "Not all carbon footprints are equal — and the gap is enormous.",
    content: `The global average personal carbon footprint is about 6.6 tonnes CO₂e per year (World Bank, 2022). But this hides a massive range:

• USA: ~17.6 t CO₂e/year
• EU average: ~9.0 t CO₂e/year  
• UK: ~10.0 t CO₂e/year
• India: ~2.3 t CO₂e/year
• Global 1.5°C-compatible target: ~2.0 t CO₂e/year

People in wealthy nations typically have 5–10× the footprint of those in developing countries. This comes from more flying, bigger homes, car ownership, and higher consumption.

📚 Source: University of Michigan Carbon Footprint Factsheet 2023`,
    category: "basics",
  },
  {
    id: "transport",
    icon: "✈️",
    title: "Why transport matters so much",
    summary: "Flying and driving are the two biggest individual levers.",
    content: `Transport is typically the largest or second-largest personal emission category. Here's why:

A single long-haul return flight can emit 1,000–2,000 kg CO₂e — equivalent to months of home energy use. Aviation is particularly impactful because emissions happen at altitude, increasing their warming effect.

Cars: A petrol car emits ~192 g CO₂e per km. An average UK driver covers ~12,000 km/year = ~2.3 t CO₂e. Switching to an EV on a typical grid cuts this by 60–80%.

What you can do:
• Replace one flight per year with train travel
• Cycle or walk for trips under 5 km
• Switch to an EV or hybrid when replacing your car
• Combine car trips

📚 Sources: UK DESNZ 2023, EPA 2024`,
    category: "transportation",
  },
  {
    id: "food",
    icon: "🥩",
    title: "Food and the climate connection",
    summary: "What we eat accounts for about 26% of global emissions.",
    content: `The global food system produces roughly 26% of all greenhouse gas emissions (Poore & Nemecek, 2018). This comes from:

• Land use change (clearing forests for farmland)
• Methane from livestock
• Fertiliser production
• Transport and processing

Beef is the single highest-impact food: ~60 kg CO₂e per kg. Contrast this with legumes at ~0.9 kg CO₂e/kg — a 65× difference.

Moving from an average omnivore diet to a flexitarian diet saves about 360 kg CO₂e per person per year (Scarborough et al., 2023, Nature Food).

Reducing food waste also matters: food wasted in landfill generates methane. The UN estimates ~8% of global emissions come from food loss and waste.

📚 Sources: Poore & Nemecek 2018 (Science), Scarborough et al. 2023 (Nature Food), FAO 2022`,
    category: "food",
  },
  {
    id: "home",
    icon: "⚡",
    title: "Home energy and heating",
    summary: "Heating and electricity often make up 20–30% of your footprint.",
    content: `Home energy comes from two sources: electricity and heat.

Electricity: The carbon intensity varies enormously by country. France (mostly nuclear) emits ~52 g CO₂e/kWh. India emits ~713 g CO₂e/kWh. This is why switching to a green energy tariff can have a large impact in high-intensity grids.

Heating: Gas boilers are common but carbon-intensive. A heat pump is 3–4× more efficient — it moves heat rather than generating it — meaning the same unit of warmth produces far less CO₂.

Quick wins:
• Switch to a renewable electricity tariff
• Lower your thermostat by 1°C (saves ~10% on heating)
• Replace incandescent bulbs with LEDs
• Switch off appliances at the plug (not just standby)

Long-term:
• Install a heat pump (when replacing a boiler)
• Add loft or wall insulation
• Install rooftop solar

📚 Sources: IEA 2023, UK DESNZ 2023, US DOE 2023`,
    category: "home_energy",
  },
  {
    id: "waste",
    icon: "🗑️",
    title: "Waste and the methane problem",
    summary: "It's not just about recycling — landfill methane is a major issue.",
    content: `Waste produces emissions in two main ways:

1. Landfill methane: When food and other organic waste breaks down in landfill without oxygen, it produces methane — a gas 80× more potent than CO₂ over 20 years. This makes landfill a significant climate problem.

2. Manufacturing emissions: Everything we throw away had to be produced. The more we consume and discard, the more manufacturing emissions we cause upstream.

What actually helps:
• Recycling (reduces manufacturing need)
• Composting food waste (eliminates landfill methane)
• Buying less (avoids the emissions of production)
• Repairing and reusing items

The "Reduce → Reuse → Recycle" hierarchy exists for a reason: reducing consumption is more effective than recycling.

📚 Source: EPA WARM Model 2023, IPCC AR6`,
    category: "waste",
  },
  {
    id: "consumption",
    icon: "🛍️",
    title: "The hidden emissions of what we buy",
    summary: "Every purchase carries embedded carbon from its production and transport.",
    content: `Every product has a "lifecycle emissions" footprint — the total CO₂e from raw materials through manufacturing, transport, use, and disposal.

Some examples (approximate):
• Smartphone: ~70 kg CO₂e (mostly manufacturing)
• Pair of jeans: ~33 kg CO₂e
• New car: ~6–35 tonnes CO₂e
• A cotton T-shirt: ~5–8 kg CO₂e

The "consumption" category in your footprint uses spend-based emission factors — a proven method used by government agencies (USEEIO) when product-level data isn't available.

What you can do:
• Keep electronics for 2+ extra years
• Buy second-hand clothing and furniture
• Choose quality over quantity
• Repair rather than replace

📚 Source: USEEIO v2.0 (EPA), lifecycle analysis studies`,
    category: "purchases",
  },
  {
    id: "myths",
    icon: "🤔",
    title: "Common myths debunked",
    summary: "Some things you've heard about carbon footprints that aren't quite right.",
    content: `Myth 1: "Individual action doesn't matter — it's up to corporations."
Reality: Household consumption drives 60–70% of global emissions (via demand). Individual choices create market signals and shape norms. Both systemic and individual action matter.

Myth 2: "Local food is always better for the climate."
Reality: Transport accounts for only ~6% of food emissions. What you eat matters far more than where it's from. Locally produced beef still emits far more than imported lentils.

Myth 3: "Recycling solves the waste problem."
Reality: Recycling helps, but reducing consumption is more effective. Only ~9% of all plastic ever produced has been recycled (Science, 2017).

Myth 4: "Electric cars have a bigger footprint than petrol cars due to battery production."
Reality: Lifecycle studies consistently show EVs produce 50–70% less CO₂e over their lifetime, even on today's grids. The manufacturing carbon debt is typically repaid within 1–3 years of driving.

📚 Sources: Poore & Nemecek 2018, IEA EV Outlook 2023, Science 2017`,
    category: "basics",
  },
  {
    id: "daily",
    icon: "📅",
    title: "10 daily actions that actually work",
    summary: "Practical, evidence-based steps you can start today.",
    content: `1. 🚶 Walk or cycle for trips under 2 km — zero emissions, better health.
2. 🌡️ Lower your thermostat by 1°C — saves ~10% on heating and ~200 kg CO₂e/year.
3. 🥗 Swap one meat meal per week for plant-based — saves ~50 kg CO₂e/year.
4. 💡 Switch off devices at the plug (not standby) — eliminates phantom loads.
5. 🛒 Plan meals and use a shopping list — halves food waste.
6. 🌿 Check if your energy supplier offers a green tariff — takes 10 minutes online.
7. 📦 Choose slower shipping when buying online — reduces air freight emissions.
8. 🔧 Repair before replacing — extends product life and cuts manufacturing emissions.
9. 🚿 Take shorter showers — hot water heating is a hidden energy cost.
10. 📢 Talk about it — social norms shift when people discuss sustainable choices.

None of these require perfection. Consistent small actions add up.`,
    category: "basics",
  },
];

const CATEGORIES = [
  { id: "all", label: "All topics" },
  { id: "basics", label: "The basics" },
  { id: "transportation", label: "Transport" },
  { id: "home_energy", label: "Home energy" },
  { id: "food", label: "Food" },
  { id: "waste", label: "Waste" },
  { id: "purchases", label: "Purchases" },
];

export default function EducationPage() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = LEARN_CARDS.filter(
    (c) => filter === "all" || c.category === filter,
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Learning Hub</h1>
        <p className="section-subtitle">
          Understand the science behind carbon emissions — clearly, without jargon.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === cat.id
                ? "bg-forest-600 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Learn cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((card) => (
          <div
            key={card.id}
            className={`cursor-pointer rounded-2xl border bg-white transition-all dark:bg-stone-900 ${
              expanded === card.id
                ? "border-forest-300 shadow-card-hover dark:border-forest-700 sm:col-span-2 lg:col-span-3"
                : "border-stone-200 hover:shadow-card-hover dark:border-stone-700"
            }`}
            onClick={() => setExpanded(expanded === card.id ? null : card.id)}
          >
            <div className="p-5">
              <div className="mb-3 flex items-start gap-3">
                <span className="text-3xl" aria-hidden>{card.icon}</span>
                <div>
                  <h2 className="font-semibold text-stone-900 dark:text-stone-100">{card.title}</h2>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{card.summary}</p>
                </div>
                <span className="ml-auto text-stone-400 text-sm" aria-hidden>
                  {expanded === card.id ? "↑" : "↓"}
                </span>
              </div>

              {expanded === card.id && (
                <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
                  <div className="prose prose-sm max-w-none text-stone-700 dark:text-stone-300">
                    {card.content.split("\n").map((line, i) => (
                      line.trim() === "" ? (
                        <br key={i} />
                      ) : (
                        <p key={i} className="mb-2 text-sm leading-relaxed">
                          {line}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-stone-900 dark:text-white">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {[
            {
              q: "How accurate are my footprint numbers?",
              a: "The calculations use published emission factors from EPA, IPCC, UK DESNZ, IEA, and peer-reviewed science. They're good estimates, not exact figures — individual behaviour varies. We show all assumptions so you can see what's behind each number.",
            },
            {
              q: "Why does Ecotrack use kg CO₂e rather than just CO₂?",
              a: "Your activities produce multiple greenhouse gases — methane from food, nitrous oxide from waste, CO₂ from fuel. CO₂e converts all of these to a single comparable unit using each gas's global warming potential (GWP), as defined by the IPCC.",
            },
            {
              q: "What's the difference between Scope 1, 2, and 3 emissions?",
              a: "Scope 1 is direct emissions (e.g. burning gas in your boiler). Scope 2 is indirect from electricity use. Scope 3 is everything else in your supply chain — the emissions from making the food you eat or the phone you bought. Ecotrack covers all three for individual lifestyles.",
            },
            {
              q: "Is AI used to calculate my footprint?",
              a: "No. Your footprint is calculated using deterministic formulas and published emission factors — not AI. Google Gemini AI is used only for personalised summaries, explanations, and coaching tips. This distinction is important: the numbers are always traceable to their sources.",
            },
          ].map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
            >
              <summary className="cursor-pointer font-medium text-stone-800 dark:text-stone-200 list-none flex justify-between items-center">
                {faq.q}
                <span className="ml-3 shrink-0 text-stone-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
