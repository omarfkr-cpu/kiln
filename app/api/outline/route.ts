import { errorResponse, generate, isDemo } from "../../../lib/ai";
import { outlinePrompt } from "../../../lib/prompts";
import { OutlineSchema, type Pocket, type Transformation } from "../../../lib/schemas";
import { demoOutline } from "../../../lib/demo";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { pocket, transformation } = (await req.json()) as { pocket: Pocket; transformation: Transformation };
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 1200));
    return Response.json({ demo: true, outline: demoOutline });
  }
  try {
    return Response.json({ outline: await generate(OutlineSchema, outlinePrompt(pocket, transformation), { effort: "high" }) });
  } catch (e) {
    return errorResponse(e);
  }
}
