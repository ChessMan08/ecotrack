import { NextRequest, NextResponse } from "next/server";
import { buildReductionTipsPrompt } from "@/lib/gemini";
import { callGemini } from "@/lib/gemini-client";
import type { FootprintSummary, Action } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { summary, topCategory, existingActions } = (await req.json()) as {
      summary: FootprintSummary;
      topCategory: string;
      existingActions: Action[];
    };

    if (!summary || !topCategory) {
      return NextResponse.json({ error: "Missing summary or topCategory" }, { status: 400 });
    }

    const prompt = buildReductionTipsPrompt(summary, topCategory, existingActions ?? []);
    const aiText = await callGemini({
      prompt,
      temperature: 0.75,
      maxOutputTokens: 400,
      topP: 0.85,
    });

    if (aiText) {
      return NextResponse.json({ text: aiText, fromAI: true });
    }

    // Fallback: return a structured message so the client can show local tips
    return NextResponse.json({ text: null, fromAI: false });
  } catch (err) {
    console.error("Tips route error:", err);
    return NextResponse.json({ text: null, fromAI: false });
  }
}
