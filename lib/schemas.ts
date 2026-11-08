import { z } from "zod";

// ---------- Step 1: Opportunity pockets ----------
export const PocketSchema = z.object({
  promise: z
    .string()
    .describe('One sentence: "I help [specific who] [get specific outcome] without [the painful common approach]"'),
  industry: z.string(),
  niche: z.string().describe("2-5 word niche label"),
  knowledge: z.string().describe("The specific knowledge the creator needs to deliver this, 2-3 sentences"),
  problem: z.string().describe("The concrete problem the buyer has and what they learn, 2-4 sentences"),
  pain: z.number().describe("1-10: how much it hurts today"),
  worsening: z.number().describe("1-10: how much it gets worse if ignored"),
  buyingPower: z.number().describe("1-10: buyer's ability and willingness to pay"),
  speed: z.number().describe("1-10: how fast a buyer can see a first result"),
  rationale: z.string().describe("One sentence on why this is a good (or risky) pocket"),
});
export const PocketsSchema = z.object({ pockets: z.array(PocketSchema) });
export type Pocket = z.infer<typeof PocketSchema>;

export function pocketScore(p: Pick<Pocket, "pain" | "worsening" | "buyingPower" | "speed">) {
  // Pain and buying power matter most for a product that sells.
  const s = p.pain * 0.3 + p.buyingPower * 0.3 + p.worsening * 0.2 + p.speed * 0.2;
  return Math.round(s * 10) / 10;
}

// ---------- Step 2: Transformation map ----------
export const ShiftSchema = z.object({
  dimension: z.string().describe("e.g. Emotional state, Core fear, Daily reality, Identity, Relationships, Time"),
  before: z.string(),
  after: z.string(),
});
export const TransformationSchema = z.object({
  avatar: z.string().describe("One-sentence portrait of the buyer"),
  shifts: z.array(ShiftSchema),
});
export type Transformation = z.infer<typeof TransformationSchema>;

// ---------- Step 3: Outline ----------
export const ChapterPlanSchema = z.object({
  title: z.string(),
  goal: z.string().describe("What the reader can do after this chapter, one sentence"),
  keyPoints: z.array(z.string()).describe("3-5 points the chapter must cover"),
});
export const OutlineSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  about: z.string().describe("2-3 sentence back-cover description"),
  learn: z.array(z.string()).describe("4 concrete things the reader will learn, each naming a framework or tool"),
  chapters: z.array(ChapterPlanSchema).describe("Introduction first, conclusion last; 7-9 total"),
  bonuses: z.array(z.object({ title: z.string(), description: z.string() })).describe("2 practical bonus resources"),
});
export type Outline = z.infer<typeof OutlineSchema>;
export type ChapterPlan = z.infer<typeof ChapterPlanSchema>;
