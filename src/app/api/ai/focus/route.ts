import { NextRequest, NextResponse } from "next/server";
import { buildWeeklyFocusPrompt } from "@/lib/gemini";
import type { FootprintSummary, Goal, Action } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { summary, goals, recentActions } = (await req.json()) as {
      summary: FootprintSummary;
      goals: Goal[];
      recentActions: Action[];
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { text: "Focus on your biggest emission category this week — even small actions add up." },
        { status: 200 },
      );
    }

    const prompt = buildWeeklyFocusPrompt(summary, goals, recentActions);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { text: "Focus on reducing your highest-emission category this week." },
        { status: 200 },
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: "Keep tracking your daily habits — progress adds up!" });
  }
}
