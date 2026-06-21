import { NextRequest, NextResponse } from "next/server";
import { buildChatSystemPrompt } from "@/lib/gemini";
import { callGemini } from "@/lib/gemini-client";
import type { FootprintSummary, LifestyleProfile, ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, summary, profile } = (await req.json()) as {
      messages: ChatMessage[];
      summary: FootprintSummary;
      profile: LifestyleProfile;
    };

    const systemInstruction = buildChatSystemPrompt(summary, profile);

    // Build multi-turn conversation history
    const contents = messages
      .filter((m) => !m.isStreaming)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    const aiText = await callGemini({
      contents,
      systemInstruction,
      temperature: 0.75,
      maxOutputTokens: 512,
      topP: 0.9,
    });

    if (aiText) {
      return NextResponse.json({ text: aiText });
    }

    return NextResponse.json({
      text: "I'm temporarily unavailable. Your footprint data is still accurate — check back in a moment, or explore your dashboard for detailed insights.",
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({
      text: "Something went wrong. Please try again in a moment.",
    });
  }
}
