import { NextRequest, NextResponse } from "next/server";
import { buildFootprintSummaryPrompt } from "@/lib/gemini";
import { generateLocalSummary } from "@/lib/local-insights";
import { callGemini } from "@/lib/gemini-client";
import type { FootprintSummary, LifestyleProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { summary, profile } = (await req.json()) as {
      summary: FootprintSummary;
      profile: LifestyleProfile;
    };

    if (!summary || !profile) {
      return NextResponse.json({ error: "Missing summary or profile" }, { status: 400 });
    }

    // Try Gemini first
    const prompt = buildFootprintSummaryPrompt(summary, profile);
    const aiText = await callGemini({
      prompt,
      temperature: 0.7,
      maxOutputTokens: 300,
      topP: 0.8,
    });

    if (aiText) {
      return NextResponse.json({ text: aiText, fromAI: true });
    }

    // Fallback to deterministic local summary
    const localText = generateLocalSummary(summary, profile);
    return NextResponse.json({ text: localText, fromAI: false });
  } catch (err) {
    console.error("Summary route error:", err);
    return NextResponse.json({
      text: "Your footprint data is ready — personalized AI insights will appear when the service is available.",
      fromAI: false,
    });
  }
}
