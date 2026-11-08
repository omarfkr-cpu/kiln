"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pocketScore, type Outline, type Pocket, type Transformation } from "../lib/schemas";
import { mdToHtml, wordCount } from "../lib/markdown";
import { bookHtml, bookMarkdown, download, slug } from "../lib/export";

type Project = {
  step: number;
  input: string;
  pockets: Pocket[];
  selected: number | null;
  transformation: Transformation | null;
  outline: Outline | null;
  chapters: string[];
  author: string;
  demo: boolean;
};

const EMPTY: Project = { step: 0, input: "", pockets: [], selected: null, transformation: null, outline: null, chapters: [], author: "", demo: false };
const STEPS = ["Spark", "Pockets", "Transformation", "Blueprint", "Manuscript", "Deliver"];
const STORE = "kiln.project.v1";
const ERR = "[[KILN_ERROR]]";

async function post<T>(url: string, body: unknown): Promise<T & { demo?: boolean }> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: `Request failed (${r.status})` }));
  if (!r.ok || j.error) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path d="M6 28V14a10 10 0 0 1 20 0v14z" fill="#1f1b17" />
      <path d="M10 28v-8a6 6 0 0 1 12 0v8z" fill="#c9471a" />
      <path d="M16 18c2 2 2.5 4 1.4 6.2-.6 1.2-2.8 1.2-3.2-.3-.4-1.3.6-2 .8-3.2.2-1-.2-1.9 1-2.7z" fill="#ffd2a8" />
    </svg>
  );
}

