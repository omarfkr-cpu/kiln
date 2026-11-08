import { isDemo, streamText } from "../../../lib/ai";
import { chapterPrompt } from "../../../lib/prompts";
import type { Outline, Pocket } from "../../../lib/schemas";
import { demoChapter } from "../../../lib/demo";

export const maxDuration = 800;

// Streams the chapter as plain text. Errors mid-stream are appended as a marker line the client detects.
export async function POST(req: Request) {
  const { pocket, outline, index, previousSummary = "" } = (await req.json()) as {
    pocket: Pocket; outline: Outline; index: number; previousSummary?: string;
  };
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      try {
        if (isDemo()) {
          const ch = outline.chapters[index];
          const text = demoChapter(ch.title, ch.goal, ch.keyPoints);
          for (let i = 0; i < text.length; i += 24) {
            ctrl.enqueue(enc.encode(text.slice(i, i + 24)));
            await new Promise((r) => setTimeout(r, 12));
          }
        } else {
          for await (const t of streamText(chapterPrompt(pocket, outline, index, previousSummary))) ctrl.enqueue(enc.encode(t));
        }
      } catch (e) {
        console.error(e);
        ctrl.enqueue(enc.encode(`\n\n[[KILN_ERROR]] ${e instanceof Error ? e.message : "Writing failed"}`));
      }
      ctrl.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
