// Sample content used when no Anthropic API key is configured, so the whole flow can be tried end to end.
import type { Outline, Pocket, Transformation } from "./schemas";

export const demoPockets: Pocket[] = [
  {
    promise: "I help single-income households stop running out of money before payday without cutting every small pleasure",
    industry: "Personal Finance", niche: "Paycheck-to-paycheck budgeting",
    knowledge: "Cash-flow mapping, bill timing, and separating fixed, flexible and irregular spending into a simple weekly rhythm.",
    problem: "Families feel squeezed between paychecks even when income should cover the month. They learn to sequence bills, release money weekly and keep a small cushion.",
    pain: 9, worsening: 8, buyingPower: 6, speed: 8,
    rationale: "Acute, recurring pain with fast visible wins; lower budgets mean a low price point.",
  },
  {
    promise: "I help freelance designers raise their rates by 30% without losing their best clients",
    industry: "Creative Business", niche: "Freelance pricing",
    knowledge: "Value-based pricing, rate-increase scripts, packaging services and handling objections.",
    problem: "Talented freelancers are stuck at rates they set years ago. They learn to package work, communicate value and raise prices in a way clients accept.",
    pain: 7, worsening: 6, buyingPower: 8, speed: 7,
    rationale: "Buyers earn money from the result, so willingness to pay is high.",
  },
  {
    promise: "I help new managers run one-on-ones their team looks forward to without scripts that feel fake",
    industry: "Careers", niche: "First-time manager 1:1s",
    knowledge: "Meeting structures, coaching questions, feedback models and follow-up habits.",
    problem: "New managers dread 1:1s that turn into status updates. They learn a repeatable format that surfaces problems early and builds trust.",
    pain: 7, worsening: 7, buyingPower: 8, speed: 9,
    rationale: "Employers often reimburse, and results show up in the very next meeting.",
  },
  {
    promise: "I help parents of anxious teens have calmer school-night evenings without nightly arguments about homework",
    industry: "Parenting", niche: "Teen homework anxiety",
    knowledge: "Routines, emotional coaching language and practical study systems for teens.",
    problem: "Evenings collapse into conflict over unfinished work. Parents learn a routine and language that lowers pressure while keeping the work moving.",
    pain: 8, worsening: 7, buyingPower: 7, speed: 6,
    rationale: "Strong emotional pull; results take a couple of weeks to show.",
  },
  {
    promise: "I help Etsy sellers turn one-time buyers into repeat customers without paying for ads",
    industry: "Ecommerce", niche: "Etsy repeat purchases",
    knowledge: "Packaging inserts, follow-up messages, bundles and simple email lists.",
    problem: "Sellers keep chasing new buyers while past customers never return. They learn low-cost touchpoints that bring buyers back.",
    pain: 6, worsening: 6, buyingPower: 6, speed: 7,
    rationale: "Clear ROI but a crowded advice market.",
  },
  {
    promise: "I help remote workers end the day on time without falling behind on their work",
    industry: "Productivity", niche: "Remote work boundaries",
    knowledge: "Time-blocking, shutdown rituals, async communication and saying no well.",
    problem: "Work bleeds into evenings because there's no commute to end the day. They learn a shutdown system and team norms that protect their time.",
    pain: 7, worsening: 6, buyingPower: 7, speed: 8,
    rationale: "Broad audience; needs a sharp angle to stand out.",
  },
];

export const demoTransformation: Transformation = {
  avatar: "A parent running a household on one income who works hard, pays most bills on time, but dreads the last week before payday.",
  shifts: [
    { dimension: "Emotional state", before: "They feel tense every time they open the banking app, expecting less money than they hoped. Small purchases bring guilt.", after: "They feel calm and clear about where money is going. A coffee or takeaway is a choice, not a source of anxiety." },
    { dimension: "Core fear", before: "They worry one car repair or school expense will push them onto a credit card or force them to ask for help.", after: "They trust a small reserve to absorb ordinary surprises without throwing the whole month into crisis." },
    { dimension: "Daily reality", before: "They check the calendar before spending and shuffle money around to cover groceries and fuel. The final week is all 'no'.", after: "They know what's available each week for essentials and fun. The final week feels like any other week." },
    { dimension: "Identity", before: "They call themselves bad with money, even though they're working hard to cover everything.", after: "They see themselves as a capable household money manager who makes one income work." },
    { dimension: "Relationships", before: "Money talks with their partner or kids turn tense or get avoided.", after: "Spending decisions are shared, quick and calm because everyone knows the plan." },
    { dimension: "Confidence and control", before: "Each month feels like something happening to them.", after: "They make decisions before the money arrives, so the month follows their plan." },
  ],
};

