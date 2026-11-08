# Kiln

Turn what you know into a finished digital product. Kiln walks a creator through six steps:

1. **Spark**: describe what you know, care about, or want to help people with.
2. **Pockets**: Claude proposes 6 niche "profitable pockets", each scored on pain, worsening, buying power and speed. Pick one or add your own idea.
3. **Transformation**: an editable before/after map of the buyer (emotional state, core fear, daily reality, identity, relationships, control).
4. **Blueprint**: title, subtitle, named frameworks, chapter plan and bonus resources. Everything is editable.
5. **Manuscript**: chapters are written one at a time and stream in live. Pause, resume, edit or rewrite any chapter.
6. **Deliver**: download a print-ready HTML eBook (print to PDF), Markdown, or the project file.

Progress is saved in the browser automatically.

## Run it

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Without an API key Kiln runs in **demo mode** with sample content, so you can click through the whole flow.

## How it works

- Next.js 15 (App Router) + TypeScript. The API key stays on the server (`app/api/*`).
- Claude API via `@anthropic-ai/sdk`, model `claude-opus-5-5` (override with `KILN_MODEL`).
- Structured steps use Zod-validated structured outputs (`lib/schemas.ts`); chapters stream as text.
- Server-side refusal fallback (`fallbacks: "default"`) is on, so a declined request is retried on a suitable model automatically.
- Prompts live in `lib/prompts.ts`, the score formula in `pocketScore()`.

## Deploy

Push to GitHub and import into Vercel, then set `ANTHROPIC_API_KEY` in the project's environment variables. Chapter writing can take a minute or two per chapter, so use a plan that allows long function durations.
