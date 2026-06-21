import { NextRequest, NextResponse } from "next/server";
import { buildWeeklyFocusPrompt } from "@/lib/gemini";
import { generateLocalFocusTip } from "@/lib/local-insights";
import { callGemini } from "@/lib/gemini-client";
import type { FootprintSummary, Goal, Action } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { summary, goals, recentActions } = (await req.json()) as {
      summary: FootprintSummary;
      goals: Goal[];
      recentActions: Action[];
    };

    const prompt = buildWeeklyFocusPrompt(summary, goals, recentActions);
    const aiText = await callGemini({
      prompt,
      temperature: 0.8,
      maxOutputTokens: 200,
    });

    if (aiText) {
      return NextResponse.json({ text: aiText, fromAI: true });
    }

    // Fallback to deterministic local tip
    const localText = generateLocalFocusTip(summary);
    return NextResponse.json({ text: localText, fromAI: false });
  } catch {
    return NextResponse.json({
      text: "Keep tracking your daily habits — progress adds up!",
      fromAI: false,
    });
  }
}
