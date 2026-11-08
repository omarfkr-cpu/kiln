import { errorResponse, generate, isDemo } from "../../../lib/ai";
import { customPocketPrompt, pocketsPrompt } from "../../../lib/prompts";
import { PocketsSchema } from "../../../lib/schemas";
import { demoPockets } from "../../../lib/demo";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { input = "", idea, avoid = [] } = (await req.json()) as { input?: string; idea?: string; avoid?: string[] };
  if (!input.trim() && !idea?.trim()) return Response.json({ error: "Tell Kiln what you know first." }, { status: 400 });
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 1200));
    if (idea) return Response.json({ demo: true, pockets: [{ ...demoPockets[0], promise: idea, niche: "Your idea", rationale: "Demo mode: shaped from your own idea." }] });
    return Response.json({ demo: true, pockets: demoPockets });
  }
  try {
    const out = await generate(PocketsSchema, idea ? customPocketPrompt(input, idea) : pocketsPrompt(input, avoid));
    return Response.json({ pockets: out.pockets });
  } catch (e) {
    return errorResponse(e);
  }
}
