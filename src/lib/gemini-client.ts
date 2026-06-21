/**
 * Server-side Gemini API client with timeout and error handling.
 *
 * Every Gemini call goes through this module to ensure:
 * - 10-second hard timeout (no hanging requests)
 * - Centralized error handling for missing/invalid/rate-limited keys
 * - Consistent response shape: { text, fromAI }
 */

const GEMINI_TIMEOUT_MS = 10_000;
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** Cached at module load — avoids repeated process.env lookups */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

export interface GeminiResponse {
  text: string;
  fromAI: boolean;
}

interface GeminiRequestOptions {
  /** The prompt text (for single-turn requests) */
  prompt?: string;
  /** Multi-turn contents array (for chat) */
  contents?: Array<{ role: string; parts: Array<{ text: string }> }>;
  /** System instruction text */
  systemInstruction?: string;
  /** Generation config overrides */
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
}

/**
 * Call the Gemini API with a hard timeout.
 * Returns the generated text on success, or `null` on any failure.
 * Callers should always have a deterministic fallback.
 */
export async function callGemini(options: GeminiRequestOptions): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    // Build request body
    const body: Record<string, unknown> = {
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 300,
        topP: options.topP ?? 0.9,
      },
    };

    if (options.systemInstruction) {
      body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
    }

    if (options.contents) {
      body.contents = options.contents;
    } else if (options.prompt) {
      body.contents = [{ parts: [{ text: options.prompt }] }];
    } else {
      return null;
    }

    const response = await fetch(
      `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown");
      console.error(`Gemini API error (${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.length > 0 ? text : null;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("Gemini API request timed out");
    } else {
      console.error("Gemini API request failed:", err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
