import type { Outline } from "./schemas";
import { mdToHtml } from "./markdown";

export function bookMarkdown(o: Outline, chapters: string[], author: string) {
  const parts = [
    `# ${o.title}`,
    `*${o.subtitle}*`,
    author ? `By ${author}` : "",
    "---",
    "## Contents",
    o.chapters.map((c, i) => `${i + 1}. ${c.title}`).join("\n"),
    "---",
    ...chapters.map((c) => c.trim()),
    "---",
    "## Bonus resources",
    o.bonuses.map((b) => `- **${b.title}**: ${b.description}`).join("\n"),
  ];
  return parts.filter(Boolean).join("\n\n") + "\n";
}

export function bookHtml(o: Outline, chapters: string[], author: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Source+Serif+4:wght@400;600&display=swap" rel="stylesheet"/>
<style>
body{margin:0;background:#fff;color:#1f1b17;font:18px/1.7 "Source Serif 4",Georgia,serif}
main{max-width:680px;margin:0 auto;padding:48px 20px}
h1,h2,h3{font-family:Fraunces,Georgia,serif;line-height:1.2}
.cover{min-height:80vh;display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid #e6ddd2;margin-bottom:48px}
.cover h1{font-size:52px;margin:0 0 12px}.cover p{font-size:22px;color:#6b5f53;margin:0}
.cover .by{margin-top:40px;font-size:16px;letter-spacing:.08em;text-transform:uppercase;color:#c2461a}
section.chapter{page-break-before:always;padding-top:24px}
h2{font-size:32px;margin-top:0}h3{font-size:22px;margin-top:32px}
blockquote{border-left:3px solid #c2461a;margin:24px 0;padding:4px 18px;color:#4a4038}
ul.checks{list-style:none;padding-left:0}ul.checks .box{display:inline-block;width:16px;height:16px;border:1.5px solid #8a7d70;border-radius:3px;margin-right:10px;vertical-align:-2px}
ol.toc li{margin:6px 0}
@media print{main{padding:0}.cover{min-height:90vh}}
</style></head><body><main>
<div class="cover"><h1>${esc(o.title)}</h1><p>${esc(o.subtitle)}</p>${author ? `<div class="by">${esc(author)}</div>` : ""}</div>
<h2>Contents</h2><ol class="toc">${o.chapters.map((c) => `<li>${esc(c.title)}</li>`).join("")}</ol>
${chapters.map((c) => `<section class="chapter">${mdToHtml(c)}</section>`).join("\n")}
<section class="chapter"><h2>Bonus resources</h2><ul>${o.bonuses.map((b) => `<li><strong>${esc(b.title)}</strong>: ${esc(b.description)}</li>`).join("")}</ul></section>
</main></body></html>`;
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "ebook";
