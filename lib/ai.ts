import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = process.env.KILN_MODEL || "claude-opus-5-5";
export const isDemo = () => !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN;

let _client: Anthropic | null = null;
export function client() {
  if (!_client) _client = new Anthropic();
  return _client;
}

// Server-side refusal fallback: if the model declines, the API reroutes to a suitable model in the same call.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export const SYSTEM = `You are Kiln, a sharp digital-product strategist and nonfiction ghostwriter.
You help creators turn what they already know into a focused, sellable digital product (a short practical eBook).
Principles:
- Specific beats broad: name a precise buyer, a precise problem, a precise result.
- Be honest: score opportunities realistically, never inflate numbers.
- Write plainly for a smart reader. No hype, no filler, no clichés, no emojis.
- Never promise medical, legal, or financial outcomes; frame advice as education.`;

/** One structured call: returns data validated against the Zod schema. */
export async function generate<T extends z.ZodType>(
  schema: T,
  prompt: string,
  opts: { effort?: "low" | "medium" | "high"; maxTokens?: number } = {},
): Promise<z.infer<T>> {
  const res = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(schema) },
    ...FALLBACK,
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined this request. Try rephrasing your topic.");
  if (res.stop_reason === "max_tokens") throw new Error("The response was cut off. Please try again.");
  if (!res.parsed_output) throw new Error("Could not read the model's answer. Please try again.");
  return res.parsed_output as z.infer<T>;
}

/** Streams plain text deltas (used for chapter writing). */
export async function* streamText(prompt: string, maxTokens = 32000): AsyncGenerator<string> {
  const stream = client().beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    ...FALLBACK,
    messages: [{ role: "user", content: prompt }],
  });
  for await (const ev of stream) {
    if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") yield ev.delta.text;
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") throw new Error("The model declined to write this chapter.");
}

export function errorResponse(e: unknown) {
  const msg =
    e instanceof Anthropic.AuthenticationError
      ? "Your Anthropic API key was rejected. Check ANTHROPIC_API_KEY."
      : e instanceof Anthropic.RateLimitError
        ? "Rate limited by the Claude API. Wait a moment and try again."
        : e instanceof Anthropic.APIError
          ? `Claude API error (${e.status ?? "network"}): ${e.message}`
          : e instanceof Error
            ? e.message
            : "Unexpected error";
  console.error(e);
  return Response.json({ error: msg }, { status: 500 });
}
