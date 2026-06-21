"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firebase";
import { formatKgCO2e } from "@/lib/calculator";
import { COUNTRIES } from "@/lib/utils";
import { nanoid } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Select, RadioGroup, Slider } from "@/components/ui/Input";
import type { LifestyleProfile, ChatMessage } from "@/types";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "chat" | "export">("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lifestyle, setLifestyle] = useState<LifestyleProfile>(
    profile?.lifestyle ?? ({} as LifestyleProfile)
  );

  function update<K extends keyof LifestyleProfile>(key: K, value: LifestyleProfile[K]) {
    setLifestyle((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { lifestyle });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Profile & Settings</h1>
        <p className="section-subtitle">
          Keep your lifestyle profile accurate for better insights.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-900 w-fit">
        {[
          { id: "profile", label: "Lifestyle", icon: "👤" },
          { id: "chat", label: "AI Assistant", icon: "🤖" },
          { id: "export", label: "Export", icon: "📥" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "profile" | "chat" | "export")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-forest-600 text-white"
                : "text-stone-600 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-800"
            }`}
          >
            <span aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="space-y-5">
          <Card>
            <h2 className="mb-5 font-semibold text-stone-900 dark:text-stone-100">
              🏠 Home & Location
            </h2>
            <div className="space-y-4">
              <Select
                label="Country"
                value={lifestyle.location}
                onChange={(e) => update("location", e.target.value)}
                options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                hint="Sets your electricity grid emission factor"
              />
              <Slider
                label="Household size"
                value={lifestyle.householdSize}
                min={1}
                max={8}
                onChange={(v) => update("householdSize", v)}
                formatValue={(v) => `${v} ${v === 1 ? "person" : "people"}`}
              />
              <RadioGroup
                label="Heating type"
                value={lifestyle.heatingType}
                onChange={(v) => update("heatingType", v)}
                options={[
                  { value: "natural_gas", label: "Natural gas" },
                  { value: "electricity", label: "Electric" },
                  { value: "heat_pump", label: "Heat pump" },
                  { value: "oil", label: "Oil" },
                  { value: "wood", label: "Wood" },
                  { value: "district", label: "District" },
                ]}
                cols={3}
              />
              <Slider
                label="Green electricity"
                value={lifestyle.electricityGreenPercentage}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => update("electricityGreenPercentage", v)}
                formatValue={(v) => `${v}%`}
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-semibold text-stone-900 dark:text-stone-100">
              🚗 Transport
            </h2>
            <div className="space-y-4">
              <RadioGroup
                label="Vehicle type"
                value={lifestyle.vehicleType}
                onChange={(v) => update("vehicleType", v)}
                options={[
                  { value: "petrol", label: "Petrol" },
                  { value: "diesel", label: "Diesel" },
                  { value: "hybrid", label: "Hybrid" },
                  { value: "electric", label: "Electric" },
                  { value: "none", label: "No car" },
                ]}
                cols={3}
              />
              {lifestyle.vehicleType !== "none" && (
                <Slider
                  label="Weekly driving"
                  value={lifestyle.weeklyDrivingKm}
                  min={0}
                  max={1000}
                  step={10}
                  unit=" km"
                  onChange={(v) => update("weeklyDrivingKm", v)}
                  formatValue={(v) => `${v} km/wk`}
                />
              )}
              <RadioGroup
                label="Flights per year"
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
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-semibold text-stone-900 dark:text-stone-100">
              🥗 Food & Lifestyle
            </h2>
            <div className="space-y-4">
              <RadioGroup
                label="Diet"
                value={lifestyle.dietType}
                onChange={(v) => update("dietType", v)}
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
                label="Local food share"
                value={lifestyle.localFoodPercentage}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => update("localFoodPercentage", v)}
                formatValue={(v) => `~${v}%`}
              />
              <RadioGroup
                label="Food waste level"
                value={lifestyle.foodWasteLevel}
                onChange={(v) => update("foodWasteLevel", v)}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
                cols={3}
              />
              <RadioGroup
                label="Recycling level"
                value={lifestyle.recyclingLevel}
                onChange={(v) => update("recyclingLevel", v)}
                options={[
                  { value: "none", label: "None" },
                  { value: "some", label: "Some" },
                  { value: "most", label: "Most" },
                  { value: "all", label: "Almost all" },
                ]}
                cols={2}
              />
              <RadioGroup
                label="Shopping frequency"
                value={lifestyle.shoppingFrequency}
                onChange={(v) => update("shoppingFrequency", v)}
                options={[
                  { value: "minimal", label: "Minimal" },
                  { value: "average", label: "Average" },
                  { value: "frequent", label: "Frequent" },
                ]}
                cols={3}
              />
            </div>
          </Card>

          <Button
            fullWidth
            onClick={saveProfile}
            loading={saving}
            variant={saved ? "secondary" : "primary"}
            size="lg"
          >
            {saved ? "✓ Profile saved!" : "Save profile"}
          </Button>
        </div>
      )}

      {activeTab === "chat" && profile && (
        <AIChatPanel profile={profile.lifestyle} />
      )}

      {activeTab === "export" && profile && (
        <ExportPanel />
      )}
    </div>
  );
}

// ── AI Chat Panel ─────────────────────────────────────────────────────────────

function AIChatPanel({ profile }: { profile: LifestyleProfile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hi! I'm your Ecotrack climate coach powered by Google Gemini. Ask me anything about your carbon footprint — what it means, how to reduce it, or why certain activities matter. What would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { summary } = useAuth();

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const allMessages = [...messages, userMsg];

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, summary, profile }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: data.text || "I'm not sure how to answer that. Try asking about your carbon footprint!",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
      <div className="mb-4 flex items-center gap-2 border-b border-stone-100 pb-4 dark:border-stone-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-600 text-white text-sm">✨</div>
        <div>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Climate Coach</p>
          <p className="text-xs text-stone-400">Powered by Google Gemini · Answers based on your profile</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-forest-600 text-white"
                  : "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "What's my biggest emission source?",
            "How can I reduce my transport footprint?",
            "What does CO₂e mean?",
            "How do I compare to the global average?",
          ].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask anything about your carbon footprint…"
          className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
          aria-label="Chat message"
          disabled={loading}
        />
        <Button
          onClick={sendMessage}
          loading={loading}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
      <p className="mt-2 text-xs text-stone-400 text-center">
        AI-generated responses · May not be exact · Based on your profile data
      </p>
    </Card>
  );
}

// ── Export Panel ──────────────────────────────────────────────────────────────

function ExportPanel() {
  const { profile, summary } = useAuth();
  const [exporting, setExporting] = useState(false);

  async function exportCSV() {
    if (!profile || !summary) return;

    const rows = [
      ["Category", "kg CO2e/year", "% of total", "Source"],
      ...summary.categories.map((c) => [
        c.label,
        c.kgCO2e.toFixed(1),
        c.percentage.toFixed(1) + "%",
        "EPA/IPCC/DESNZ",
      ]),
      ["TOTAL", summary.totalKgCO2e.toFixed(1), "100%", ""],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecotrack-footprint-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportReport() {
    if (!profile || !summary) return;
    setExporting(true);
    try {

      // Build a simple HTML report for printing
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Ecotrack Carbon Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; color: #1c1917; }
    h1 { color: #2d6a2a; } h2 { color: #44403c; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px; }
    .total { font-size: 2.5rem; font-weight: 900; color: #2d6a2a; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f5f5f4; text-align: left; padding: 8px 12px; font-size: 13px; }
    td { padding: 8px 12px; border-bottom: 1px solid #f5f5f4; font-size: 13px; }
    .footer { margin-top: 40px; color: #78716c; font-size: 12px; border-top: 1px solid #e7e5e4; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>🌿 Ecotrack Carbon Footprint Report</h1>
  <p>Generated: ${new Date().toLocaleDateString()} · User: ${profile.displayName}</p>
  <h2>Annual Footprint</h2>
  <p class="total">${formatKgCO2e(summary.totalKgCO2e)}</p>
  <p>per year · ${summary.vsGlobalAverage > 0 ? "+" : ""}${summary.vsGlobalAverage.toFixed(0)}% vs global average</p>
  <h2>Breakdown</h2>
  <table>
    <tr><th>Category</th><th>kg CO₂e/year</th><th>% of total</th></tr>
    ${summary.categories.map((c) => `<tr><td>${c.icon} ${c.label}</td><td>${c.kgCO2e.toFixed(0)}</td><td>${c.percentage.toFixed(1)}%</td></tr>`).join("")}
  </table>
  <h2>Data Sources</h2>
  <p>EPA GHG Emission Factors Hub 2024 · IEA 2023 · Scarborough et al. 2023 · Poore &amp; Nemecek 2018 · UK DESNZ 2023 · USEEIO v2.0</p>
  <div class="footer">Generated by Ecotrack · ecotrack.app · Calculations are estimates based on published emission factors.</div>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecotrack-report-${new Date().toISOString().split("T")[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-4">
          <span className="text-3xl" aria-hidden>📊</span>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">Export as CSV</h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Download your category breakdown as a spreadsheet. Includes kg CO₂e, percentages, and source citations.
            </p>
            <Button className="mt-3" variant="secondary" size="sm" onClick={exportCSV}>
              Download CSV
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-4">
          <span className="text-3xl" aria-hidden>📄</span>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">Download report</h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              A printable HTML report with your full breakdown, data sources, and summary. Open in browser and use Print → Save as PDF.
            </p>
            <Button className="mt-3" variant="secondary" size="sm" onClick={exportReport} loading={exporting}>
              Download report
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-dashed border-stone-300 dark:border-stone-700">
        <div className="text-center py-2">
          <p className="text-2xl mb-2">🔗</p>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{profile?.displayName}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Coming soon — share a card showing your footprint and actions.
          </p>
        </div>
      </Card>
    </div>
  );
}
