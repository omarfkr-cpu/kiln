import { errorResponse, generate, isDemo } from "../../../lib/ai";
import { transformationPrompt } from "../../../lib/prompts";
import { TransformationSchema, type Pocket } from "../../../lib/schemas";
import { demoTransformation } from "../../../lib/demo";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { pocket } = (await req.json()) as { pocket: Pocket };
  if (isDemo()) {
    await new Promise((r) => setTimeout(r, 1200));
    return Response.json({ demo: true, transformation: demoTransformation });
  }
  try {
    return Response.json({ transformation: await generate(TransformationSchema, transformationPrompt(pocket)) });
  } catch (e) {
    return errorResponse(e);
  }
}
