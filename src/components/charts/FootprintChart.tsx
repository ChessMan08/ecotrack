"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { FootprintSummary } from "@/types";
import { formatKgCO2e } from "@/lib/calculator";

// Simulate monthly data by distributing yearly total across months
function buildMonthlyData(totalKgCO2e: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const base = totalKgCO2e / 12;
  // Add slight seasonal variation for realism
  const seasonalFactors = [1.15, 1.1, 1.05, 0.95, 0.9, 0.85, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2];
  const avg = seasonalFactors.reduce((a, b) => a + b, 0) / seasonalFactors.length;
  return months.map((month, i) => ({
    month,
    kgCO2e: Math.round((base * seasonalFactors[i]) / avg),
  }));
}

interface FootprintChartProps {
  summary: FootprintSummary;
}

export default function FootprintChart({ summary }: FootprintChartProps) {
  const data = useMemo(() => buildMonthlyData(summary.totalKgCO2e), [summary.totalKgCO2e]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="footprintGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3d8539" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3d8539" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" strokeOpacity={0.5} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#78716c" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#78716c" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}kg`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e7e5e4",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            fontSize: "12px",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${formatKgCO2e(Number(value) || 0)}`, "CO₂e"]}
        />
        <Area
          type="monotone"
          dataKey="kgCO2e"
          stroke="#3d8539"
          strokeWidth={2}
          fill="url(#footprintGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#3d8539" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface CategoryPieChartProps {
  summary: FootprintSummary;
}

export function CategoryPieChart({ summary }: CategoryPieChartProps) {
  const data = useMemo(
    () =>
      summary.categories.map((c) => ({
        name: c.label,
        value: Math.round(c.kgCO2e),
        color: c.color,
      })),
    [summary.categories],
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          aria-label="Carbon footprint breakdown by category"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${formatKgCO2e(Number(value) || 0)}`, "CO₂e/yr"]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
