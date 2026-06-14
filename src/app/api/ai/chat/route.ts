import { NextRequest, NextResponse } from "next/server";
import { buildChatSystemPrompt } from "@/lib/gemini";
import type { FootprintSummary, LifestyleProfile, ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, summary, profile } = (await req.json()) as {
      messages: ChatMessage[];
      summary: FootprintSummary;
      profile: LifestyleProfile;
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { text: "AI assistant is unavailable — Gemini API key not configured." },
        { status: 200 },
      );
    }

    const systemInstruction = buildChatSystemPrompt(summary, profile);

    // Build multi-turn conversation history
    const contents = messages
      .filter((m) => !m.isStreaming)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 512,
            topP: 0.9,
          },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { text: "I'm temporarily unavailable. Please try again in a moment." },
        { status: 200 },
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm not sure how to answer that. Try asking about your carbon footprint!";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ text: "Something went wrong. Please try again." });
  }
}