function Forge({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="forge">
      <div className="glow" />
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}

const scoreClass = (s: number) => (s >= 7.5 ? "hi" : s >= 6 ? "mid" : "lo");

export default function Home() {
  const [p, setP] = useState<Project>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ownIdea, setOwnIdea] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState(0);
  const [writing, setWriting] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setP({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORE, JSON.stringify(p)); } catch {}
  }, [p, loaded]);

  const up = (patch: Partial<Project>) => setP((x) => ({ ...x, ...patch }));
  const go = (step: number) => { setError(null); up({ step }); window.scrollTo({ top: 0 }); };

  const maxStep = p.chapters.some(Boolean) ? 5 : p.outline ? 4 : p.transformation ? 2 : p.selected !== null ? 2 : p.pockets.length ? 1 : 0;
  const pocket = p.selected !== null ? p.pockets[p.selected] : null;

  async function run<T>(label: string, fn: () => Promise<T>) {
    setBusy(label); setError(null);
    try { return await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  // ---- Step actions ----
  const findPockets = (more = false) =>
    run("pockets", async () => {
      const r = await post<{ pockets: Pocket[] }>("/api/niches", { input: p.input, avoid: more ? p.pockets.map((x) => x.niche) : [] });
      const pockets = [...(more ? p.pockets : []), ...r.pockets].sort((a, b) => pocketScore(b) - pocketScore(a));
      up({ pockets, selected: more ? p.selected : null, demo: !!r.demo, step: 1 });
      if (!more) { setShowAll(false); window.scrollTo({ top: 0 }); }
    });

  const addOwn = () =>
    run("own", async () => {
      const r = await post<{ pockets: Pocket[] }>("/api/niches", { input: p.input, idea: ownIdea });
      setP((x) => ({ ...x, pockets: [...x.pockets, ...r.pockets], selected: x.pockets.length, demo: !!r.demo }));
      setOwnIdea("");
    });

  const choosePocket = (i: number) => {
    if (i !== p.selected) up({ selected: i, transformation: null, outline: null, chapters: [] });
  };

  const buildTransformation = () =>
    run("transformation", async () => {
      go(2);
      const r = await post<{ transformation: Transformation }>("/api/transformation", { pocket });
      up({ transformation: r.transformation, outline: null, chapters: [] });
    });

  const buildOutline = () =>
    run("outline", async () => {
      go(3);
      const r = await post<{ outline: Outline }>("/api/outline", { pocket, transformation: p.transformation });
      up({ outline: r.outline, chapters: [] });
    });

  async function writeBook(only?: number) {
    if (!p.outline || !pocket) return;
    const outline = p.outline;
    const ctrl = new AbortController();
    abort.current = ctrl;
    setError(null);
    const chapters = [...p.chapters];
    const todo = only !== undefined ? [only] : outline.chapters.map((_, i) => i).filter((i) => !chapters[i] || chapters[i].includes(ERR));
    for (const i of todo) {
      if (ctrl.signal.aborted) break;
      setWriting(i); setActive(i);
      const previousSummary = outline.chapters.slice(0, i).map((c, k) => `${k + 1}. ${c.title}: ${c.goal}`).join("\n");
      try {
        const r = await fetch("/api/chapter", {
          method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pocket, outline, index: i, previousSummary }),
        });
        if (!r.ok || !r.body) throw new Error(`Writing failed (${r.status})`);
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let text = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          chapters[i] = text;
          setP((x) => { const c = [...x.chapters]; c[i] = text; return { ...x, chapters: c }; });
        }
        if (text.includes(ERR)) { setError(text.split(ERR)[1].trim()); break; }
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : String(e));
        break;
      }
    }
    setWriting(null);
    abort.current = null;
  }

  const words = useMemo(() => p.chapters.reduce((n, c) => n + (c && !c.includes(ERR) ? wordCount(c) : 0), 0), [p.chapters]);
  const doneCount = p.chapters.filter((c) => c && !c.includes(ERR)).length;
  const total = p.outline?.chapters.length ?? 0;

  const reset = () => {
    if (!confirmReset()) return;
    abort.current?.abort();
    setP(EMPTY); setError(null); setActive(0);
  };

  if (!loaded) return null;

  return (
    <>
      <header className="top">
        <div className="top-in">
          <div className="brand"><Logo /> Kiln</div>
          <nav className="steps">
            {STEPS.map((s, i) => (
              <button key={s} className={`step ${i === p.step ? "on" : i < p.step || i <= maxStep ? "done" : ""}`} disabled={i > maxStep || !!busy} onClick={() => go(i)}>
                <span className="n">{i < p.step ? "✓" : i + 1}</span>{s}
              </button>
            ))}
          </nav>
          <button className="ghost" onClick={reset}>New product</button>
        </div>
      </header>
      {p.demo && (
        <div className="demo-banner"><div>Demo mode: no Anthropic API key is set, so Kiln is showing sample content. Add <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> to generate real results.</div></div>
      )}

      <main className="wrap">
        {error && <div className="err">{error}</div>}

        {/* STEP 0: Spark */}
        {p.step === 0 && (
          busy === "pockets" ? <Forge title="Weighing the market…" sub="Scoring pain, urgency, buying power and speed for each idea." /> :
          <section className="spark">
            <div className="eyebrow">Step 1 · Spark</div>
            <h1>What do you <em>know</em>, care about, or want to help people with?</h1>
            <p className="lead">A skill, a method, a group you understand, a problem you've solved. Kiln turns it into a scored shortlist of product ideas.</p>
            <div className="composer">
              <textarea autoFocus value={p.input} onChange={(e) => up({ input: e.target.value })}
                placeholder="e.g. I'm a nurse who got my family out of debt on one income, and I'm good at making simple spreadsheets…"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && p.input.trim()) findPockets(); }} />
              <div className="row">
                <span className="hint">⌘/Ctrl + Enter to continue</span>
                <button className="btn ember" disabled={!p.input.trim()} onClick={() => findPockets()}>Find my pockets →</button>
              </div>
            </div>
            <div className="chips">
              {["I'm a personal trainer for busy parents", "I fixed my own sleep after years of insomnia", "I run a small bakery and know pricing", "I teach high-school maths"].map((s) => (
                <button key={s} className="chip" onClick={() => up({ input: s })}>{s}</button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 1: Pockets */}
        {p.step === 1 && (
          <section>
            <div className="eyebrow">Step 2 · Profitable pockets</div>
            <h2 className="page-h">Pick the pocket worth building</h2>
            <p className="page-sub">Each idea is scored on pain, how fast it gets worse, the buyer's purchasing power, and how quickly they see results. The top score is a good default, but pick the one you'd love to write.</p>
            <div className="grid">
              {(showAll ? p.pockets : p.pockets.slice(0, 4)).map((x) => {
                const i = p.pockets.indexOf(x);
                const s = pocketScore(x);
                return (
                  <article key={i} className={`card pocket ${p.selected === i ? "sel" : ""}`}>
                    <div className="tags">
                      {i === 0 && <span className="badge best">Top pick</span>}
                      <span className="tag">{x.industry}</span><span className="tag">{x.niche}</span>
                      <div className={`score ${scoreClass(s)}`}>{s.toFixed(1)}<small>/10</small></div>
                    </div>
                    <h3>{x.promise}</h3>
                    <div className="two">
                      <div><div className="lbl">Problem solved</div><p className="body">{x.problem}</p></div>
                      <div><div className="lbl">Knowledge needed</div><p className="body">{x.knowledge}</p></div>
                    </div>
                    <div className="meters">
                      {([["Pain", x.pain], ["Worsening", x.worsening], ["Buying power", x.buyingPower], ["Speed", x.speed]] as const).map(([k, v]) => (
                        <div className="meter" key={k}><div className="top-l"><span>{k}</span><b>{v}</b></div><div className="bar"><i style={{ width: `${v * 10}%` }} /></div></div>
                      ))}
                    </div>
                    <p className="why">{x.rationale}</p>
                    <div className="row"><span className="spacer" />
                      <button className={`btn ${p.selected === i ? "ember" : "soft"}`} onClick={() => choosePocket(i)}>{p.selected === i ? "✓ Selected" : "Use this pocket"}</button>
                    </div>
                  </article>
                );
              })}
              <article className="card own">
                <h3>Have your own idea?</h3>
                <p className="body">Describe it and Kiln will shape and score it like the others.</p>
                <textarea value={ownIdea} onChange={(e) => setOwnIdea(e.target.value)} placeholder="e.g. Helping new dog owners crate-train without the crying nights" />
                <div className="row"><button className="btn soft" disabled={!ownIdea.trim() || !!busy} onClick={addOwn}>{busy === "own" ? "Shaping…" : "Add to the grid"}</button></div>
              </article>
            </div>
            <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
              {p.pockets.length > 4 && <button className="ghost" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : `Show all ${p.pockets.length}`}</button>}
              <button className="ghost" disabled={!!busy} onClick={() => { setShowAll(true); findPockets(true); }}>{busy === "pockets" ? "Finding more…" : "↻ Find more ideas"}</button>
            </div>
          </section>
        )}

        {/* STEP 2: Transformation */}
        {p.step === 2 && (
          <section>
            <div className="eyebrow">Step 3 · Transformation</div>
            <h2 className="page-h">Map the before and after</h2>
            <p className="page-sub">This is what your buyer is really paying for. Edit anything that doesn't sound like them; the blueprint and every chapter are built from it.</p>
            {busy === "transformation" ? <Forge title="Charting the journey…" sub="From where your buyer is today to where they want to be." /> :
              p.transformation ? (
                <div className="card">
                  <div className="lbl">Your buyer</div>
                  <textarea className="edit" style={{ minHeight: 50 }} value={p.transformation.avatar} onChange={(e) => up({ transformation: { ...p.transformation!, avatar: e.target.value }, outline: null, chapters: [] })} />
                  <table className="tmap" style={{ marginTop: 12 }}>
                    <thead><tr><th>Dimension</th><th>Before</th><th>After</th></tr></thead>
                    <tbody>
                      {p.transformation.shifts.map((s, i) => (
                        <tr key={i}>
                          <td>{s.dimension}</td>
                          {(["before", "after"] as const).map((k) => (
                            <td key={k} className={k}>
                              <textarea value={s[k]} onChange={(e) => {
                                const shifts = p.transformation!.shifts.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x));
                                up({ transformation: { ...p.transformation!, shifts }, outline: null, chapters: [] });
                              }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="card"><p className="body">No map yet.</p></div>}
          </section>
        )}

        {/* STEP 3: Blueprint */}
        {p.step === 3 && (
          <section>
            <div className="eyebrow">Step 4 · Blueprint</div>
            <h2 className="page-h">Your eBook blueprint</h2>
            <p className="page-sub">Rename the book and chapters as you like. When it looks right, Kiln writes the manuscript chapter by chapter.</p>
            {busy === "outline" ? <Forge title="Designing the book…" sub="Naming the method and sequencing the chapters." /> : p.outline && (
              <div className="card">
                <input className="title-in" value={p.outline.title} onChange={(e) => up({ outline: { ...p.outline!, title: e.target.value } })} />
                <input className="sub-in" value={p.outline.subtitle} onChange={(e) => up({ outline: { ...p.outline!, subtitle: e.target.value } })} />
                <div className="stats">
                  <div className="stat"><b>{total}</b><span>chapters</span></div>
                  <div className="stat"><b>~{Math.round((total * 1650) / 230)}</b><span>min reading time</span></div>
                  <div className="stat"><b>~{Math.round((total * 1650) / 1000)}k</b><span>words</span></div>
                  <div className="stat"><b>{p.outline.bonuses.length}</b><span>bonus resources</span></div>
                </div>
                <div className="two">
                  <div><div className="lbl">About this book</div><textarea className="edit" value={p.outline.about} onChange={(e) => up({ outline: { ...p.outline!, about: e.target.value } })} /></div>
                  <div><div className="lbl">What readers learn</div><ul className="learn">{p.outline.learn.map((l, i) => <li key={i}>{l}</li>)}</ul></div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <div className="lbl">Chapters</div>
                  {p.outline.chapters.map((c, i) => (
                    <div className="chap" key={i}>
                      <div className="num">{String(i + 1).padStart(2, "0")}</div>
                      <div>
                        <input value={c.title} onChange={(e) => up({ outline: { ...p.outline!, chapters: p.outline!.chapters.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) } })} />
                        <div className="body" style={{ padding: "0 4px" }}>{c.goal}</div>
                        <ul>{c.keyPoints.map((k, j) => <li key={j}>{k}</li>)}</ul>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="lbl">Bonuses</div>
                  <ul className="learn">{p.outline.bonuses.map((b, i) => <li key={i}><b>{b.title}</b>: {b.description}</li>)}</ul>
                </div>
              </div>
            )}
          </section>
        )}

        {/* STEP 4: Manuscript */}
        {p.step === 4 && p.outline && (
          <section>
            <div className="eyebrow">Step 5 · Manuscript</div>
            <div className="row" style={{ marginBottom: 8 }}>
              <h2 className="page-h" style={{ margin: 0 }}>{p.outline.title}</h2><span className="spacer" />
              <span className="hint">{words.toLocaleString()} words · {doneCount} of {total} chapters</span>
            </div>
            <div className="progress"><i style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} /></div>
            <div className="ms" style={{ marginTop: 16 }}>
              <aside className="card toc">
                {p.outline.chapters.map((c, i) => {
                  const t = p.chapters[i];
                  const st = writing === i ? "✎" : t && t.includes(ERR) ? "!" : t ? "✓" : "○";
                  return (
                    <button key={i} className={active === i ? "on" : ""} onClick={() => { setActive(i); setEditing(false); }}>
                      <span style={{ color: "var(--ink-3)" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span className="t">{c.title}</span><span className="st" style={{ color: st === "✓" ? "var(--moss)" : "var(--ember)" }}>{st}</span>
                    </button>
                  );
                })}
              </aside>
              <div className="card">
                <div className="row" style={{ marginBottom: 8 }}>
                  <span className="hint">Chapter {active + 1}</span><span className="spacer" />
                  {p.chapters[active] && writing === null && (
                    <>
                      <button className="ghost" onClick={() => setEditing(!editing)}>{editing ? "Preview" : "Edit"}</button>
                      <button className="ghost" onClick={() => writeBook(active)}>↻ Rewrite</button>
                    </>
                  )}
                </div>
                {editing && p.chapters[active] ? (
                  <textarea className="ms-edit" value={p.chapters[active]} onChange={(e) => setP((x) => { const c = [...x.chapters]; c[active] = e.target.value; return { ...x, chapters: c }; })} />
                ) : p.chapters[active] ? (
                  <div className={`prose ${writing === active ? "caret" : ""}`} dangerouslySetInnerHTML={{ __html: mdToHtml(p.chapters[active].split(ERR)[0]) }} />
                ) : (
                  <div className="forge" style={{ padding: 48 }}>
                    <p>{writing !== null ? "Waiting its turn…" : "This chapter hasn't been written yet."}</p>
                    {writing === null && <button className="btn ember" onClick={() => writeBook()}>Write the manuscript</button>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* STEP 5: Deliver */}
        {p.step === 5 && p.outline && (
          <section>
            <div className="eyebrow">Step 6 · Deliver</div>
            <h2 className="page-h">Your product is ready</h2>
            <p className="page-sub">{words.toLocaleString()} words across {doneCount} chapters. Download it, then open the HTML file in a browser and print to PDF for a polished file to sell.</p>
            <div className="deliver">
              <div className="cover-prev">
                <div><h2>{p.outline.title}</h2><p>{p.outline.subtitle}</p></div>
                <div className="by">{p.author || "Your name"}</div>
              </div>
              <div className="card">
                <div className="field"><label className="lbl">Author name on the cover</label><input value={p.author} onChange={(e) => up({ author: e.target.value })} placeholder="Your name or brand" /></div>
                <div className="dl">
                  <button className="btn ember" onClick={() => download(`${slug(p.outline!.title)}.html`, bookHtml(p.outline!, p.chapters.filter(Boolean), p.author), "text/html")}>⤓ Download eBook (HTML, print-ready)</button>
                  <button className="btn soft" onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(bookHtml(p.outline!, p.chapters.filter(Boolean), p.author)); w.document.close(); setTimeout(() => w.print(), 600); } }}>⎙ Open and print to PDF</button>
                  <button className="btn soft" onClick={() => download(`${slug(p.outline!.title)}.md`, bookMarkdown(p.outline!, p.chapters.filter(Boolean), p.author), "text/markdown")}>⤓ Download Markdown</button>
                  <button className="btn soft" onClick={() => download(`${slug(p.outline!.title)}-project.json`, JSON.stringify(p, null, 2), "application/json")}>⤓ Save project file</button>
                </div>
                {doneCount < total && <p className="hint" style={{ marginTop: 12 }}>{total - doneCount} chapter(s) aren't written yet. Go back to Manuscript to finish them.</p>}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer actions */}
      {p.step > 0 && !busy && (
        <div className="footer-bar"><div className="in">
          <button className="ghost" onClick={() => go(p.step - 1)} disabled={writing !== null}>← Back</button>
          {pocket && p.step >= 2 && <span className="hint" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pocket.niche}</span>}
          <span className="spacer" />
          {p.step === 1 && <button className="btn ember" disabled={!pocket} onClick={() => (p.transformation ? go(2) : buildTransformation())}>Map the transformation →</button>}
          {p.step === 2 && p.transformation && <>
            <button className="ghost" onClick={buildTransformation}>↻ Regenerate</button>
            <button className="btn ember" onClick={() => (p.outline ? go(3) : buildOutline())}>Build the blueprint →</button>
          </>}
          {p.step === 2 && !p.transformation && <button className="btn ember" onClick={buildTransformation}>Try again</button>}
          {p.step === 3 && p.outline && <>
            <button className="ghost" onClick={buildOutline}>↻ Regenerate</button>
            <button className="btn ember" onClick={() => { go(4); if (!p.chapters.some(Boolean)) setTimeout(() => writeBook(), 50); }}>Write the manuscript →</button>
          </>}
          {p.step === 3 && !p.outline && <button className="btn ember" onClick={buildOutline}>Try again</button>}
          {p.step === 4 && (writing !== null
            ? <button className="btn soft" onClick={() => abort.current?.abort()}>■ Pause writing</button>
            : <>
              {doneCount < total && <button className="btn soft" onClick={() => writeBook()}>{doneCount ? "Resume writing" : "Write the manuscript"}</button>}
              <button className="btn ember" disabled={!doneCount} onClick={() => go(5)}>Package & deliver →</button>
            </>)}
        </div></div>
      )}
    </>
  );
}

function confirmReset() {
  return typeof window !== "undefined" && window.confirm("Start a new product? This clears the current one from this browser.");
}