export const demoOutline: Outline = {
  title: "The One-Paycheck Plan",
  subtitle: "A four-week cash-flow system for bills, groceries and the small pleasures",
  about: "Written for households living on one regular paycheck, this book replaces the monthly budget with a payday map, weekly spending releases and a protected allowance for small joys.",
  learn: [
    "The Payday Map: sequence fixed bills, flexible essentials and irregular costs before spending anything.",
    "The Traffic Light rule: mark each purchase as protected, adjustable or paused.",
    "Weekly Releases: turn one paycheck into four calm spending weeks.",
    "The Surprise Fund: absorb irregular costs without debt.",
  ],
  chapters: [
    { title: "Introduction: Why the Last Week Hurts", goal: "Understand why the problem is timing, not income.", keyPoints: ["The end-of-month squeeze", "Why monthly budgets fail one-income homes", "What this book will change"] },
    { title: "Map the Paycheck Before It Lands", goal: "Build a Payday Map in 30 minutes.", keyPoints: ["List every outflow by date", "Fixed vs flexible vs irregular", "The first-48-hours rule"] },
    { title: "Separate the Four Buckets", goal: "Set up four buckets that stop money blending together.", keyPoints: ["Bills, essentials, irregular, pleasure", "Account setup options", "Naming and automation"] },
    { title: "Release Money by the Week", goal: "Switch to four weekly releases.", keyPoints: ["Why seven-day runways work", "Calculating your release", "What to do if a week overspends"] },
    { title: "The Traffic Light Spending Signal", goal: "Make mid-month decisions in seconds.", keyPoints: ["Green, amber, red purchases", "Family agreements", "Handling pressure to spend"] },
    { title: "Build the Surprise Fund", goal: "Start a reserve for irregular costs.", keyPoints: ["Annual cost audit", "Monthly sinking amount", "What counts as a real emergency"] },
    { title: "Protect the Small Pleasures", goal: "Keep joy in the plan on purpose.", keyPoints: ["The pleasure allowance", "Cheap joys list", "Avoiding the restriction rebound"] },
    { title: "Conclusion: Your First Four Weeks", goal: "Run the plan for a full cycle.", keyPoints: ["Week-by-week checklist", "Review ritual", "Next steps"] },
  ],
  bonuses: [
    { title: "Payday Map Worksheet", description: "A printable one-page map for your bills and buckets." },
    { title: "Family Money Talk Script", description: "A 10-minute script for agreeing the plan at home." },
  ],
};

export function demoChapter(title: string, goal: string, points: string[]) {
  return `## ${title}

It's Thursday evening, four days before payday. The fridge is half empty, the fuel light just came on, and there's a school trip form on the counter asking for twenty dollars. You do the math in your head, then do it again.

This chapter exists for that moment. **${goal}**

### Why this matters

Most money advice assumes the problem is discipline. For a household on one income it's usually timing: money arrives once, but needs leave all month. When those two rhythms don't match, even a sensible budget breaks in the final week.

${points.map((p, i) => `### ${i + 1}. ${p}\n\nHere is where the method gets practical. Take a concrete example: a household bringing home $3,200 a month with $1,900 in fixed bills. That leaves $1,300 for everything else, or about $325 a week. The point isn't the exact number. It's knowing it before the week starts, so every decision is made against a figure rather than a feeling.\n\nStart small. Pick one change from this section and run it for a single week before adding another.`).join("\n\n")}

### Try this today

- [ ] Write down the date your next paycheck lands.
- [ ] List every bill due before the one after it.
- [ ] Circle the one expense that surprised you last month.

*(This is demo content. Add your Anthropic API key to generate a real, fully written chapter.)*

The next chapter builds directly on what you've just mapped, so keep your notes nearby.
`;
}
