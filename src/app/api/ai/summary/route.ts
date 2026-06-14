import { NextRequest, NextResponse } from "next/server";
import { buildFootprintSummaryPrompt } from "@/lib/gemini";
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { text: "AI insights unavailable — Gemini API key not configured." },
        { status: 200 },
      );
    }

    const prompt = buildFootprintSummaryPrompt(summary, profile);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            topP: 0.8,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { text: "AI insights temporarily unavailable. Your footprint data is accurate." },
        { status: 200 },
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Summary route error:", err);
    return NextResponse.json(
      { text: "AI summary temporarily unavailable." },
      { status: 200 },
    );
  }
}
