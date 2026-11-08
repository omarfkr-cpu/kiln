import type { ChapterPlan, Outline, Pocket, Transformation } from "./schemas";

export function pocketsPrompt(input: string, avoid: string[] = []) {
  return `A creator described what they know, care about, or want to help people with:

<creator_input>
${input}
</creator_input>

Find 6 distinct "profitable pockets": narrow, sellable niches where this creator's knowledge solves an urgent problem for buyers who can pay.
Spread them across different audiences and angles (not 6 variations of one idea). At least one should be a surprising but credible angle.
For each, write the promise as "I help [specific who] [specific outcome] without [the painful approach they try today]".
Score honestly on a 1-10 scale:
- pain: how much the problem hurts right now
- worsening: how much worse it gets if ignored
- buyingPower: the buyer's ability and willingness to pay for a solution
- speed: how quickly a buyer could see a first tangible result
Use the full range; don't give everything 8s.${avoid.length ? `\n\nDo not repeat these niches already shown: ${avoid.join("; ")}.` : ""}`;
}

export function customPocketPrompt(input: string, idea: string) {
  return `The creator's background:\n<creator_input>\n${input || "(not given)"}\n</creator_input>\n\nThey already have a niche in mind:\n<idea>\n${idea}\n</idea>\n\nShape this into exactly 1 profitable pocket with honest scores. Keep their intent; sharpen the who, the outcome and the "without".`;
}

const pocketBlock = (p: Pocket) =>
  `<pocket>\nPromise: ${p.promise}\nIndustry: ${p.industry} / Niche: ${p.niche}\nProblem: ${p.problem}\nCreator knowledge: ${p.knowledge}\n</pocket>`;

export function transformationPrompt(p: Pocket) {
  return `${pocketBlock(p)}

Build a visceral before/after transformation map for this buyer. Write 6 shifts covering: Emotional state, Core fear, Daily reality, Identity, Relationships, and Confidence/Control.
"Before" should be specific, sensory and recognisable (the reader should think "that's me"). "After" should be believable, not a fantasy. 2-3 sentences each, second person avoided (use "they").`;
}

export function outlinePrompt(p: Pocket, t: Transformation) {
  const shifts = t.shifts.map((s) => `- ${s.dimension}: BEFORE ${s.before} AFTER ${s.after}`).join("\n");
  return `${pocketBlock(p)}

<buyer>${t.avatar}</buyer>
<transformation>
${shifts}
</transformation>

Design a short, practical eBook (about 12,000-16,000 words) that moves this buyer from before to after.
- A specific, benefit-led title and a subtitle that names the mechanism.
- Give the method memorable named frameworks or tools (e.g. "The Payday Map").
- 7-9 chapters: an Introduction, the core method chapters in the order a reader should act, and a short Conclusion with next steps.
- Each chapter has a clear goal and 3-5 key points.
- 2 bonus resources that are easy to make (checklist, worksheet, template, script).`;
}

export function chapterPrompt(p: Pocket, o: Outline, index: number, previousSummary: string) {
  const ch: ChapterPlan = o.chapters[index];
  const toc = o.chapters.map((c, i) => `${i + 1}. ${c.title}`).join("\n");
  return `You are writing chapter ${index + 1} of ${o.chapters.length} of the eBook "${o.title}: ${o.subtitle}".

${pocketBlock(p)}

Table of contents:
${toc}

${previousSummary ? `What earlier chapters covered (don't repeat it):\n${previousSummary}\n` : ""}
This chapter: "${ch.title}"
Goal: ${ch.goal}
Must cover:
${ch.keyPoints.map((k) => `- ${k}`).join("\n")}

Write the full chapter in Markdown, about 1,400-1,900 words.
- Start with "## ${ch.title}" and use "###" subheadings.
- Open with a concrete, recognisable scene or moment, then teach.
- Use short paragraphs, concrete examples with numbers, and one simple exercise or checklist the reader can do today.
- End with a two-sentence bridge to the next chapter${index === o.chapters.length - 1 ? " (this is the last chapter: end with a clear next step instead)" : ""}.
Output only the chapter text.`;
}
