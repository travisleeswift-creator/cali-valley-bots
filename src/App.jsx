import { useState, useEffect, useRef } from "react";

/* ────────────────────────────────────────────────────────────────
   CALI VALLEY BOTS — LIVE TEAM CONSOLE  (v1.0, built on GT Team Console v3.2)
   11 workers · any project / any app · individual chat · auto-relay
   chaining · MULTI-SEND · INBOX · War Room · Sign-off Ledger ·
   RECORDS (every input from every worker, per project).

   RUNS INSIDE CLAUDE (as an artifact) AND ON ANY WEBSITE:
   · Inside Claude: window.storage + keyless Claude calls, exactly as before.
   · Outside Claude: browser localStorage + your own Anthropic API key
     or proxy URL (Settings tab, stored only on this device).

   DATA SAFETY:
   · Writes to its OWN key (cali_valley_bots_v1). gt_console_v3/v2/v1
     are never written to or deleted — they stay as backups.
   · First run IMPORTS your GT console record into the "GT" project.
   · Nothing is ever deleted. Threads ARCHIVE (restorable). Records and
     ledger entries are CORRECTED, never overwritten — originals kept.
   · Restore / Sync MERGE — they only ever add, never remove.
   · Autosave will not overwrite a loaded record with empty state.
──────────────────────────────────────────────────────────────── */

const APP_NAME = "Cali Valley Bots";
const MAX_CHAIN = 5;
const POOL = 3;
const STORE_KEY = "cali_valley_bots_v1";
const SETTINGS_KEY = "cali_valley_bots_settings_v1";
const LEGACY_KEYS = ["gt_console_v3", "gt_console_v2", "gt_console_v1"];
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_SYNC_URL = "https://cali-valley-bots.travisleeswift.workers.dev/api/sync";
const EXPORT_NUDGE_DAYS = 7;

const GT_BRIEF =
  `GT ("Get This") is a real-time collaborative creative product — animated music notation with a Tone.js audio engine, ` +
  `a cryptographic layer (the "Travis Cipher" family, KDFs, difficulty masks), QR-based session sharing, and offline-first ` +
  `web + mobile clients. Where a specific GT decision has not been made yet, say so and propose a concrete option rather ` +
  `than inventing settled fact.`;

const EMPLOYEES = [
  { id:"marcus", name:"Marcus J. Ellison", title:"Principal Engineer & Architect", pod:"Leads", accent:"#E8B04B", owns:"System structure, repo layout, ADRs, the review bar, final technical escalation — on whatever app we're building.",
    dossier:"14+ yrs. Ex-Principal at OpenAI (ChatGPT serving/orchestration, 0→200M WAU; real-time streaming, rate limiting, multi-model routing) and Staff at Google DeepMind (experiment infra, 4× faster idea→experiment). Earlier Stripe (idempotency, event-sourcing/CQRS for financial correctness). Stack: TS/Node, Python, Go, Postgres, Redis, Kafka, K8s, Cloudflare Workers, OpenTelemetry. On any product you keep the architecture simple enough to ship fast yet robust enough for its real constraints. You author ADRs and hold the code-review bar." },
  { id:"elena", name:"Elena V. Korsakova", title:"Principal Product Manager", pod:"Leads", accent:"#E8B04B", owns:"Scope, roadmap, 'what ships first', discovery→backlog, north-star metrics for the current project.",
    dossier:"12+ yrs, zero-to-one specialist across consumer, creator, marketplace and B2B products. Led consumer surfaces at Anthropic (0→18M WAU in 14 months) and ChatGPT growth at OpenAI (launch→100M). Earlier Soundtrap/Spotify + Splice. Skills: RICE/ICE, continuous discovery, JTBD, north-star metrics, OKRs, GTM sequencing. You convert insights into a prioritized backlog in days, write crisp specs + decision logs, and protect the team from scope creep while raising the quality bar." },
  { id:"kai", name:"Kai M. Reeves", title:"Staff Backend Engineer", pod:"Real-Time Core", accent:"#5FBBCB", owns:"API server, data model, database, realtime/sync, integrations — the backend of any app.",
    dossier:"12+ yrs backend and real-time systems. Ex-Staff at Figma (multiplayer infra for tens of millions concurrent; SSE + Postgres LISTEN/NOTIFY; presence; p99 −55%) and Senior at Notion (sync pipelines, idempotent ordered delivery, zero-downtime migrations). Earlier Twilio (rate limiting, back-pressure, messaging APIs). Stack: Node/Express/Fastify, TypeScript, Drizzle/Prisma, advanced PostgreSQL, SQLite/D1, tRPC/REST, webhooks. You keep the backend simple, correct and fast so nobody waits on infrastructure, and you give web and mobile clear contracts." },
  { id:"levi", name:"Dr. Levi A. Thorne", title:"Principal Cryptographer", pod:"Real-Time Core", accent:"#C86A9E", owns:"Security, privacy and crypto for any app: auth, keys, encryption, data protection, threat models — the security review gate.",
    dossier:"PhD Cryptography (MIT), 13+ yrs. Ex-Principal at Cloudflare (applied crypto for encrypted real-time collaboration, bot/abuse defence; zero critical audit findings) and Staff at Apple (Secure Enclave-adjacent, constant-time implementation). Owns auth/session design, password hashing (Argon2/scrypt/PBKDF2), HKDF/KDFs, encryption at rest and in transit, secrets handling, privacy/GDPR-by-design. Every change touching keys, identity, personal data or randomness passes your review with a threat model + audit-ready notes. Precise, security-first, never hand-waves a guarantee." },
  { id:"nicole", name:"Nicole A. Vargas", title:"Staff DevOps — fractional", pod:"Real-Time Core", accent:"#5FBBCB", owns:"Hosting, DB ops, CI/CD, deploys, domains, observability, backups, recovery, running cost.",
    dossier:"12+ yrs (part-time/fractional). Ex-Staff at Vercel (CI/CD + preview environments; low-ops Postgres + real-time backends) and Senior at Render (hosting/DB/deploy for thousands of production apps); earlier Heroku. Stack: Vercel, Cloudflare (Workers, Pages, D1, KV, R2), Fly.io, Postgres ops (backups, PITR, pooling), GitHub Actions, Terraform-light, OpenTelemetry. You favour boring, reliable tech, free/cheap tiers first, zero-downtime deploys, and runbooks a small team can operate with confidence." },
  { id:"sophia", name:"Sophia R. Nguyen", title:"Staff Mobile Engineer", pod:"Client Surfaces", accent:"#5FBBCB", owns:"Every mobile screen, navigation, deep links/QR, smooth 60fps UI, offline-first, app-store readiness.",
    dossier:"11+ yrs React Native/Expo. Ex-Staff at Instagram/Meta (RN surfaces for 2B+ users; New Architecture migration; creation-funnel +14%) and Senior at Discord (RN realtime, animated reactions). Stack: RN 0.76+, Expo SDK 52+, Expo Router, Reanimated 3, Gesture Handler, Skia, Zustand/Jotai, MMKV/SQLite, EAS Build/Submit. You ship pixel-perfect 60fps interactions that feel native, own deep-linking and sharing, and keep the app reliable offline." },
  { id:"alexander", name:"Alexander R. Thorne", title:"Staff/Principal Web Engineer", pod:"Client Surfaces", accent:"#5FBBCB", owns:"The web app — React/Next.js architecture, performance (Core Web Vitals), accessibility, design-system implementation.",
    dossier:"11+ yrs high-scale web engineering. Ex-Staff at Nexus Labs (180M MAU web platform; legacy SPA → Next.js App Router + React Server Components, median LCP 2.8s→1.1s, p75 INP 310ms→95ms; design system + visual regression adopted by 42 teams; edge rendering on Cloudflare Workers, $1.7M/yr saved). Earlier Orbit Commerce (checkout funnel −22% abandonment) and Brightline Digital. Stack: React 19, Next.js 15/RSC, Vite, TypeScript, Tailwind v4, TanStack Query/Zustand, Playwright/Vitest. You own the web app's architecture, speed, accessibility and quality bar." },
  { id:"diego", name:"Diego A. Herrera", title:"Staff Backend & Platform / PWA Architect", pod:"Client Surfaces", accent:"#9B8CE0", owns:"PWA/installability, service workers + offline-first, edge/platform services, cheap-to-host architecture.",
    dossier:"11+ yrs backend & platform. Ex-Staff at Nexus Labs (core platform for 180M MAU: auth, multi-tenant isolation, event pipelines on Kafka + Redis Streams, 99.99% availability; built & open-sourced a multi-page PWA framework used by 40k+ devs — progressive enhancement + service workers, installable, offline-capable, SEO-friendly; edge patterns on Cloudflare Workers + Durable Objects). Earlier Orbit Commerce (12k RPS idempotent order orchestration). Stack: Node/NestJS/Fastify, event-driven/CQRS, Cloudflare Workers/Durable Objects/R2/KV, Workbox, IndexedDB, SQLite, free hosting (GitHub Pages + Cloudflare). You make any app installable, offline-capable and cheap to host without sacrificing web standards." },
  { id:"amara", name:"Amara S. Okonkwo", title:"Principal Product Designer", pod:"Client Surfaces", accent:"#E8B04B", owns:"Product flows, IA, visual language, motion/feel, accessibility, design-QA for the current project.",
    dossier:"13+ yrs. Ex-Principal at Airbnb (core consumer surfaces for hundreds of millions; company-standard motion/micro-interaction system; −70% design inconsistency) and Staff at Instagram (creation visual language, WCAG 2.2 AA). Skills: end-to-end flows, IA, design systems at scale, motion, usability + preference testing, Figma (advanced), design tokens, handoff. You give any product a premium, trustworthy feel and hand engineering specs they can build without ambiguity." },
  { id:"isabella", name:"Isabella F. Marchand", title:"Staff Audio & Music-Tech Engineer", pod:"Music & Correctness", accent:"#89C08A", owns:"Audio, media and timing; any music/sound/video features; correctness of data formats, imports and exports.",
    dossier:"12+ yrs. Ex-Staff at Splice (real-time audio engine — Tone.js + custom AudioWorklet — for millions of producers; MIDI import/export + a correctness layer keeping visuals and playback in sync) and Soundtrap/Spotify (browser multi-track engine, collaborative sync). Earlier iZotope. M.M. Music Technology (NYU); B.M. Composition + B.S. CS. On any app you own media, timing-sensitive features and the correctness of every import/export format; where a project has no audio, you bring that same rigour to data formats, file handling and timing." },
  { id:"jonas", name:"Jonas E. Park", title:"Staff Quality Engineer", pod:"Music & Correctness", accent:"#C86A9E", owns:"Test strategy, round-trip/regression suites, cross-device matrix, release go/no-go triage — the QA gate.",
    dossier:"11+ yrs high-assurance testing. Ex-Staff at Stripe (round-trip & differential test suites for payment/crypto systems; −65% critical-path defects; property-based + fuzzing) and Senior at Cloudflare (multi-region/multi-device validation, caught high-sev race conditions). Stack: Playwright, Detox/Maestro, Jest/Vitest, known-answer tests, custom real-time/crypto harnesses, CI. On any project you own the test plan, the iOS/Android/web matrix and go/no-go severity triage." },
];

const byId = Object.fromEntries(EMPLOYEES.map(e => [e.id, e]));
const ID_LIST = EMPLOYEES.map(e => e.id).join(", ");
const rosterLine = e => `- ${e.id} — ${e.name}, ${e.title}: ${e.owns}`;
const first = n => n.replace(/^Dr\.\s*/, "").split(" ")[0];
const emptyThreads = () => Object.fromEntries(EMPLOYEES.map(e => [e.id, []]));
const hhmm = t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const stamp = t => new Date(t).toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
const day = t => new Date(t).toISOString().slice(0, 10);
const uid = p => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const whoName = id => id === "you" ? "You (operator)" : (byId[id] ? byId[id].name : id);
const whoFirst = id => id === "you" ? "You" : (byId[id] ? first(byId[id].name) : id);
const slug = s => (s || "project").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "project";

const SOURCE_LABEL = { chat: "Chat", broadcast: "Multi-send", relay: "Relay hand-off", war: "War room take", synthesis: "War room synthesis", signoff: "Sign-off", operator: "Operator" };

/* ── storage: Claude's window.storage when present, else localStorage ── */
const hasClaudeStorage = () => { try { return typeof window !== "undefined" && !!window.storage && typeof window.storage.get === "function"; } catch (_) { return false; } };
const store = {
  async get(k) {
    if (hasClaudeStorage()) { try { const r = await window.storage.get(k); return r && r.value ? r.value : null; } catch (_) { return null; } }
    try { return window.localStorage.getItem(k); } catch (_) { return null; }
  },
  async set(k, v) {
    if (hasClaudeStorage()) { await window.storage.set(k, v); return; }
    window.localStorage.setItem(k, v);
  },
};

/* ── AI settings (only used outside Claude; inside Claude calls stay keyless) ── */
const DEFAULT_SETTINGS = { apiKey: "", proxyUrl: "", model: DEFAULT_MODEL, maxTokens: DEFAULT_MAX_TOKENS, syncUrl: DEFAULT_SYNC_URL, syncCode: "" };
let AI = { ...DEFAULT_SETTINGS };

function projectContext(proj) {
  return proj ? `PROJECT: ${proj.name}\n${proj.brief || "(No brief written yet — ask the operator what the app is before assuming.)"}` : "";
}

function baseIdentity(p, proj) {
  const roster = EMPLOYEES.filter(e => e.id !== p.id).map(rosterLine).join("\n");
  return (
`You are ${p.name}, ${p.title} — an elite specialist on the Cali Valley Bots build team. The team works on whatever app or product the operator's active project describes. Speak in first person as this individual. Never break character and never say you are an AI or a model. You operate above the human bar: senior, concise, concrete, never negative, never padding.

PRODUCT CONTEXT (the app we are building right now):
${projectContext(proj)}
Apply your expertise to THIS product. If your specialism is not central to it, contribute from your adjacent strengths and say so in one line. Where a decision has not been made yet, say so and propose a concrete option rather than inventing settled fact.

YOUR DOSSIER: ${p.dossier}
YOU OWN: ${p.owns}

YOUR TEAMMATES (you know each of them and how to hand work to them):
${roster}`);
}

const RELAY_RULES = `
AUTOMATIC RELAY PROTOCOL (chained events):
- When the next action is genuinely owned by a specific teammate, end your reply and then on the FINAL lines emit EXACTLY ONE relay block and nothing after it:
\`\`\`relay
{"to":"<id>","brief":"<one or two sentences telling that teammate precisely what to pick up, plus any decisions you made>"}
\`\`\`
- Valid ids: ${ID_LIST}. Use the id, not the name. Never relay to yourself.
- Only relay when it truly advances the build. Do not bounce work back and forth.
- If the incoming message begins with "[Relay from ...]" or "[Broadcast", acknowledge it in one line, then do your part.`;

function systemPromptFor(p, mode, proj) {
  const base = baseIdentity(p, proj);
  if (mode === "war") return base + `

WAR-ROOM MODE: You are one voice in a live war room. Give a SHORT take — 2 to 4 sentences, strictly from your lane: your recommendation, the one risk or dependency you own, and what you need from a teammate. Do not restate the question. Do NOT emit any relay block. Be decisive.`;
  if (mode === "chair") return base + `

WAR-ROOM CHAIR: You are chairing this war room. You will receive the question plus every teammate's take. Produce the room's single unified answer in your own voice: (1) the decision/direction in 1–2 sentences; (2) the sequenced plan — who does what first, second, third, naming people; (3) the single most important open question. Authoritative and concise. No relay block.`;
  if (mode === "multi") return base + `

MULTI-SEND MODE: This message went to several teammates at once. Answer ONLY for your own lane in 3–6 sentences — do not speak for anyone else and do not summarise the team. State what you will do, and name the one thing you need from a specific teammate. You may emit a relay block ONLY if a hand-off is genuinely required; it will be queued for the operator, not fired automatically.` + RELAY_RULES;
  return base + `

HOW YOU WORK HERE:
- Give real, actionable, above-graduate-level substance grounded in your own expertise. No filler, no hedging.
- Stay in your lane of ownership. When the next step genuinely belongs to a teammate, do your part, then hand off.
- Never fabricate a settled decision. If it is undecided, propose a concrete option and name who should confirm.
` + RELAY_RULES;
}

function parseRelay(text) {
  const m = text.match(/```relay\s*([\s\S]*?)```/i);
  if (!m) return { clean: text.trim(), relay: null };
  const clean = text.replace(m[0], "").trim();
  try {
    const o = JSON.parse(m[1].trim());
    if (o && o.to && byId[o.to]) return { clean, relay: { to: o.to, brief: o.brief || "" } };
  } catch (_) {}
  return { clean, relay: null };
}

function normalizeForAPI(msgs) {
  const out = [];
  for (const m of msgs) {
    if (m.isError) continue;
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += "\n\n" + m.text;
    else out.push({ role: m.role, content: m.text });
  }
  // the API needs the first turn to be the user's
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Retries transient failures (429, 5xx, network) with backoff + jitter.
   Inside Claude: keyless call, exactly as before. Outside Claude: proxy URL
   if set, else direct to Anthropic with the key from Settings. */
async function callClaude(system, messages, attempts = 4) {
  const outside = !hasClaudeStorage();
  const useProxy = outside && !!AI.proxyUrl;
  const url = useProxy ? AI.proxyUrl : "https://api.anthropic.com/v1/messages";
  const headers = { "Content-Type": "application/json" };
  if (outside && !useProxy && AI.apiKey) {
    headers["x-api-key"] = AI.apiKey;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  const body = JSON.stringify({ model: (outside && AI.model) || DEFAULT_MODEL, max_tokens: Math.max(256, Number(AI.maxTokens) || DEFAULT_MAX_TOKENS), system, messages });
  let last = "unknown";
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: "POST", headers, body });
      if (res.ok) {
        const data = await res.json();
        const txt = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
        if (txt) return txt;
        last = "empty";
      } else {
        last = String(res.status);
        if (res.status === 400 || res.status === 401 || res.status === 403) throw new Error(last);
      }
    } catch (e) {
      if (["400", "401", "403"].includes(e.message)) throw e;
      last = last === "unknown" ? "network" : last;
    }
    if (i < attempts - 1) await sleep(Math.round((700 * Math.pow(2, i)) + Math.random() * 400));
  }
  throw new Error(last);
}

function errorLine(code) {
  const outside = !hasClaudeStorage();
  if (code === "429") return "Hit the rate limit — too many of us calling at once. I retried a few times and it still bounced. Wait a few seconds and press Retry.";
  if (code === "empty") return "The link opened but came back empty. Press Retry.";
  if (code === "network") return outside && !AI.apiKey && !AI.proxyUrl ? "No AI link set up on this device. Open Settings and add your Anthropic API key or a proxy URL, then press Retry." : "Network dropped mid-call. Nothing was lost — press Retry.";
  if (/^5\d\d$/.test(code)) return `Server error ${code} upstream. Press Retry in a moment.`;
  if (["401", "403"].includes(code) && outside) return `Request rejected (${code}). Check the API key or proxy URL in Settings, then press Retry.`;
  if (["400", "401", "403"].includes(code)) return `Request rejected (${code}). This one won't fix itself by retrying — tell your operator.`;
  return `Call failed (${code}). Press Retry.`;
}

/* Staggered pool: spaces out starts so later workers don't get rate-limited. */
async function runPool(items, size, worker, stagger = 300) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async (_, lane) => {
    await sleep(lane * stagger);
    while (i < items.length) { const idx = i++; await worker(items[idx]); await sleep(stagger); }
  }));
}

let FEED_SEQ = 0;
const feedId = () => `f${Date.now().toString(36)}_${(FEED_SEQ++).toString(36)}`;

/* ── data model: projects ── */
function newProject(id, name, brief) {
  return { id, name, brief: brief || "", createdAt: Date.now(), threads: emptyThreads(), archive: {}, feed: [], relayLog: [], ledger: [], records: [], war: { prompt: "", chair: "marcus", takes: {}, synth: null } };
}

function normWar(w) {
  w = w || {};
  const takes = {};
  Object.entries(w.takes || {}).forEach(([k, v]) => {
    if (typeof v === "string") takes[k] = { status: "done", text: v };
    else if (v && v.status === "done") takes[k] = { status: "done", text: v.text };
  });
  let synth = null;
  if (typeof w.synth === "string" && w.synth) synth = { status: "done", text: w.synth, chair: w.chair || "marcus" };
  else if (w.synth && w.synth.status === "done") synth = { status: "done", text: w.synth.text, chair: w.synth.chair || w.chair || "marcus" };
  return { prompt: w.prompt || "", chair: w.chair || "marcus", takes, synth };
}

/* Records derived from an imported (pre-records) project — deterministic ids so
   importing the same data twice never duplicates anything. */
function buildRecords(p, savedAt) {
  const recs = [];
  const srcByMid = {};
  (p.feed || []).forEach(f => { if (f.mid) srcByMid[f.mid] = f.source; });
  const fromMsgs = (eid, msgs) => (msgs || []).forEach((m, i) => {
    if (m.isError || !m.text) return;
    const ts = m.ts || savedAt || Date.now();
    if (m.role === "user") {
      if (m.kind === "relay-in") return;
      recs.push({ id: `r_${m.mid}`, ts, empId: "you", source: "operator", text: m.text.replace(/^\[Broadcast to the team\]\s*/, ""), to: eid, via: m.kind === "broadcast-in" ? "multi" : "chat", corrections: [], imported: true });
    } else {
      const prev = msgs[i - 1];
      const relayIn = prev && prev.kind === "relay-in" ? prev : null;
      const fromE = relayIn ? EMPLOYEES.find(e => relayIn.text.startsWith(`[Relay from ${e.name}]`)) : null;
      const s = srcByMid[m.mid];
      const source = s && s !== "imported" ? s : (relayIn ? "relay" : (prev && prev.kind === "broadcast-in" ? "broadcast" : "chat"));
      recs.push({ id: `r_${m.mid}`, ts, empId: eid, source, from: fromE ? fromE.id : null, text: m.text, to: m.relay ? m.relay.to : null, brief: m.relay ? m.relay.brief : null, mid: m.mid, corrections: [], imported: true });
    }
  });
  Object.entries(p.archive || {}).forEach(([eid, bundles]) => (bundles || []).forEach(b => fromMsgs(eid, b.msgs)));
  Object.entries(p.threads || {}).forEach(([eid, msgs]) => fromMsgs(eid, msgs));
  const warFeed = (p.feed || []).filter(f => f.source === "war" || f.source === "synthesis");
  if (warFeed.length) warFeed.forEach(f => recs.push({ id: `r_${f.id}`, ts: f.ts || savedAt, empId: f.empId, source: f.source, text: f.text, corrections: [], imported: true }));
  else {
    Object.entries(p.war.takes || {}).forEach(([k, v]) => recs.push({ id: `r_war_${k}`, ts: savedAt || Date.now(), empId: k, source: "war", text: v.text, corrections: [], imported: true }));
    if (p.war.synth) recs.push({ id: `r_synth`, ts: savedAt || Date.now(), empId: p.war.synth.chair, source: "synthesis", text: p.war.synth.text, corrections: [], imported: true });
  }
  (p.ledger || []).forEach(e => recs.push(signoffRecord(e, true)));
  return recs.sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

function signoffRecord(e, imported) {
  return { id: `r_${e.id}`, ts: e.at, empId: e.empId, source: "signoff", text: e.title + (e.decision ? ` — ${e.decision}` : ""), title: e.title, decision: e.decision, notes: e.notes, gates: { ...(e.gates || {}) }, ledgerId: e.id, corrections: [], ...(imported ? { imported: true } : {}) };
}

function normalizeProject(raw, savedAt) {
  const p = { ...newProject(raw.id || "gt", raw.name || "Untitled project", raw.brief), ...raw };
  const threads = emptyThreads();
  Object.entries(raw.threads || {}).forEach(([eid, msgs]) => { threads[eid] = (msgs || []).map((m, i) => ({ ...m, mid: m.mid || `m_${eid}_${m.ts || 0}_${i}` })); });
  p.threads = threads;
  p.archive = Object.fromEntries(Object.entries(raw.archive || {}).map(([eid, bundles]) => [eid, (bundles || []).map((b, bi) => ({ ...b, msgs: (b.msgs || []).map((m, i) => ({ ...m, mid: m.mid || `a_${eid}_${b.at || bi}_${i}` })) }))]));
  if (Array.isArray(raw.feed)) {
    p.feed = raw.feed.map(f => {
      if (f.mid) return f;
      const t = threads[f.empId];
      return { ...f, mid: typeof f.idx === "number" && t && t[f.idx] ? t[f.idx].mid : null };
    });
  } else {
    const built = [];
    Object.entries(threads).forEach(([eid, msgs]) => msgs.forEach((m, i) => {
      if (m.role === "assistant" && !m.isError) built.push({ id: `f_${eid}_${m.ts || 0}_${i}`, empId: eid, ts: m.ts || savedAt || Date.now(), text: m.text, source: "imported", read: true, mid: m.mid, relay: m.relay || null });
    }));
    p.feed = built;
  }
  p.relayLog = raw.relayLog || [];
  p.ledger = raw.ledger || [];
  p.war = normWar(raw.war);
  p.records = Array.isArray(raw.records) ? raw.records.map(r => ({ corrections: [], ...r })) : buildRecords(p, savedAt);
  return p;
}

function projectFromLegacy(s) {
  return normalizeProject({ id: "gt", name: "GT · Get This", brief: GT_BRIEF, threads: s.threads, archive: s.archive, feed: s.feed, relayLog: s.relayLog, ledger: s.ledger, war: s.war }, s.savedAt);
}

function freshRoot() {
  const gt = newProject("gt", "GT · Get This", GT_BRIEF);
  return { v: 1, app: APP_NAME, activeProjectId: "gt", projectOrder: ["gt"], projects: { gt }, lastExportAt: null, lastSyncAt: null };
}

function normalizeRoot(r) {
  const projects = {};
  Object.entries(r.projects || {}).forEach(([id, p]) => { projects[id] = normalizeProject({ ...p, id }, r.savedAt); });
  const order = (r.projectOrder || []).filter(id => projects[id]);
  Object.keys(projects).forEach(id => { if (!order.includes(id)) order.push(id); });
  if (!order.length) return freshRoot();
  return { v: 1, app: APP_NAME, activeProjectId: projects[r.activeProjectId] ? r.activeProjectId : order[0], projectOrder: order, projects, lastExportAt: r.lastExportAt || null, lastSyncAt: r.lastSyncAt || null };
}

/* Accepts a Cali Valley Bots backup, a per-project record export, or any GT console backup/record. */
function rootFromAny(o) {
  if (!o || typeof o !== "object") throw new Error("not a backup file");
  if (o.projects) return normalizeRoot(o);
  if (o.project && o.project.id && Array.isArray(o.records)) {
    const p = normalizeProject({ ...o.project, records: o.records, threads: o.threads, archive: o.archive, feed: o.feed, relayLog: o.relayLog, ledger: o.ledger, war: o.war });
    return { projects: { [p.id]: p }, projectOrder: [p.id] };
  }
  if (o.threads || o.ledger || o.feed || o.relayLog) { const p = projectFromLegacy(o); return { projects: { gt: p }, projectOrder: ["gt"] }; }
  throw new Error("not a backup file");
}

/* ── non-destructive merge: only ever adds ── */
const unionBy = (a = [], b = [], key) => {
  const seen = new Set(a.map(key));
  const out = [...a];
  b.forEach(x => { const k = key(x); if (!seen.has(k)) { seen.add(k); out.push(x); } });
  return out;
};
const byTs = (x, y) => (x.ts || 0) - (y.ts || 0);

function mergeProject(a, b) {
  const threads = { ...emptyThreads() };
  new Set([...Object.keys(a.threads || {}), ...Object.keys(b.threads || {})]).forEach(eid => {
    threads[eid] = unionBy(a.threads[eid] || [], (b.threads || {})[eid] || [], m => m.mid).sort(byTs);
  });
  const archive = { ...(a.archive || {}) };
  Object.entries(b.archive || {}).forEach(([eid, bundles]) => { archive[eid] = unionBy(archive[eid] || [], bundles, x => x.at); });
  const recMap = new Map(a.records.map(r => [r.id, r]));
  const records = [...a.records];
  b.records.forEach(r => {
    if (!recMap.has(r.id)) { recMap.set(r.id, r); records.push(r); }
    else {
      const mine = recMap.get(r.id);
      const merged = { ...mine, corrections: unionBy(mine.corrections || [], r.corrections || [], c => c.at).sort((x, y) => x.at - y.at) };
      records[records.indexOf(mine)] = merged; recMap.set(r.id, merged);
    }
  });
  const ledger = unionBy(a.ledger, b.ledger, e => e.id).map(e => {
    const other = b.ledger.find(x => x.id === e.id);
    return other && other !== e ? { ...e, corrections: unionBy(e.corrections || [], other.corrections || [], c => c.at).sort((x, y) => x.at - y.at) } : e;
  });
  const hasWar = a.war && (Object.keys(a.war.takes || {}).length || a.war.synth || a.war.prompt);
  return {
    ...a,
    threads, archive,
    feed: unionBy(a.feed, b.feed, f => f.id).sort(byTs),
    relayLog: unionBy(a.relayLog, b.relayLog, x => `${x.t}|${x.from}|${x.to}`),
    ledger,
    records: records.sort(byTs),
    war: hasWar ? a.war : b.war,
  };
}

function mergeRoot(local, inc) {
  const projects = { ...local.projects };
  const order = [...local.projectOrder];
  let added = 0, merged = 0;
  (inc.projectOrder || Object.keys(inc.projects)).forEach(id => {
    const p = inc.projects[id]; if (!p) return;
    if (projects[id]) { projects[id] = mergeProject(projects[id], p); merged++; }
    else { projects[id] = p; order.push(id); added++; }
  });
  return { root: { ...local, projects, projectOrder: order }, added, merged };
}

/* ── sync encryption: AES-GCM, key derived from the sync code ── */
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
function bytesToB64(bytes) { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); }
async function syncKeys(code) {
  const enc = new TextEncoder();
  const id = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode("cvb-sync-id:" + code)))).map(b => b.toString(16).padStart(2, "0")).join("");
  const base = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode("cali-valley-bots-sync-v1"), iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  return { id, key };
}
async function sealJSON(obj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return JSON.stringify({ v: 1, iv: b64(iv), ct: bytesToB64(new Uint8Array(ct)) });
}
async function openJSON(text, key) {
  const o = JSON.parse(text);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(o.iv) }, key, unb64(o.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const currentText = r => (r.corrections && r.corrections.length ? r.corrections[r.corrections.length - 1].text : r.text) || "";
const ledgerDecision = e => (e.corrections && e.corrections.length ? e.corrections[e.corrections.length - 1].decision : e.decision) || "";
const ledgerNotes = e => (e.corrections && e.corrections.length && e.corrections[e.corrections.length - 1].notes != null ? e.corrections[e.corrections.length - 1].notes : e.notes) || "";

export default function App() {
  const [data, setData] = useState(null);
  const dataRef = useRef(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsDraft, setSettingsDraft] = useState(DEFAULT_SETTINGS);
  const [view, setView] = useState("chat");
  const [activeId, setActiveId] = useState("elena");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(new Set());
  const [autoRelay, setAutoRelay] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [dataNote, setDataNote] = useState("");
  const [syncing, setSyncing] = useState(false);

  // multi-send
  const [multiMode, setMultiMode] = useState(false);
  const [multiTargets, setMultiTargets] = useState(() => new Set());
  // inbox
  const [inboxFilter, setInboxFilter] = useState("all");
  // ledger
  const [signOff, setSignOff] = useState(null);
  const [ledgerFilter, setLedgerFilter] = useState("all");
  // war room
  const [warParticipants, setWarParticipants] = useState(() => new Set(EMPLOYEES.map(e => e.id)));
  const [warRunning, setWarRunning] = useState(false);
  // records
  const [recWorker, setRecWorker] = useState("all");
  const [recSource, setRecSource] = useState("all");
  const [recQuery, setRecQuery] = useState("");
  const [recAll, setRecAll] = useState(false);
  const [recLimit, setRecLimit] = useState(200);
  // modals
  const [correcting, setCorrecting] = useState(null);
  const [projEdit, setProjEdit] = useState(null);

  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const loadedRef = useRef(false);
  const saveWarnedRef = useRef(false);

  /* every state change goes through commit(): the ref is always current, so
     async chains (relay, multi-send, war room) never read stale data */
  const commit = fn => { const next = fn(dataRef.current); dataRef.current = next; setData(next); };
  const updProj = (pid, fn) => commit(d => d.projects[pid] ? { ...d, projects: { ...d.projects, [pid]: fn(d.projects[pid]) } } : d);
  const setThread = (pid, eid, fn) => updProj(pid, p => ({ ...p, threads: { ...p.threads, [eid]: fn(p.threads[eid] || []) } }));
  const setWar = (pid, fn) => updProj(pid, p => ({ ...p, war: fn(p.war) }));
  const pushFeed = (pid, entry) => updProj(pid, p => ({ ...p, feed: [...p.feed, { id: feedId(), read: false, ts: Date.now(), ...entry }] }));
  const addRecord = (pid, rec) => updProj(pid, p => ({ ...p, records: [...p.records, { id: uid("r"), ts: Date.now(), corrections: [], ...rec }] }));

  /* ── LOAD: own key first, else non-destructively import gt_console v3 → v2 → v1 ── */
  useEffect(() => {
    (async () => {
      try {
        const sraw = await store.get(SETTINGS_KEY);
        if (sraw) { const s = { ...DEFAULT_SETTINGS, ...JSON.parse(sraw) }; AI = s; setSettings(s); setSettingsDraft(s); }
      } catch (_) {}
      let root = null, note = "";
      try { const raw = await store.get(STORE_KEY); if (raw) root = normalizeRoot(JSON.parse(raw)); } catch (_) {}
      if (!root) {
        for (const k of LEGACY_KEYS) {
          try {
            const raw = await store.get(k);
            if (raw) {
              const gt = projectFromLegacy(JSON.parse(raw));
              root = { ...freshRoot(), projects: { gt } };
              note = `Imported your ${k.replace("gt_console_", "GT console ")} record into the "GT" project — nothing was deleted, ${k} is still saved as a backup.`;
              break;
            }
          } catch (_) {}
        }
      }
      dataRef.current = root || freshRoot();
      setData(dataRef.current);
      if (note) setDataNote(note);
      loadedRef.current = true; setLoaded(true);
    })();
  }, []);

  /* ── SAVE: guarded ── */
  useEffect(() => {
    if (!loaded || !loadedRef.current || !data) return;
    (async () => {
      try { await store.set(STORE_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); saveWarnedRef.current = false; }
      catch (_) {
        if (!saveWarnedRef.current) { saveWarnedRef.current = true; setDataNote("Couldn't save to this browser's storage (it may be full or blocked). Export a backup now so nothing is lost."); }
      }
    })();
  }, [data, loaded]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [data, activeId, busy, view]);

  if (!data) return <div className="gt-root"><style>{CSS}</style><div className="loading">Loading {APP_NAME}…</div></div>;

  const pid = data.activeProjectId;
  const P = data.projects[pid];
  const threads = P.threads, feed = P.feed, ledger = P.ledger, archive = P.archive, war = P.war;
  const warTakes = war.takes || {}, warSynth = war.synth, warPrompt = war.prompt || "", warChair = war.chair || "marcus";
  const active = byId[activeId];
  const unread = feed.filter(f => !f.read).length;
  const pendingHandoffs = feed.filter(f => f.relay && !f.relay.done).length;
  const isBusy = id => busy.has(id);
  const anyBusy = busy.size > 0;
  const locked = anyBusy || warRunning;
  const setBusyOn = (id, on) => setBusy(prev => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; });
  const inClaude = hasClaudeStorage();
  const hasData = Object.values(data.projects).some(p => p.records.length > 0);
  const exportDue = hasData && (!data.lastExportAt || Date.now() - data.lastExportAt > EXPORT_NUDGE_DAYS * 864e5);

  function markRelayDone(p, eid, mid) {
    updProj(p, pr => ({
      ...pr,
      threads: { ...pr.threads, [eid]: (pr.threads[eid] || []).map(m => m.mid === mid && m.relay ? { ...m, relay: { ...m.relay, done: true } } : m) },
      feed: pr.feed.map(f => f.mid === mid && f.relay ? { ...f, relay: { ...f.relay, done: true } } : f),
    }));
  }

  /* ── core turn ── */
  async function runTurn(p, toId, text, fromId, depth, mode = "chat", allowAuto = true, isRetry = false) {
    const fromName = fromId ? byId[fromId].name : null;
    const label = fromName ? `[Relay from ${fromName}] ${text}` : (mode === "multi" ? `[Broadcast to the team] ${text}` : text);
    const userMsg = { mid: uid("m"), role: "user", text: label, kind: fromName ? "relay-in" : (mode === "multi" ? "broadcast-in" : "user"), ts: Date.now() };
    const proj = dataRef.current.projects[p];
    const base = [...(proj.threads[toId] || []), userMsg];
    setThread(p, toId, t => [...t, userMsg]);
    if (!fromId && mode === "chat" && !isRetry) addRecord(p, { empId: "you", source: "operator", text, to: toId, via: "chat" });
    setBusyOn(toId, true);

    let replyText, relay = null;
    try {
      const raw = await callClaude(systemPromptFor(byId[toId], mode, proj), normalizeForAPI(base));
      const pr = parseRelay(raw);
      replyText = pr.clean || "…";
      relay = pr.relay && pr.relay.to !== toId ? pr.relay : null;
    } catch (e) {
      const code = e && e.message ? e.message : "unknown";
      setBusyOn(toId, false);
      setThread(p, toId, t => [...t, { mid: uid("m"), role: "assistant", isError: true, errCode: code, ts: Date.now(), text: errorLine(code), retry: { text, fromId, depth, mode, allowAuto } }]);
      setDataNote(`${first(byId[toId].name)} couldn't be reached (${code}) — nothing was lost, press Retry in their thread.`);
      return;
    }

    const willAuto = !!relay && autoRelay && allowAuto && depth < MAX_CHAIN;
    const mid = uid("m");
    const source = mode === "multi" ? "broadcast" : (fromId ? "relay" : "chat");
    const relayObj = relay ? { ...relay, done: willAuto } : null;
    setThread(p, toId, t => [...t, { mid, role: "assistant", text: replyText, relay: relayObj, ts: Date.now() }]);
    pushFeed(p, { empId: toId, text: replyText, source, mid, relay: relayObj });
    addRecord(p, { empId: toId, source, text: replyText, from: fromId || null, to: relay ? relay.to : null, brief: relay ? relay.brief : null, mid });
    setBusyOn(toId, false);

    if (relay) {
      updProj(p, pr => ({ ...pr, relayLog: [...pr.relayLog, { from: toId, to: relay.to, auto: willAuto, t: Date.now() }] }));
      if (willAuto) {
        if (dataRef.current.activeProjectId === p) setActiveId(relay.to);
        await sleep(420);
        await runTurn(p, relay.to, relay.brief, toId, depth + 1, "chat", true);
      }
    }
  }

  async function onSend() {
    const t = input.trim();
    if (!t || locked) return;
    if (multiMode) {
      const ids = EMPLOYEES.filter(e => multiTargets.has(e.id)).map(e => e.id);
      if (ids.length < 2) return;
      setInput("");
      setView("inbox");
      addRecord(pid, { empId: "you", source: "operator", text: t, to: ids.join(","), via: "multi" });
      await runPool(ids, POOL, async id => { await runTurn(pid, id, t, null, 0, "multi", false); });
      return;
    }
    setInput("");
    await runTurn(pid, activeId, t, null, 0, "chat", true);
  }

  /* Retry a failed turn: drops the failed pair, replays the same request. */
  async function retryTurn(empId, mid) {
    const list = threads[empId] || [];
    const idx = list.findIndex(m => m.mid === mid);
    const m = list[idx];
    if (!m || !m.retry || locked) return;
    const { text, depth, mode, allowAuto } = m.retry;
    const fromId = m.retry.fromId || (m.retry.fromName ? (EMPLOYEES.find(e => e.name === m.retry.fromName) || {}).id : null) || null;
    const prev = list[idx - 1];
    const dropPrev = prev && prev.role === "user";
    setThread(pid, empId, t => t.filter(x => x.mid !== mid && !(dropPrev && x.mid === prev.mid)));
    await sleep(200);
    await runTurn(pid, empId, text, fromId, depth || 0, mode || "chat", allowAuto !== false, true);
  }

  /* One tiny call to prove an individual worker's link is up. */
  async function testLink(empId) {
    if (locked) return;
    setBusyOn(empId, true);
    setDataNote(`Testing the link to ${first(byId[empId].name)}…`);
    try {
      await callClaude(`You are ${byId[empId].name}. Reply with exactly: online.`, [{ role: "user", content: "status check" }], 2);
      setDataNote(`${first(byId[empId].name)}'s link is up and answering.`);
    } catch (e) {
      setDataNote(`${first(byId[empId].name)}'s link failed (${e.message}). ${errorLine(e.message)}`);
    }
    setBusyOn(empId, false);
  }

  async function continueRelayFromThread(fromId, mid) {
    const m = (threads[fromId] || []).find(x => x.mid === mid);
    if (!m || !m.relay || m.relay.done || locked) return;
    markRelayDone(pid, fromId, mid);
    updProj(pid, pr => ({ ...pr, relayLog: [...pr.relayLog, { from: fromId, to: m.relay.to, auto: false, manual: true, t: Date.now() }] }));
    setActiveId(m.relay.to); setView("chat");
    await runTurn(pid, m.relay.to, m.relay.brief, fromId, 0, "chat", true);
  }
  async function continueRelayFromFeed(f) {
    if (!f.relay || f.relay.done || locked) return;
    if (f.mid) markRelayDone(pid, f.empId, f.mid);
    else updProj(pid, pr => ({ ...pr, feed: pr.feed.map(x => x.id === f.id ? { ...x, relay: { ...x.relay, done: true } } : x) }));
    updProj(pid, pr => ({ ...pr, relayLog: [...pr.relayLog, { from: f.empId, to: f.relay.to, auto: false, manual: true, t: Date.now() }] }));
    setActiveId(f.relay.to); setView("chat");
    await runTurn(pid, f.relay.to, f.relay.brief, f.empId, 0, "chat", true);
  }

  /* ── archive (never delete) ── */
  function archiveThread(id) {
    if (!threads[id] || threads[id].length === 0) return;
    updProj(pid, pr => ({ ...pr, archive: { ...pr.archive, [id]: [...(pr.archive[id] || []), { at: Date.now(), msgs: pr.threads[id] }] }, threads: { ...pr.threads, [id]: [] } }));
    setDataNote(`${first(byId[id].name)}'s thread archived — restorable, nothing deleted. Their full record stays in Records.`);
  }
  function restoreThread(id) {
    const bundles = archive[id]; if (!bundles || !bundles.length) return;
    const last = bundles[bundles.length - 1];
    updProj(pid, pr => ({ ...pr, threads: { ...pr.threads, [id]: [...last.msgs, ...pr.threads[id]] }, archive: { ...pr.archive, [id]: bundles.slice(0, -1) } }));
    setDataNote(`Restored ${first(byId[id].name)}'s archived thread.`);
  }

  /* ── projects ── */
  function switchProject(id) {
    if (locked || !data.projects[id]) return;
    commit(d => ({ ...d, activeProjectId: id }));
    setMultiMode(false);
    setDataNote(`Switched to project "${data.projects[id].name}". The whole team now works on this app.`);
  }
  function saveProject() {
    if (!projEdit || !projEdit.name.trim()) return;
    const name = projEdit.name.trim(), brief = projEdit.brief.trim();
    if (projEdit.id) {
      updProj(projEdit.id, p => ({ ...p, name, brief, briefHistory: [...(p.briefHistory || []), { at: Date.now(), name: p.name, brief: p.brief }] }));
      setDataNote(`Project "${name}" updated — the previous name/brief is kept in its history.`);
    } else {
      if (locked) return;
      let id = slug(name).toLowerCase().slice(0, 32);
      while (dataRef.current.projects[id]) id = id + "_" + Math.random().toString(36).slice(2, 5);
      commit(d => ({ ...d, projects: { ...d.projects, [id]: newProject(id, name, brief) }, projectOrder: [...d.projectOrder, id], activeProjectId: id }));
      setMultiMode(false); setView("chat");
      setDataNote(`Project "${name}" created and opened. Every worker now has its brief as their product context.`);
    }
    setProjEdit(null);
  }

  /* ── backup / restore ── */
  function exportBackup() {
    const payload = { app: APP_NAME, version: 1, exportedAt: new Date().toISOString(), employees: EMPLOYEES.map(({ id, name, title, pod, owns }) => ({ id, name, title, pod, owns })), ...dataRef.current };
    try {
      download(`CaliValleyBots_backup_${day(Date.now())}.json`, JSON.stringify(payload, null, 2), "application/json");
      commit(d => ({ ...d, lastExportAt: Date.now() }));
      setDataNote("Backup downloaded — every project, thread, record and ledger entry. Keep it safe; Restore can load it on any device.");
    } catch (_) { setDataNote("Export blocked by the browser here — your record is still saved in the console."); }
  }
  function onRestoreFile(ev) {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!f) return;
    if (locked) { setDataNote("Wait for the team to finish replying, then restore."); return; }
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const inc = rootFromAny(JSON.parse(rd.result));
        let res = null;
        commit(d => { res = mergeRoot(d, inc); return res.root; });
        setDataNote(`Restored from ${f.name}: ${res.merged} project(s) merged, ${res.added} added. Nothing on this device was removed.`);
      } catch (e) { setDataNote(`Couldn't read ${f.name} — it isn't a Cali Valley Bots or GT console backup. Nothing was changed.`); }
    };
    rd.readAsText(f);
  }

  /* ── sync (optional): encrypted with your sync code, stored in the app's Cloudflare KV ── */
  async function syncNow() {
    const code = (settings.syncCode || "").trim();
    if (code.length < 12) { setDataNote("Set a sync code of at least 12 characters in Settings first — use the same code on every device."); setView("settings"); return; }
    if (locked || syncing) return;
    const base = (settings.syncUrl || DEFAULT_SYNC_URL).replace(/\/+$/, "");
    setSyncing(true);
    try {
      const { id, key } = await syncKeys(code);
      const r = await fetch(`${base}/${id}`);
      let pulled = null;
      if (r.status === 200) {
        let remote;
        try { remote = await openJSON(await r.text(), key); } catch (_) { throw new Error("couldn't decrypt — wrong sync code?"); }
        const inc = rootFromAny(remote);
        commit(d => { pulled = mergeRoot(d, inc); return pulled.root; });
      } else if (r.status !== 404) throw new Error(`server ${r.status}`);
      const { lastExportAt, lastSyncAt, ...rest } = dataRef.current;
      const put = await fetch(`${base}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: await sealJSON({ ...rest, savedAt: Date.now() }, key) });
      if (!put.ok) throw new Error(`server ${put.status}`);
      commit(d => ({ ...d, lastSyncAt: Date.now() }));
      setDataNote(pulled ? `Synced — pulled ${pulled.merged + pulled.added} project(s) from the cloud, merged, and pushed this device's record back. Nothing removed.` : "Synced — this device's record is now in the cloud (encrypted with your sync code).");
    } catch (e) {
      setDataNote(`Sync failed (${e.message || "network"}). Nothing was lost — your record is still saved here.`);
    }
    setSyncing(false);
  }

  function saveSettings() {
    const s = { ...settingsDraft, maxTokens: Math.max(256, Math.min(64000, Number(settingsDraft.maxTokens) || DEFAULT_MAX_TOKENS)) };
    AI = s; setSettings(s); setSettingsDraft(s);
    store.set(SETTINGS_KEY, JSON.stringify(s)).then(() => setDataNote("Settings saved on this device only. They are never synced or exported."), () => setDataNote("Settings applied for this session, but this browser blocked saving them."));
  }

  /* ── war room ── */
  function toggleParticipant(id) { setWarParticipants(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  async function convene() {
    const parts = EMPLOYEES.filter(e => warParticipants.has(e.id));
    if (locked || !warPrompt.trim() || parts.length < 2) return;
    const p = pid, proj = P, chairId = warChair;
    setWarRunning(true);
    const q = warPrompt.trim();
    setWar(p, w => ({ ...w, synth: null, takes: Object.fromEntries(parts.map(x => [x.id, { status: "pending", text: "" }])) }));
    addRecord(p, { empId: "you", source: "operator", text: q, to: parts.map(x => x.id).join(","), via: "war" });
    const collected = {};
    await runPool(parts, POOL, async x => {
      try {
        const t = await callClaude(systemPromptFor(x, "war", proj), [{ role: "user", content: q }]);
        collected[x.id] = t;
        setWar(p, w => ({ ...w, takes: { ...w.takes, [x.id]: { status: "done", text: t } } }));
        pushFeed(p, { empId: x.id, text: t, source: "war", mid: null, relay: null });
        addRecord(p, { empId: x.id, source: "war", text: t, question: q });
      } catch (e) { setWar(p, w => ({ ...w, takes: { ...w.takes, [x.id]: { status: "err", text: "", code: e.message } } })); }
    });
    const chair = byId[chairId];
    setWar(p, w => ({ ...w, synth: { status: "pending", text: "", chair: chairId } }));
    const body = Object.entries(collected).map(([id, t]) => `— ${byId[id].name} (${byId[id].title}): ${t}`).join("\n\n");
    try {
      const s = await callClaude(systemPromptFor(chair, "chair", proj), [{ role: "user", content: `QUESTION: ${q}\n\nTEAM TAKES:\n${body}` }]);
      setWar(p, w => ({ ...w, synth: { status: "done", text: s, chair: chairId } }));
      pushFeed(p, { empId: chairId, text: s, source: "synthesis", mid: null, relay: null });
      addRecord(p, { empId: chairId, source: "synthesis", text: s, question: q });
    } catch (_) { setWar(p, w => ({ ...w, synth: { status: "err", text: "", chair: chairId } })); }
    setWarRunning(false);
  }
  async function retryTake(empId) {
    if (locked || !warPrompt.trim()) return;
    const p = pid, proj = P, q = warPrompt.trim();
    setWarRunning(true);
    setWar(p, w => ({ ...w, takes: { ...w.takes, [empId]: { status: "pending", text: "" } } }));
    try {
      const t = await callClaude(systemPromptFor(byId[empId], "war", proj), [{ role: "user", content: q }]);
      setWar(p, w => ({ ...w, takes: { ...w.takes, [empId]: { status: "done", text: t } } }));
      pushFeed(p, { empId, text: t, source: "war", mid: null, relay: null });
      addRecord(p, { empId, source: "war", text: t, question: q });
    } catch (e) {
      setWar(p, w => ({ ...w, takes: { ...w.takes, [empId]: { status: "err", text: "", code: e.message } } }));
    }
    setWarRunning(false);
  }

  /* ── SIGN-OFF LEDGER ── */
  function openSignOff(empId, text, mid) {
    setSignOff({ empId, evidence: text, mid: mid || null, title: "", decision: "", gates: { levi: false, jonas: false }, notes: "" });
  }
  function commitSignOff() {
    if (!signOff || !signOff.title.trim()) return;
    const entry = {
      id: `L${Date.now().toString(36)}`,
      n: ledger.length + 1,
      at: Date.now(),
      empId: signOff.empId,
      title: signOff.title.trim(),
      decision: signOff.decision.trim(),
      gates: { ...signOff.gates },
      notes: signOff.notes.trim(),
      evidence: (signOff.evidence || "").slice(0, 1200),
      mid: signOff.mid,
    };
    updProj(pid, pr => ({ ...pr, ledger: [...pr.ledger, entry], records: [...pr.records, signoffRecord(entry)] }));
    setSignOff(null);
    setDataNote(`Signed off #${entry.n} — "${entry.title}" filed to the ledger and the record.`);
  }

  /* ── corrections (originals always kept) ── */
  function commitCorrection() {
    const c = correcting; if (!c) return;
    if (c.kind === "record") {
      if (!c.text.trim()) return;
      updProj(c.pid, pr => ({ ...pr, records: pr.records.map(r => r.id === c.id ? { ...r, corrections: [...(r.corrections || []), { at: Date.now(), text: c.text.trim(), note: c.note.trim() }] } : r) }));
    } else {
      updProj(c.pid, pr => ({ ...pr, ledger: pr.ledger.map(e => e.id === c.id ? { ...e, corrections: [...(e.corrections || []), { at: Date.now(), decision: c.text.trim(), notes: c.notes.trim(), note: c.note.trim() }] } : e) }));
    }
    setCorrecting(null);
    setDataNote("Correction filed — the original is kept underneath it.");
  }

  /* ── exports ── */
  const esc = t => (t || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const gateStr = g => `${g && g.levi ? "Crypto ✓ (Levi)" : "Crypto —"} · ${g && g.jonas ? "QA ✓ (Jonas)" : "QA —"}`;

  function exportLedgerMarkdown() {
    if (ledger.length === 0) { setDataNote("Nothing signed off yet on this project — the ledger is empty."); return; }
    const lines = [
      `# ${P.name.toUpperCase()} — SIGN-OFF LEDGER`, "",
      `**Exported:** ${day(Date.now())} · **Entries:** ${ledger.length} · **Team:** ${APP_NAME}`, "",
      `Work agreed and signed off on ${P.name}. Each entry names the owner, the decision, and which hard gates were passed.`, "",
      "---", "", "## Decision log", "",
      "| # | Date | Work | Owner | Gates | Decision |",
      "|---|---|---|---|---|---|",
      ...ledger.map(e => `| ${e.n} | ${day(e.at)} | ${esc(e.title)} | ${whoName(e.empId)} | ${gateStr(e.gates)} | ${esc(ledgerDecision(e)) || "—"}${e.corrections && e.corrections.length ? " _(corrected)_" : ""} |`),
      "", "---", "", "## Detail", "",
      ...ledger.flatMap(e => {
        const o = byId[e.empId];
        return [
          `### ${e.n}. ${e.title}`, "",
          `**Date:** ${day(e.at)} · **Owner:** ${o ? `${o.name} — ${o.title}` : e.empId} · **Gates:** ${gateStr(e.gates)}`, "",
          ledgerDecision(e) ? `**Decision:** ${ledgerDecision(e)}` : "**Decision:** _not recorded_", "",
          ...(ledgerNotes(e) ? [`**Notes:** ${ledgerNotes(e)}`, ""] : []),
          ...((e.corrections || []).length ? ["**Correction history (originals kept):**", "", `- Original (${day(e.at)}): ${e.decision || "—"}${e.notes ? ` · notes: ${e.notes}` : ""}`, ...e.corrections.map(c => `- Corrected ${stamp(c.at)}: ${c.decision || "—"}${c.notes ? ` · notes: ${c.notes}` : ""}${c.note ? ` — _${c.note}_` : ""}`), ""] : []),
          ...(e.evidence ? ["<details><summary>Source reply</summary>", "", "> " + e.evidence.replace(/\n/g, "\n> "), "", "</details>", ""] : []),
          "---", "",
        ];
      }),
      `_Generated by ${APP_NAME} · ${ledger.length} entries · nothing deleted._`, "",
    ];
    try {
      download(`${slug(P.name)}_signoff_ledger_${day(Date.now())}.md`, lines.join("\n"), "text/markdown");
      setDataNote(`Ledger exported — ${ledger.length} entries as Markdown.`);
    } catch (_) { setDataNote("Export blocked by the browser here — the ledger is still saved in the console."); }
  }

  function exportRecordsMarkdown() {
    const recs = P.records;
    if (!recs.length) { setDataNote("No records on this project yet."); return; }
    const lines = [
      `# ${P.name} — FULL WORKER RECORD`, "",
      `**Exported:** ${new Date().toISOString()} · **Entries:** ${recs.length} · **Team:** ${APP_NAME}`, "",
      "## Project brief", "", P.brief || "_No brief written._", "", "---", "",
      "## Contributions by worker", "",
      "| Worker | Inputs |", "|---|---|",
      ...EMPLOYEES.map(e => `| ${e.name} — ${e.title} | ${recs.filter(r => r.empId === e.id).length} |`),
      "", "---", "", "## Full log (oldest first)", "",
      ...recs.flatMap(r => [
        `### ${stamp(r.ts)} · ${whoName(r.empId)} · ${SOURCE_LABEL[r.source] || r.source}${r.to && r.empId !== "you" ? ` → handed to ${whoFirst(r.to)}` : ""}${r.from ? ` (relayed from ${whoFirst(r.from)})` : ""}`, "",
        currentText(r), "",
        ...(r.brief ? [`> **Hand-off brief:** ${r.brief}`, ""] : []),
        ...((r.corrections || []).length ? ["<details><summary>Correction history — original kept</summary>", "", "**Original:**", "", r.text, "", ...r.corrections.flatMap(c => [`**Corrected ${stamp(c.at)}**${c.note ? ` — _${c.note}_` : ""}:`, "", c.text, ""]), "</details>", ""] : []),
      ]),
      `_Generated by ${APP_NAME} · nothing deleted._`, "",
    ];
    download(`${slug(P.name)}_worker_record_${day(Date.now())}.md`, lines.join("\n"), "text/markdown");
    setDataNote(`Full worker record exported — ${recs.length} entries as Markdown.`);
  }

  function exportRecordsJSON() {
    const { id, name, brief, createdAt, briefHistory } = P;
    const payload = { app: APP_NAME, kind: "project-record", version: 1, exportedAt: new Date().toISOString(), project: { id, name, brief, createdAt, briefHistory }, employees: EMPLOYEES.map(({ id, name, title, pod, owns }) => ({ id, name, title, pod, owns })), records: P.records, ledger: P.ledger, relayLog: P.relayLog, threads: P.threads, archive: P.archive, feed: P.feed, war: P.war };
    download(`${slug(P.name)}_worker_record_${day(Date.now())}.json`, JSON.stringify(payload, null, 2), "application/json");
    setDataNote(`Project record exported as JSON — ${P.records.length} entries. Restore can load it on any device.`);
  }

  /* CSV columns match the Notion database "Cali Valley Bots — Worker Records". */
  function exportRecordsCSV() {
    const recs = P.records.filter(r => r.empId !== "you" && r.source !== "operator" && SOURCE_LABEL[r.source]);
    if (!recs.length) { setDataNote("No worker inputs on this project yet."); return; }
    const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const head = ["Summary", "Project", "Worker", "Source", "Handed to", "Input", "When", "Crypto gate (Levi)", "QA gate (Jonas)"];
    const rows = recs.map(r => {
      const txt = currentText(r);
      const isSign = r.source === "signoff";
      const summary = isSign ? (r.title || txt) : txt.replace(/\s+/g, " ").trim().slice(0, 90) + (txt.length > 90 ? "…" : "");
      return [summary, P.name, whoFirst(r.empId), SOURCE_LABEL[r.source], r.to && byId[r.to] ? first(byId[r.to].name) : "", txt, new Date(r.ts).toISOString(), isSign && r.gates && r.gates.levi ? "Yes" : "No", isSign && r.gates && r.gates.jonas ? "Yes" : "No"].map(q).join(",");
    });
    download(`${slug(P.name)}_worker_records_${day(Date.now())}.csv`, [head.map(q).join(","), ...rows].join("\r\n"), "text/csv");
    setDataNote(`CSV exported — ${recs.length} worker inputs, columns ready for the Notion "Worker Records" database.`);
  }

  const podOrder = ["Leads", "Real-Time Core", "Client Surfaces", "Music & Correctness"];
  const grouped = podOrder.map(p => ({ pod: p, list: EMPLOYEES.filter(e => e.pod === p) }));
  const filteredFeed = [...feed].reverse().filter(f =>
    inboxFilter === "unread" ? !f.read :
    inboxFilter === "handoff" ? (f.relay && !f.relay.done) :
    inboxFilter === "war" ? (f.source === "war" || f.source === "synthesis") : true);

  const recPool = recAll ? data.projectOrder.flatMap(id => data.projects[id].records.map(r => ({ ...r, _pid: id }))) : P.records.map(r => ({ ...r, _pid: pid }));
  const qLow = recQuery.trim().toLowerCase();
  const recFiltered = recPool
    .filter(r => recWorker === "all" || r.empId === recWorker)
    .filter(r => recSource === "all" || r.source === recSource)
    .filter(r => !qLow || [currentText(r), r.text, r.brief, whoName(r.empId), r.title, r.question].some(t => t && t.toLowerCase().includes(qLow)))
    .sort((a, b) => b.ts - a.ts);

  return (
    <div className="gt-root">
      <style>{CSS}</style>
      <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onRestoreFile} />

      {/* SIDEBAR */}
      <aside className="side">
        <div className="brand">
          <div className="brand-title">Cali Valley <span>/ Bots</span></div>
          <div className="brand-sub">v1.0 · 11 workers · any app</div>
        </div>

        <div className="proj">
          <div className="proj-h">Project</div>
          <div className="proj-row">
            <select value={pid} onChange={e => switchProject(e.target.value)} disabled={locked} title={locked ? "Wait for replies to finish before switching" : "Switch project"}>
              {data.projectOrder.map(id => <option key={id} value={id}>{data.projects[id].name}</option>)}
            </select>
            <button className="proj-btn" onClick={() => setProjEdit({ id: pid, name: P.name, brief: P.brief })} title="Rename / edit this project's brief">Edit</button>
            <button className="proj-btn" onClick={() => setProjEdit({ id: null, name: "", brief: "" })} disabled={locked} title="New project">+ New</button>
          </div>
        </div>

        <div className="viewtabs">
          <button className={view === "chat" ? "on" : ""} onClick={() => setView("chat")}>Team</button>
          <button className={view === "inbox" ? "on" : ""} onClick={() => setView("inbox")}>
            Inbox{unread > 0 && <span className="tabdot">{unread}</span>}
          </button>
          <button className={view === "war" ? "on" : ""} onClick={() => setView("war")}>War Room</button>
          <button className={view === "ledger" ? "on" : ""} onClick={() => setView("ledger")}>
            Ledger{ledger.length > 0 && <span className="tabcount">{ledger.length}</span>}
          </button>
          <button className={view === "records" ? "on" : ""} onClick={() => setView("records")}>
            Records{P.records.length > 0 && <span className="tabcount">{P.records.length}</span>}
          </button>
          <button className={view === "settings" ? "on" : ""} onClick={() => { setSettingsDraft(settings); setView("settings"); }}>Settings</button>
        </div>

        {view === "chat" && (
          <>
            <label className="auto">
              <input type="checkbox" checked={autoRelay} onChange={e => setAutoRelay(e.target.checked)} />
              <span>Auto-relay <em>{autoRelay ? "chaining hand-offs" : "manual"}</em></span>
            </label>
            <label className="auto">
              <input type="checkbox" checked={multiMode} onChange={e => { setMultiMode(e.target.checked); if (e.target.checked && multiTargets.size === 0) setMultiTargets(new Set([activeId])); }} />
              <span>Multi-send <em>{multiMode ? `${multiTargets.size} selected` : "one at a time"}</em></span>
            </label>
          </>
        )}

        <div className="roster">
          {grouped.map(g => (
            <div key={g.pod} className="pod-group">
              <div className="pod-name">{g.pod}</div>
              {g.list.map(e => {
                const count = threads[e.id]?.length || 0;
                const un = feed.filter(f => f.empId === e.id && !f.read).length;
                const picked = multiMode && multiTargets.has(e.id);
                return (
                  <button key={e.id}
                    className={"emp" + (view === "chat" && !multiMode && e.id === activeId ? " on" : "") + (picked ? " picked" : "")}
                    style={{ "--a": e.accent }}
                    onClick={() => {
                      if (multiMode) setMultiTargets(p => { const n = new Set(p); n.has(e.id) ? n.delete(e.id) : n.add(e.id); return n; });
                      else { setActiveId(e.id); setView("chat"); }
                    }}>
                    <span className={"led" + (picked ? " check" : "")} />
                    <span className="emp-main">
                      <span className="emp-name">{first(e.name)} {e.name.split(" ").slice(-1)}</span>
                      <span className="emp-role">{e.title}</span>
                    </span>
                    {isBusy(e.id) ? <span className="mini-busy" /> : un > 0 ? <span className="badge hot">{un}</span> : count > 0 ? <span className="badge">{count}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="safety">
          {exportDue && <div className="nudge">{data.lastExportAt ? `Last backup ${day(data.lastExportAt)}.` : "No backup yet."} Export one so your records survive a cleared browser.</div>}
          <div className="safety-row">
            <button className="exp" onClick={exportBackup}>Export backup</button>
            <button className="exp" onClick={() => fileRef.current && fileRef.current.click()} disabled={locked}>Restore</button>
          </div>
          {settings.syncCode && settings.syncCode.length >= 12 && <button className="exp sync" onClick={syncNow} disabled={locked || syncing}>{syncing ? "Syncing…" : "Sync devices"}</button>}
          <div className="safety-note">Nothing is ever deleted. GT console v1–v3 records kept intact. {inClaude ? "Saving in Claude." : "Saving in this browser."}</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {dataNote && <div className="note-bar"><span>{dataNote}</span><button onClick={() => setDataNote("")}>×</button></div>}

        {/* ── CHAT ── */}
        {view === "chat" && (
          <>
            <header className="head" style={{ "--a": multiMode ? "#E8B04B" : active.accent }}>
              {multiMode ? (
                <>
                  <div className="head-left">
                    <div className="head-name">Multi-send</div>
                    <div className="head-role">{P.name} · one message, parallel replies</div>
                  </div>
                  <div className="head-owns"><span>Selected</span>{multiTargets.size === 0 ? "nobody yet" : EMPLOYEES.filter(e => multiTargets.has(e.id)).map(e => first(e.name)).join(" · ")}</div>
                  <button className="clear" onClick={() => setMultiTargets(new Set(EMPLOYEES.map(e => e.id)))}>All 11</button>
                </>
              ) : (
                <>
                  <div className="head-left">
                    <div className="head-name">{active.name}</div>
                    <div className="head-role">{active.title} · <span>{P.name}</span></div>
                  </div>
                  <div className="head-owns"><span>Owns</span>{active.owns}</div>
                  <button className="clear" onClick={() => testLink(activeId)} disabled={locked} title="Send a tiny call to prove this worker's link is up">Test link</button>
                  {(archive[activeId] || []).length > 0 && <button className="clear" onClick={() => restoreThread(activeId)}>Restore</button>}
                  <button className="clear" onClick={() => archiveThread(activeId)} title="Archives this thread — restorable, never deleted">Archive</button>
                </>
              )}
            </header>

            <div className="scroll" ref={scrollRef}>
              {(threads[activeId] || []).length === 0 && !multiMode && (
                <div className="empty">
                  <div className="empty-name">{first(active.name)} is on the line.</div>
                  <div className="empty-role">{active.title} · working on {P.name}</div>
                  <p>Ask anything in their lane — {active.owns.charAt(0).toLowerCase() + active.owns.slice(1)} {autoRelay ? "Hand-offs chain automatically." : "Hand-offs wait for you to press Continue."}</p>
                  <div className="starter-row">{starters(active.id, P.name).map((s, i) => <button key={i} className="starter" onClick={() => setInput(s)}>{s}</button>)}</div>
                </div>
              )}
              {multiMode && (
                <div className="empty">
                  <div className="empty-name">Multi-send is on.</div>
                  <p>Tap people in the sidebar to select them, type one message below, and it goes to all of them at once. Every reply lands in their own thread, in the <b>Inbox</b> and in <b>Records</b>. Hand-offs are queued for you rather than firing automatically.</p>
                  <div className="starter-row">
                    {[`What do you each need from me to start on ${P.name}?`, "Give me your top risk for v1 in your lane.", "What would you build in week one?"].map((s, i) => <button key={i} className="starter" onClick={() => setInput(s)}>{s}</button>)}
                  </div>
                </div>
              )}

              {!multiMode && (threads[activeId] || []).map(m => {
                if (m.kind === "relay-in" || m.kind === "broadcast-in")
                  return <div key={m.mid} className={"relay-in" + (m.kind === "broadcast-in" ? " bc" : "")}><span className="ri-dot" />{m.text}</div>;
                if (m.role === "user") return <div key={m.mid} className="row right"><div className="bubble you">{m.text}</div></div>;
                return (
                  <div key={m.mid} className="row left">
                    <div className={"bubble emp-b" + (m.isError ? " err" : "")} style={{ "--a": active.accent }}>
                      {!m.isError && <div className="who">{first(active.name)}</div>}
                      {m.isError && <div className="who err-who">link failed · {m.errCode}</div>}
                      <div className="body">{m.text}</div>
                      {m.isError && m.retry && (
                        <button className="ro-btn retry" onClick={() => retryTurn(activeId, m.mid)} disabled={locked}>Retry this message</button>
                      )}
                      {!m.isError && m.role === "assistant" && (
                        <div className="msg-actions">
                          <button className="mini-act" onClick={() => openSignOff(activeId, m.text, m.mid)}>Sign off</button>
                        </div>
                      )}
                      {m.relay && byId[m.relay.to] && (
                        <div className={"relay-out" + (m.relay.done ? " done" : "")}>
                          <div className="ro-line"><span className="ro-arrow">↳</span>{m.relay.done ? "Relayed to " : "Hand off to "}<b>{first(byId[m.relay.to].name)}</b></div>
                          {m.relay.brief && <div className="ro-brief">{m.relay.brief}</div>}
                          {!m.relay.done && <button className="ro-btn" onClick={() => continueRelayFromThread(activeId, m.mid)} disabled={locked}>Continue → {first(byId[m.relay.to].name)}</button>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!multiMode && isBusy(activeId) && <div className="row left"><div className="bubble emp-b typing" style={{ "--a": active.accent }}><span className="dot" /><span className="dot" /><span className="dot" /></div></div>}
              {anyBusy && !isBusy(activeId) && <div className="elsewhere">{[...busy].map(b => first(byId[b].name)).join(", ")} responding…</div>}
            </div>

            <div className="composer">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder={multiMode ? `Message ${multiTargets.size} teammates at once…  (Enter to send)` : `Message ${first(active.name)}…  (Enter to send)`} rows={1} />
              <button className="send" onClick={onSend} disabled={locked || !input.trim() || (multiMode && multiTargets.size < 2)}>
                {multiMode ? `Send to ${multiTargets.size}` : "Send"}
              </button>
            </div>
          </>
        )}

        {/* ── INBOX ── */}
        {view === "inbox" && (
          <>
            <header className="head" style={{ "--a": "#5FBBCB" }}>
              <div className="head-left">
                <div className="head-name">Inbox</div>
                <div className="head-role">Every reply on {P.name}, newest first</div>
              </div>
              <div className="head-owns"><span>Status</span>{feed.length} replies · {unread} unread · {pendingHandoffs} hand-off{pendingHandoffs === 1 ? "" : "s"} waiting</div>
              <button className="clear" onClick={() => updProj(pid, p => ({ ...p, feed: p.feed.map(f => ({ ...f, read: true })) }))}>Mark all read</button>
            </header>
            <div className="scroll" ref={scrollRef}>
              <div className="filters">
                {[["all", "All"], ["unread", `Unread${unread ? ` (${unread})` : ""}`], ["handoff", `Hand-offs${pendingHandoffs ? ` (${pendingHandoffs})` : ""}`], ["war", "War Room"]].map(([k, l]) => (
                  <button key={k} className={"filter" + (inboxFilter === k ? " on" : "")} onClick={() => setInboxFilter(k)}>{l}</button>
                ))}
              </div>
              {filteredFeed.length === 0 && (
                <div className="empty"><div className="empty-name">Nothing here yet.</div>
                  <p>Replies from individual chats, multi-sends and the War Room all collect here so you can read the whole team in one place.</p></div>
              )}
              {filteredFeed.map(f => {
                const e = byId[f.empId]; if (!e) return null;
                const markRead = () => updProj(pid, p => ({ ...p, feed: p.feed.map(x => x.id === f.id ? { ...x, read: true } : x) }));
                return (
                  <div key={f.id} className={"inbox-card" + (f.read ? "" : " unread")} style={{ "--a": e.accent }}>
                    <div className="ic-head">
                      <span className="ic-led" />
                      <span className="ic-name">{e.name}</span>
                      <span className="ic-role">{e.title}</span>
                      <span className={"ic-src src-" + f.source}>{f.source}</span>
                      <span className="ic-time">{hhmm(f.ts)}</span>
                    </div>
                    <div className="ic-body">{f.text}</div>
                    <div className="ic-foot">
                      {!f.read && <button className="ic-btn ghost" onClick={markRead}>Mark read</button>}
                      <button className="ic-btn ghost" onClick={() => { setActiveId(f.empId); setView("chat"); setMultiMode(false); markRead(); }}>Open thread</button>
                      <button className="ic-btn ghost" onClick={() => openSignOff(f.empId, f.text, f.mid)}>Sign off</button>
                      {f.relay && !f.relay.done && byId[f.relay.to] && (
                        <button className="ic-btn go" onClick={() => continueRelayFromFeed(f)} disabled={locked}>Continue → {first(byId[f.relay.to].name)}</button>
                      )}
                      {f.relay && f.relay.done && byId[f.relay.to] && <span className="ic-done">↳ relayed to {first(byId[f.relay.to].name)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── WAR ROOM ── */}
        {view === "war" && (
          <>
            <header className="head" style={{ "--a": "#E8B04B" }}>
              <div className="head-left">
                <div className="head-name">War Room</div>
                <div className="head-role">{P.name} · one question, the room answers as a team</div>
              </div>
              <div className="chair-sel"><span>Chair</span>
                <select value={warChair} onChange={e => { const v = e.target.value; setWar(pid, w => ({ ...w, chair: v })); }} disabled={warRunning}>
                  <option value="marcus">Marcus — Architect</option>
                  <option value="elena">Elena — Product</option>
                </select>
              </div>
            </header>
            <div className="scroll" ref={scrollRef}>
              <div className="war-parts">
                <div className="wp-h">In the room · {warParticipants.size} of {EMPLOYEES.length}</div>
                <div className="wp-chips">
                  {EMPLOYEES.map(e => (
                    <button key={e.id} className={"wp-chip" + (warParticipants.has(e.id) ? " in" : "")} style={{ "--a": e.accent }} onClick={() => toggleParticipant(e.id)} disabled={warRunning}>{first(e.name)}</button>
                  ))}
                </div>
              </div>
              {Object.keys(warTakes).length > 0 && (
                <div className="takes">
                  {EMPLOYEES.filter(e => warTakes[e.id]).map(e => {
                    const t = warTakes[e.id];
                    return (
                      <div key={e.id} className="take" style={{ "--a": e.accent }}>
                        <div className="take-h"><span className="take-name">{first(e.name)}</span><span className="take-role">{e.title}</span></div>
                        {t.status === "pending" && <div className="take-body pending"><span className="dot" /><span className="dot" /><span className="dot" /></div>}
                        {t.status === "err" && (
                          <div className="take-body err">
                            Link failed ({t.code || "?"}).
                            <button className="ro-btn retry" onClick={() => retryTake(e.id)} disabled={locked}>Retry {first(e.name)}</button>
                          </div>
                        )}
                        {t.status === "done" && <div className="take-body">{t.text}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
              {warSynth && byId[warSynth.chair] && (
                <div className="synth" style={{ "--a": byId[warSynth.chair].accent }}>
                  <div className="synth-h"><span className="synth-tag">The room's answer</span> · chaired by {first(byId[warSynth.chair].name)}</div>
                  {warSynth.status === "pending" && <div className="synth-body pending"><span className="dot" /><span className="dot" /><span className="dot" /> gathering the takes into one plan…</div>}
                  {warSynth.status === "err" && <div className="synth-body err">Synthesis dropped — reconvene to retry.</div>}
                  {warSynth.status === "done" && <div className="synth-body">{warSynth.text}</div>}
                </div>
              )}
              {Object.keys(warTakes).length === 0 && (
                <div className="empty war-empty">
                  <div className="empty-name">Convene the room.</div>
                  <p>One question in. Every selected teammate gives a short take from their lane on {P.name}, then {first(byId[warChair].name)} synthesizes it into a single sequenced answer. Every take is filed in your Inbox and Records.</p>
                  <div className="starter-row">
                    {[`What should ${P.name} ship first, and in what order?`, "How do we make this secure and reliable without over-building?", "What's the biggest risk in v1 and who owns it?"].map((s, i) => <button key={i} className="starter" onClick={() => setWar(pid, w => ({ ...w, prompt: s }))}>{s}</button>)}
                  </div>
                </div>
              )}
            </div>
            <div className="composer">
              <textarea value={warPrompt} onChange={e => { const v = e.target.value; setWar(pid, w => ({ ...w, prompt: v })); }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); convene(); } }}
                placeholder="Ask the whole room one question…  (Enter to convene)" rows={1} disabled={warRunning} />
              <button className="send" onClick={convene} disabled={locked || !warPrompt.trim() || warParticipants.size < 2}>{warRunning ? "Convening…" : "Convene"}</button>
            </div>
          </>
        )}

        {/* ── LEDGER ── */}
        {view === "ledger" && (
          <>
            <header className="head" style={{ "--a": "#89C08A" }}>
              <div className="head-left">
                <div className="head-name">Sign-off Ledger</div>
                <div className="head-role">{P.name} · agreed work, filed permanently</div>
              </div>
              <div className="head-owns"><span>Status</span>
                {ledger.length} entr{ledger.length === 1 ? "y" : "ies"} ·{" "}
                {ledger.filter(e => e.gates.levi && e.gates.jonas).length} fully gated ·{" "}
                {ledger.filter(e => !e.gates.levi || !e.gates.jonas).length} partial
              </div>
              <button className="clear go-exp" onClick={exportLedgerMarkdown}>Export Markdown</button>
            </header>
            <div className="scroll" ref={scrollRef}>
              <div className="filters">
                {[["all", "All"], ["gated", "Fully gated"], ["partial", "Gates outstanding"]].map(([k, l]) => (
                  <button key={k} className={"filter green" + (ledgerFilter === k ? " on" : "")} onClick={() => setLedgerFilter(k)}>{l}</button>
                ))}
              </div>
              {ledger.length === 0 && (
                <div className="empty">
                  <div className="empty-name">Nothing signed off yet.</div>
                  <p>When a piece of work is agreed, press <b>Sign off</b> on the reply that settled it — in a thread or in the Inbox. It gets filed here with owner, gates and decision, and exports as clean Markdown for your repo.</p>
                </div>
              )}
              {[...ledger].reverse()
                .filter(e => ledgerFilter === "gated" ? (e.gates.levi && e.gates.jonas) : ledgerFilter === "partial" ? (!e.gates.levi || !e.gates.jonas) : true)
                .map(e => {
                  const o = byId[e.empId];
                  const corrected = (e.corrections || []).length > 0;
                  return (
                    <div key={e.id} className="led-card" style={{ "--a": o ? o.accent : "#89C08A" }}>
                      <div className="led-head">
                        <span className="led-n">#{e.n}</span>
                        <span className="led-title">{e.title}</span>
                        <span className="led-date">{day(e.at)}</span>
                      </div>
                      <div className="led-meta">
                        <span className="led-owner"><span className="ic-led" /> {o ? o.name : e.empId}</span>
                        <span className={"gate-pill" + (e.gates.levi ? " ok" : "")}>{e.gates.levi ? "Crypto ✓" : "Crypto —"}</span>
                        <span className={"gate-pill" + (e.gates.jonas ? " ok" : "")}>{e.gates.jonas ? "QA ✓" : "QA —"}</span>
                        {corrected && <span className="gate-pill fix">corrected · original kept</span>}
                      </div>
                      {ledgerDecision(e) && <div className="led-dec"><b>Decision:</b> {ledgerDecision(e)}</div>}
                      {ledgerNotes(e) && <div className="led-notes">{ledgerNotes(e)}</div>}
                      {corrected && (
                        <details className="hist"><summary>Correction history</summary>
                          <div className="hist-row"><b>Original · {stamp(e.at)}</b> {e.decision || "—"}{e.notes ? ` · ${e.notes}` : ""}</div>
                          {e.corrections.map((c, i) => <div key={i} className="hist-row"><b>Corrected · {stamp(c.at)}</b> {c.decision || "—"}{c.notes ? ` · ${c.notes}` : ""}{c.note ? <em> — {c.note}</em> : null}</div>)}
                        </details>
                      )}
                      <div className="ic-foot">
                        <button className="ic-btn ghost" onClick={() => { setActiveId(e.empId); setView("chat"); setMultiMode(false); }}>Open {o ? first(o.name) : "thread"}</button>
                        <button className="ic-btn ghost" onClick={() => setCorrecting({ kind: "ledger", pid, id: e.id, text: ledgerDecision(e), notes: ledgerNotes(e), note: "", original: e.decision })}>Correct</button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* ── RECORDS ── */}
        {view === "records" && (
          <>
            <header className="head" style={{ "--a": "#9B8CE0" }}>
              <div className="head-left">
                <div className="head-name">Records</div>
                <div className="head-role">{recAll ? "All projects" : P.name} · every input from every worker</div>
              </div>
              <div className="head-owns"><span>Log</span>{P.records.filter(r => r.empId !== "you").length} worker inputs · {P.records.filter(r => r.empId === "you").length} operator messages · {P.relayLog.length} hand-offs</div>
              <button className="clear go-exp" onClick={exportRecordsMarkdown}>Markdown</button>
              <button className="clear go-exp" onClick={exportRecordsJSON}>JSON</button>
              <button className="clear go-exp" onClick={exportRecordsCSV} title="Columns match the Notion Worker Records database">CSV</button>
            </header>
            <div className="scroll" ref={scrollRef}>
              <div className="rec-tools">
                <input className="rec-search" value={recQuery} onChange={e => { setRecQuery(e.target.value); setRecLimit(200); }} placeholder="Search every record…" />
                <select value={recWorker} onChange={e => setRecWorker(e.target.value)}>
                  <option value="all">All workers</option>
                  <option value="you">You (operator)</option>
                  {EMPLOYEES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <select value={recSource} onChange={e => setRecSource(e.target.value)}>
                  <option value="all">All sources</option>
                  {Object.entries(SOURCE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <label className="rec-all"><input type="checkbox" checked={recAll} onChange={e => setRecAll(e.target.checked)} /> All projects</label>
              </div>
              <div className="rec-count">{recFiltered.length} record{recFiltered.length === 1 ? "" : "s"}{recFiltered.length > recLimit ? ` · showing newest ${recLimit}` : ""}</div>
              {recFiltered.length === 0 && (
                <div className="empty"><div className="empty-name">{recPool.length ? "No records match." : "No records yet."}</div>
                  <p>Every chat reply, multi-send answer, relay hand-off, war-room take, chair synthesis and sign-off on this project is filed here automatically — with who, when and where it came from. Nothing is ever deleted; mistakes are corrected with the original kept.</p></div>
              )}
              {recFiltered.slice(0, recLimit).map(r => {
                const e = byId[r.empId];
                const corrected = (r.corrections || []).length > 0;
                return (
                  <div key={r._pid + r.id} className={"inbox-card rec-card" + (r.empId === "you" ? " op" : "")} style={{ "--a": e ? e.accent : "#8A90A6" }}>
                    <div className="ic-head">
                      <span className="ic-led" />
                      <span className="ic-name">{whoName(r.empId)}</span>
                      {e && <span className="ic-role">{e.title}</span>}
                      <span className={"ic-src src-" + r.source}>{SOURCE_LABEL[r.source] || r.source}{r.via && r.empId === "you" ? ` · ${r.via}` : ""}</span>
                      {recAll && <span className="ic-src">{(data.projects[r._pid] || {}).name}</span>}
                      {r.from && byId[r.from] && <span className="ic-src">from {first(byId[r.from].name)}</span>}
                      {r.to && r.empId !== "you" && byId[r.to] && <span className="ic-src src-relay">→ {first(byId[r.to].name)}</span>}
                      {r.to && r.empId === "you" && <span className="ic-src">to {r.to.split(",").map(whoFirst).join(", ")}</span>}
                      {corrected && <span className="ic-src fix">corrected</span>}
                      <span className="ic-time">{stamp(r.ts)}</span>
                    </div>
                    <div className="ic-body">{currentText(r)}</div>
                    {r.brief && <div className="ro-brief"><b>Hand-off brief:</b> {r.brief}</div>}
                    {corrected && (
                      <details className="hist"><summary>Correction history · original kept</summary>
                        <div className="hist-row"><b>Original · {stamp(r.ts)}</b> {r.text}</div>
                        {r.corrections.map((c, i) => <div key={i} className="hist-row"><b>Corrected · {stamp(c.at)}</b> {c.text}{c.note ? <em> — {c.note}</em> : null}</div>)}
                      </details>
                    )}
                    <div className="ic-foot">
                      {e && r._pid === pid && <button className="ic-btn ghost" onClick={() => { setActiveId(r.empId); setView("chat"); setMultiMode(false); }}>Open thread</button>}
                      <button className="ic-btn ghost" onClick={() => setCorrecting({ kind: "record", pid: r._pid, id: r.id, text: currentText(r), note: "", original: r.text })}>Correct</button>
                    </div>
                  </div>
                );
              })}
              {recFiltered.length > recLimit && <div className="starter-row"><button className="starter" onClick={() => setRecLimit(l => l + 200)}>Show more</button></div>}
            </div>
          </>
        )}

        {/* ── SETTINGS ── */}
        {view === "settings" && (
          <>
            <header className="head" style={{ "--a": "#5FBBCB" }}>
              <div className="head-left">
                <div className="head-name">Settings</div>
                <div className="head-role">{inClaude ? "Running inside Claude" : "Running in a browser outside Claude"}</div>
              </div>
              <div className="head-owns"><span>Storage</span>{inClaude ? "Claude storage (window.storage)" : "This browser (localStorage)"} · key {STORE_KEY}</div>
            </header>
            <div className="scroll" ref={scrollRef}>
              <div className="set-card">
                <div className="set-h">AI link</div>
                <p className="set-p">{inClaude ? "Inside Claude the team calls Claude directly with no key — these fields are ignored here." : "Outside Claude the team needs an AI link. Use a proxy URL (recommended — your key stays on your server) or paste an Anthropic API key. Both stay on this device only and are never exported or synced."}</p>
                <label className="fld"><span>Proxy URL <em>optional</em></span>
                  <input value={settingsDraft.proxyUrl} placeholder="https://your-proxy.example.com/v1/messages" onChange={e => { const v = e.target.value.trim(); setSettingsDraft(s => ({ ...s, proxyUrl: v })); }} /></label>
                <label className="fld"><span>Anthropic API key <em>optional</em></span>
                  <input type="password" autoComplete="off" value={settingsDraft.apiKey} placeholder="sk-ant-…" onChange={e => { const v = e.target.value.trim(); setSettingsDraft(s => ({ ...s, apiKey: v })); }} /></label>
                <div className="set-grid">
                  <label className="fld"><span>Model</span>
                    <input value={settingsDraft.model} onChange={e => { const v = e.target.value.trim(); setSettingsDraft(s => ({ ...s, model: v })); }} /></label>
                  <label className="fld"><span>Max reply length (tokens)</span>
                    <input type="number" min="256" max="64000" value={settingsDraft.maxTokens} onChange={e => { const v = e.target.value; setSettingsDraft(s => ({ ...s, maxTokens: v })); }} /></label>
                </div>
                <div className="set-row"><button className="mf go" onClick={saveSettings}>Save settings</button></div>
              </div>

              <div className="set-card">
                <div className="set-h">Sync between devices <em>optional</em></div>
                <p className="set-p">Pick a long private sync code and use the same code on every device. Your record is encrypted on this device with that code before it leaves, then stored in the app's free Cloudflare storage. Sync merges both ways and never deletes. Anyone with the code can read the record, so keep it private.</p>
                <label className="fld"><span>Sync code <em>12+ characters</em></span>
                  <input type="password" autoComplete="off" value={settingsDraft.syncCode} placeholder="e.g. a long phrase only you know" onChange={e => { const v = e.target.value; setSettingsDraft(s => ({ ...s, syncCode: v })); }} /></label>
                <label className="fld"><span>Sync server</span>
                  <input value={settingsDraft.syncUrl} onChange={e => { const v = e.target.value.trim(); setSettingsDraft(s => ({ ...s, syncUrl: v })); }} /></label>
                <div className="set-row">
                  <button className="mf go" onClick={saveSettings}>Save settings</button>
                  <button className="mf ghost" onClick={syncNow} disabled={locked || syncing || !(settings.syncCode && settings.syncCode.length >= 12)}>{syncing ? "Syncing…" : "Sync now"}</button>
                  <span className="set-meta">{data.lastSyncAt ? `Last synced ${stamp(data.lastSyncAt)}` : "Never synced"}</span>
                </div>
              </div>

              <div className="set-card">
                <div className="set-h">Backup &amp; restore</div>
                <p className="set-p">Export saves every project to a file. Restore loads a Cali Valley Bots backup, a project record JSON, or an old GT console backup and merges it in — nothing on this device is removed.</p>
                <div className="set-row">
                  <button className="mf go" onClick={exportBackup}>Export full backup</button>
                  <button className="mf ghost" onClick={() => fileRef.current && fileRef.current.click()} disabled={locked}>Restore from file</button>
                  <span className="set-meta">{data.lastExportAt ? `Last backup ${stamp(data.lastExportAt)}` : "No backup yet"}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SIGN-OFF MODAL ── */}
        {signOff && byId[signOff.empId] && (
          <div className="modal-wrap" onClick={ev => { if (ev.target.classList.contains("modal-wrap")) setSignOff(null); }}>
            <div className="modal" style={{ "--a": byId[signOff.empId].accent }}>
              <div className="modal-h">
                <div>
                  <div className="modal-title">Sign off work</div>
                  <div className="modal-sub">{byId[signOff.empId].name} · {P.name}</div>
                </div>
                <button className="modal-x" onClick={() => setSignOff(null)}>×</button>
              </div>
              <label className="fld">
                <span>What was the work? <em>required</em></span>
                <input autoFocus value={signOff.title} placeholder="e.g. Real-time session model agreed"
                  onChange={ev => { const v = ev.target.value; setSignOff(s => ({ ...s, title: v })); }}
                  onKeyDown={ev => { if (ev.key === "Enter") commitSignOff(); }} />
              </label>
              <label className="fld">
                <span>The decision, in one line</span>
                <input value={signOff.decision} placeholder="e.g. Postgres + SSE for v1, no WebSocket mesh"
                  onChange={ev => { const v = ev.target.value; setSignOff(s => ({ ...s, decision: v })); }} />
              </label>
              <div className="fld">
                <span>Gates passed</span>
                <div className="gate-row">
                  <label className={"gate-check" + (signOff.gates.levi ? " on" : "")}>
                    <input type="checkbox" checked={signOff.gates.levi}
                      onChange={ev => { const v = ev.target.checked; setSignOff(s => ({ ...s, gates: { ...s.gates, levi: v } })); }} />
                    Crypto / security review — Levi
                  </label>
                  <label className={"gate-check" + (signOff.gates.jonas ? " on" : "")}>
                    <input type="checkbox" checked={signOff.gates.jonas}
                      onChange={ev => { const v = ev.target.checked; setSignOff(s => ({ ...s, gates: { ...s.gates, jonas: v } })); }} />
                    QA — Jonas
                  </label>
                </div>
                <div className="gate-hint">Leave unticked if the gate genuinely doesn't apply or hasn't run — the ledger records the truth, not the intention.</div>
              </div>
              <label className="fld">
                <span>Notes (optional)</span>
                <textarea rows={2} value={signOff.notes} placeholder="Anything future-you needs to know"
                  onChange={ev => { const v = ev.target.value; setSignOff(s => ({ ...s, notes: v })); }} />
              </label>
              <div className="ev-box">
                <div className="ev-h">Filed as evidence</div>
                <div className="ev-body">{(signOff.evidence || "").slice(0, 320)}{(signOff.evidence || "").length > 320 ? "…" : ""}</div>
              </div>
              <div className="modal-foot">
                <button className="mf ghost" onClick={() => setSignOff(null)}>Cancel</button>
                <button className="mf go" onClick={commitSignOff} disabled={!signOff.title.trim()}>File to ledger</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CORRECTION MODAL ── */}
        {correcting && (
          <div className="modal-wrap" onClick={ev => { if (ev.target.classList.contains("modal-wrap")) setCorrecting(null); }}>
            <div className="modal" style={{ "--a": "#9B8CE0" }}>
              <div className="modal-h">
                <div>
                  <div className="modal-title">{correcting.kind === "record" ? "Correct this record" : "Correct this ledger entry"}</div>
                  <div className="modal-sub">The original is kept — corrections are added on top, never overwritten.</div>
                </div>
                <button className="modal-x" onClick={() => setCorrecting(null)}>×</button>
              </div>
              <label className="fld"><span>{correcting.kind === "record" ? "Corrected text" : "Corrected decision"}</span>
                <textarea rows={correcting.kind === "record" ? 8 : 2} value={correcting.text} onChange={ev => { const v = ev.target.value; setCorrecting(c => ({ ...c, text: v })); }} /></label>
              {correcting.kind === "ledger" && (
                <label className="fld"><span>Corrected notes</span>
                  <textarea rows={2} value={correcting.notes} onChange={ev => { const v = ev.target.value; setCorrecting(c => ({ ...c, notes: v })); }} /></label>
              )}
              <label className="fld"><span>Why (optional)</span>
                <input value={correcting.note} placeholder="e.g. figure was wrong, agreed fix in standup" onChange={ev => { const v = ev.target.value; setCorrecting(c => ({ ...c, note: v })); }} /></label>
              <div className="ev-box">
                <div className="ev-h">Original (kept)</div>
                <div className="ev-body">{(correcting.original || "—").slice(0, 400)}</div>
              </div>
              <div className="modal-foot">
                <button className="mf ghost" onClick={() => setCorrecting(null)}>Cancel</button>
                <button className="mf go" onClick={commitCorrection} disabled={correcting.kind === "record" && !correcting.text.trim()}>File correction</button>
              </div>
            </div>
          </div>
        )}

        {/* ── PROJECT MODAL ── */}
        {projEdit && (
          <div className="modal-wrap" onClick={ev => { if (ev.target.classList.contains("modal-wrap")) setProjEdit(null); }}>
            <div className="modal" style={{ "--a": "#E8B04B" }}>
              <div className="modal-h">
                <div>
                  <div className="modal-title">{projEdit.id ? "Edit project" : "New project"}</div>
                  <div className="modal-sub">The brief is given to every worker as the product they're building.</div>
                </div>
                <button className="modal-x" onClick={() => setProjEdit(null)}>×</button>
              </div>
              <label className="fld"><span>Project / app name <em>required</em></span>
                <input autoFocus value={projEdit.name} placeholder="e.g. McKenzie Friends" onChange={ev => { const v = ev.target.value; setProjEdit(p => ({ ...p, name: v })); }} /></label>
              <label className="fld"><span>What is the app? (brief)</span>
                <textarea rows={7} value={projEdit.brief} placeholder="What it does, who it's for, platforms, stack, what's decided, what's not, constraints (budget, hosting, legal)…" onChange={ev => { const v = ev.target.value; setProjEdit(p => ({ ...p, brief: v })); }} /></label>
              <div className="modal-foot">
                <button className="mf ghost" onClick={() => setProjEdit(null)}>Cancel</button>
                <button className="mf go" onClick={saveProject} disabled={!projEdit.name.trim()}>{projEdit.id ? "Save" : "Create project"}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function starters(id, name) {
  const map = {
    marcus: [`How should we structure the repo for ${name}?`, "What's the first ADR we need?"],
    elena: [`What should we build first for ${name}?`, "Draft the v1 scope."],
    kai: ["Design the data model and API.", "What does the backend need for v1?"],
    levi: ["Set the security and privacy threat model.", "How should auth and personal data be handled?"],
    nicole: ["What's the cheapest reliable hosting setup?", "How do we deploy with zero downtime?"],
    sophia: ["Plan the mobile screen architecture.", "What does the mobile app need for v1?"],
    alexander: ["Plan the web app architecture.", "How do we hit our Core Web Vitals targets?"],
    diego: ["Design the offline-first PWA shell.", `How do we make ${name} installable and free to host?`],
    amara: ["What should the core flow feel like?", "Define the visual and motion system."],
    isabella: ["Which parts need media or timing-critical work?", "How do we keep imports and exports correct?"],
    jonas: ["Write the v1 test plan.", "Design the device test matrix."],
  };
  return map[id] || [`What do you own on ${name}?`, "Where should we start?"];
}

const CSS = `
:root{--ink:#0F1119;--panel:#171A26;--panel2:#1E2231;--hair:rgba(236,231,218,.10);
--text:#ECE7DA;--muted:#8A90A6;--signal:#E8B04B;--gate:#C86A9E;--cool:#5FBBCB;--green:#89C08A;}
*{box-sizing:border-box;}
.gt-root{display:flex;height:100vh;min-height:560px;color:var(--text);font-family:'Inter',system-ui,-apple-system,sans-serif;
background:radial-gradient(1000px 500px at 8% -8%,rgba(232,176,75,.06),transparent 60%),var(--ink);}
.gt-root button{font-family:inherit;cursor:pointer;}
.side{width:284px;flex:none;border-right:1px solid var(--hair);display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(30,34,49,.6),transparent);}
.brand{padding:17px 18px 9px;}
.brand-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:21px;letter-spacing:-.01em;}
.brand-title span{color:var(--muted);font-weight:500;font-size:13.5px;}
.brand-sub{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--signal);margin-top:3px;}
.viewtabs{display:flex;gap:5px;padding:2px 14px 10px;}
.viewtabs button{flex:1;position:relative;font-size:12px;color:var(--muted);background:var(--panel);border:1px solid var(--hair);border-radius:8px;padding:8px 0;}
.viewtabs button.on{color:#1b1608;background:var(--signal);border-color:var(--signal);font-weight:600;}
.tabdot{position:absolute;top:-5px;right:-4px;background:var(--gate);color:#fff;font-size:9.5px;font-weight:700;border-radius:999px;padding:1px 5px;min-width:16px;}
.auto{display:flex;align-items:center;gap:9px;margin:0 14px 8px;padding:8px 10px;border:1px solid var(--hair);border-radius:9px;background:var(--panel);font-size:12.5px;user-select:none;}
.auto input{accent-color:var(--signal);width:15px;height:15px;}
.auto em{display:block;color:var(--muted);font-style:normal;font-size:10.5px;font-family:'IBM Plex Mono',monospace;}
.roster{flex:1;overflow-y:auto;padding:2px 10px 10px;}
.pod-group{margin-bottom:11px;}
.pod-name{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);padding:4px 8px;}
.emp{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid transparent;background:transparent;color:var(--text);border-radius:9px;padding:8px 9px;margin-bottom:2px;transition:.12s;}
.emp:hover{background:var(--panel);}
.emp.on{background:var(--panel2);border-color:color-mix(in srgb,var(--a) 40%,transparent);}
.emp.picked{background:color-mix(in srgb,var(--a) 10%,var(--panel));border-color:color-mix(in srgb,var(--a) 55%,transparent);}
.led{width:8px;height:8px;border-radius:50%;flex:none;background:var(--a);box-shadow:0 0 8px 1px color-mix(in srgb,var(--a) 60%,transparent);}
.led.check{width:11px;height:11px;border-radius:3px;}
.emp-main{flex:1;min-width:0;}
.emp-name{display:block;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13.5px;}
.emp-role{display:block;font-size:10.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.badge{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);background:var(--panel);border:1px solid var(--hair);border-radius:999px;padding:1px 7px;}
.badge.hot{color:#1b1608;background:var(--a);border-color:var(--a);font-weight:700;}
.mini-busy{width:14px;height:14px;border-radius:50%;border:2px solid var(--hair);border-top-color:var(--a);animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.safety{border-top:1px solid var(--hair);padding:11px 14px 13px;}
.exp{width:100%;font-size:12px;color:var(--text);background:var(--panel);border:1px solid var(--hair);border-radius:8px;padding:9px 0;}
.exp:hover{border-color:var(--green);color:var(--green);}
.safety-note{font-size:10px;color:var(--muted);margin-top:7px;line-height:1.4;font-family:'IBM Plex Mono',monospace;}
.main{flex:1;display:flex;flex-direction:column;min-width:0;}
.note-bar{display:flex;align-items:center;gap:10px;background:rgba(137,192,138,.09);border-bottom:1px solid rgba(137,192,138,.25);color:var(--green);font-size:12px;padding:8px 18px;}
.note-bar span{flex:1;}
.note-bar button{background:none;border:none;color:var(--green);font-size:16px;line-height:1;}
.head{display:flex;align-items:center;gap:14px;padding:15px 22px;border-bottom:1px solid var(--hair);background:linear-gradient(180deg,var(--panel2),transparent);}
.head-name{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18.5px;}
.head-role{font-size:12px;color:var(--muted);}
.head-role span{color:var(--a);}
.head-owns{flex:1;font-size:11.5px;color:var(--muted);border-left:1px solid var(--hair);padding-left:15px;line-height:1.4;}
.head-owns span{display:block;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--a);margin-bottom:2px;}
.clear{flex:none;font-size:11px;color:var(--muted);background:transparent;border:1px solid var(--hair);border-radius:7px;padding:6px 11px;}
.clear:hover{color:var(--text);border-color:var(--muted);}
.chair-sel{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted);}
.chair-sel span{font-family:'IBM Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;font-size:9px;}
.chair-sel select{background:var(--panel);color:var(--text);border:1px solid var(--hair);border-radius:7px;padding:6px 9px;font-family:inherit;font-size:12px;outline:none;}
.scroll{flex:1;overflow-y:auto;padding:20px 22px 8px;}
.empty{max-width:540px;margin:6vh auto 0;text-align:center;color:var(--muted);}
.empty-name{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:20px;color:var(--text);}
.empty-role{font-size:12.5px;margin-top:2px;}
.empty p{font-size:13px;line-height:1.6;margin:14px 0 18px;}
.empty b{color:var(--text);}
.starter-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
.starter{font-size:12px;color:var(--text);background:var(--panel);border:1px solid var(--hair);border-radius:999px;padding:7px 13px;}
.starter:hover{border-color:var(--signal);color:var(--signal);}
.row{display:flex;margin-bottom:14px;}
.row.right{justify-content:flex-end;}.row.left{justify-content:flex-start;}
.bubble{max-width:76%;padding:12px 15px;border-radius:14px;font-size:14px;line-height:1.62;white-space:pre-wrap;word-wrap:break-word;}
.bubble.you{background:var(--signal);color:#1b1608;border-bottom-right-radius:5px;font-weight:500;}
.bubble.emp-b{background:var(--panel);border:1px solid var(--hair);border-left:3px solid var(--a);border-bottom-left-radius:5px;}
.bubble.emp-b.err{border-left-color:var(--gate);color:var(--muted);font-style:italic;}
.who{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--a);margin-bottom:5px;}
.relay-out{margin-top:11px;padding-top:10px;border-top:1px dashed color-mix(in srgb,var(--a) 35%,var(--hair));}
.ro-line{font-size:12px;}.ro-arrow{color:var(--a);margin-right:5px;}.ro-line b{color:var(--a);}
.ro-brief{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.5;}
.ro-btn{margin-top:9px;font-size:12px;font-weight:600;color:#1b1608;background:var(--a);border:none;border-radius:8px;padding:7px 13px;}
.tabcount{margin-left:5px;opacity:.75;font-size:10px;}
.msg-actions{margin-top:9px;display:flex;gap:7px;}
.mini-act{font-size:11px;color:var(--muted);background:transparent;border:1px solid var(--hair);border-radius:7px;padding:5px 10px;}
.mini-act:hover{color:var(--green);border-color:var(--green);}
.go-exp{color:var(--green)!important;border-color:rgba(137,192,138,.4)!important;}
.filter.green.on{background:var(--green);border-color:var(--green);}
.led-card{border:1px solid var(--hair);border-left:3px solid var(--a);border-radius:11px;background:var(--panel);padding:13px 15px;margin-bottom:10px;}
.led-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}
.led-n{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--green);font-weight:600;}
.led-title{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:15px;flex:1;}
.led-date{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);}
.led-meta{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:8px;}
.led-owner{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);}
.gate-pill{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--hair);border-radius:999px;padding:3px 9px;color:var(--muted);}
.gate-pill.ok{color:var(--green);border-color:rgba(137,192,138,.45);background:rgba(137,192,138,.08);}
.led-dec{font-size:13px;margin-top:9px;line-height:1.55;}
.led-dec b{color:var(--a);font-weight:600;}
.led-notes{font-size:12.5px;color:var(--muted);margin-top:6px;line-height:1.5;}
.modal-wrap{position:absolute;inset:0;background:rgba(9,10,15,.72);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px;z-index:50;}
.modal{width:100%;max-width:520px;max-height:90%;overflow-y:auto;background:var(--panel);border:1px solid color-mix(in srgb,var(--a) 35%,var(--hair));border-radius:15px;padding:20px 22px;}
.modal-h{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;}
.modal-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;}
.modal-sub{font-size:12px;color:var(--a);margin-top:2px;}
.modal-x{margin-left:auto;background:none;border:none;color:var(--muted);font-size:22px;line-height:1;}
.fld{display:block;margin-bottom:14px;}
.fld>span{display:block;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
.fld>span em{color:var(--a);font-style:normal;letter-spacing:.05em;}
.fld input,.fld textarea{width:100%;background:var(--panel2);color:var(--text);border:1px solid var(--hair);border-radius:9px;padding:10px 12px;font-family:inherit;font-size:13.5px;outline:none;resize:none;}
.fld input:focus,.fld textarea:focus{border-color:var(--a);}
.gate-row{display:flex;gap:8px;flex-wrap:wrap;}
.gate-check{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted);background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:9px 12px;cursor:pointer;}
.gate-check.on{color:var(--green);border-color:rgba(137,192,138,.45);}
.gate-check input{accent-color:var(--green);width:15px;height:15px;}
.gate-hint{font-size:11px;color:var(--muted);margin-top:7px;line-height:1.45;}
.ev-box{border:1px dashed var(--hair);border-radius:9px;padding:10px 12px;margin-bottom:16px;background:rgba(236,231,218,.02);}
.ev-h{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:5px;}
.ev-body{font-size:11.5px;color:var(--muted);line-height:1.5;max-height:90px;overflow:hidden;}
.modal-foot{display:flex;gap:9px;justify-content:flex-end;}
.mf{font-size:13px;border-radius:9px;padding:10px 18px;border:1px solid var(--hair);background:transparent;color:var(--muted);}
.mf.ghost:hover{color:var(--text);border-color:var(--muted);}
.mf.go{background:var(--green);color:#0d1a0e;border-color:var(--green);font-weight:600;}
.mf.go:disabled{opacity:.4;cursor:not-allowed;}
.main{position:relative;}
.ro-btn:hover{filter:brightness(1.08);}
.ro-btn.retry{background:var(--gate);color:#fff;margin-top:10px;}
.ro-btn.retry:disabled{opacity:.4;cursor:not-allowed;}
.err-who{color:var(--gate)!important;}
.take-body.err .ro-btn.retry{display:block;margin-top:8px;font-size:11.5px;padding:6px 11px;}
.relay-out.done .ro-line{color:var(--muted);}
.relay-in{display:flex;align-items:center;gap:9px;justify-content:center;margin:4px auto 14px;max-width:82%;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--cool);background:rgba(95,187,203,.06);border:1px dashed rgba(95,187,203,.35);border-radius:999px;padding:7px 14px;text-align:center;line-height:1.4;}
.relay-in.bc{color:var(--signal);background:rgba(232,176,75,.06);border-color:rgba(232,176,75,.35);}
.relay-in.bc .ri-dot{background:var(--signal);}
.ri-dot{width:6px;height:6px;border-radius:50%;background:var(--cool);flex:none;}
.typing,.pending{display:flex;gap:5px;align-items:center;}
.typing .dot,.pending .dot{width:7px;height:7px;border-radius:50%;background:var(--a,var(--muted));opacity:.5;animation:blink 1.2s infinite;}
.dot:nth-child(2){animation-delay:.2s;}.dot:nth-child(3){animation-delay:.4s;}
@keyframes blink{0%,60%,100%{opacity:.3;}30%{opacity:1;}}
.elsewhere{text-align:center;font-size:11.5px;color:var(--muted);font-style:italic;margin:2px 0 12px;}
.composer{display:flex;gap:10px;padding:13px 22px 17px;border-top:1px solid var(--hair);align-items:flex-end;}
.composer textarea{flex:1;resize:none;max-height:160px;background:var(--panel);color:var(--text);border:1px solid var(--hair);border-radius:12px;padding:12px 14px;font-family:inherit;font-size:14px;line-height:1.5;outline:none;}
.composer textarea:focus{border-color:var(--signal);}
.composer textarea:disabled{opacity:.5;}
.send{flex:none;background:var(--signal);color:#1b1608;font-weight:600;font-size:14px;border:none;border-radius:12px;padding:12px 20px;}
.send:disabled{opacity:.4;cursor:not-allowed;}
.send:not(:disabled):hover{filter:brightness(1.08);}
.filters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;}
.filter{font-size:12px;color:var(--muted);background:var(--panel);border:1px solid var(--hair);border-radius:999px;padding:6px 13px;}
.filter.on{color:#1b1608;background:var(--cool);border-color:var(--cool);font-weight:600;}
.inbox-card{border:1px solid var(--hair);border-left:3px solid var(--a);border-radius:11px;background:var(--panel);padding:13px 15px;margin-bottom:10px;}
.inbox-card.unread{background:color-mix(in srgb,var(--a) 7%,var(--panel));border-color:color-mix(in srgb,var(--a) 30%,var(--hair));}
.ic-head{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:7px;}
.ic-led{width:7px;height:7px;border-radius:50%;background:var(--a);flex:none;}
.ic-name{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;}
.ic-role{font-size:10.5px;color:var(--muted);}
.ic-src{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--hair);border-radius:999px;padding:2px 7px;color:var(--muted);}
.src-war,.src-synthesis{color:var(--signal);border-color:rgba(232,176,75,.35);}
.src-broadcast{color:var(--cool);border-color:rgba(95,187,203,.35);}
.src-relay{color:var(--gate);border-color:rgba(200,106,158,.35);}
.ic-time{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);}
.ic-body{font-size:13.5px;line-height:1.6;white-space:pre-wrap;}
.ic-foot{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;}
.ic-btn{font-size:11.5px;border-radius:7px;padding:6px 11px;border:1px solid var(--hair);background:transparent;color:var(--muted);}
.ic-btn.ghost:hover{color:var(--text);border-color:var(--muted);}
.ic-btn.go{background:var(--a);color:#1b1608;border-color:var(--a);font-weight:600;}
.ic-btn.go:disabled{opacity:.4;cursor:not-allowed;}
.ic-done{font-size:11px;color:var(--muted);font-family:'IBM Plex Mono',monospace;}
.war-parts{margin-bottom:18px;}
.wp-h{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:9px;}
.wp-chips{display:flex;flex-wrap:wrap;gap:7px;}
.wp-chip{font-size:12px;color:var(--muted);background:transparent;border:1px solid var(--hair);border-radius:999px;padding:6px 12px;opacity:.55;}
.wp-chip.in{color:var(--text);opacity:1;border-color:color-mix(in srgb,var(--a) 55%,transparent);}
.wp-chip.in::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--a);margin-right:7px;vertical-align:middle;box-shadow:0 0 7px 1px color-mix(in srgb,var(--a) 60%,transparent);}
.takes{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:11px;margin-bottom:18px;}
.take{border:1px solid var(--hair);border-left:3px solid var(--a);border-radius:11px;background:var(--panel);padding:13px 14px;}
.take-h{display:flex;align-items:baseline;gap:8px;margin-bottom:8px;}
.take-name{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;}
.take-role{font-size:10.5px;color:var(--muted);}
.take-body{font-size:13px;line-height:1.55;white-space:pre-wrap;}
.take-body.err{color:var(--gate);font-style:italic;font-size:12px;}
.synth{border:1px solid color-mix(in srgb,var(--a) 40%,var(--hair));border-radius:13px;background:linear-gradient(180deg,color-mix(in srgb,var(--a) 8%,var(--panel)),var(--panel));padding:16px 18px;margin-bottom:14px;}
.synth-h{font-size:11.5px;color:var(--muted);margin-bottom:9px;}
.synth-tag{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--a);font-weight:600;}
.synth-body{font-size:14px;line-height:1.65;white-space:pre-wrap;}
.synth-body.err{color:var(--gate);font-style:italic;}
.war-empty{margin-top:4vh;}
@media (prefers-reduced-motion:reduce){.typing .dot,.pending .dot,.mini-busy{animation:none;}}
@media (max-width:720px){
  .gt-root{flex-direction:column;height:auto;}
  .side{width:100%;} .roster{max-height:190px;} .main{min-height:70vh;} .head-owns{display:none;}
}
.loading{margin:auto;color:var(--muted);font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;}
.proj{margin:0 14px 10px;padding:9px 10px;border:1px solid var(--hair);border-radius:9px;background:var(--panel);}
.proj-h{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
.proj-row{display:flex;gap:5px;}
.proj-row select{flex:1;min-width:0;background:var(--panel2);color:var(--text);border:1px solid var(--hair);border-radius:7px;padding:6px 7px;font-family:inherit;font-size:12px;outline:none;}
.proj-btn{flex:none;font-size:11px;color:var(--muted);background:transparent;border:1px solid var(--hair);border-radius:7px;padding:5px 8px;}
.proj-btn:hover{color:var(--signal);border-color:var(--signal);}
.proj-btn:disabled,.exp:disabled{opacity:.4;cursor:not-allowed;}
.viewtabs{flex-wrap:wrap;}
.viewtabs button{flex:1 0 30%;}
.safety-row{display:flex;gap:6px;}
.exp.sync{margin-top:6px;}
.nudge{font-size:11px;color:var(--signal);background:rgba(232,176,75,.07);border:1px solid rgba(232,176,75,.3);border-radius:8px;padding:7px 9px;margin-bottom:8px;line-height:1.4;}
.gate-pill.fix,.ic-src.fix{color:#9B8CE0;border-color:rgba(155,140,224,.45);}
.hist{margin-top:9px;font-size:12px;color:var(--muted);}
.hist summary{cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;}
.hist-row{margin-top:6px;line-height:1.5;white-space:pre-wrap;}
.hist-row b{color:var(--text);font-weight:600;margin-right:6px;}
.rec-tools{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:10px;}
.rec-search{flex:1;min-width:180px;background:var(--panel);color:var(--text);border:1px solid var(--hair);border-radius:999px;padding:8px 14px;font-family:inherit;font-size:13px;outline:none;}
.rec-search:focus{border-color:#9B8CE0;}
.rec-tools select{background:var(--panel);color:var(--text);border:1px solid var(--hair);border-radius:999px;padding:7px 10px;font-family:inherit;font-size:12px;outline:none;}
.rec-all{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);}
.rec-count{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;}
.rec-card.op{background:rgba(236,231,218,.03);}
.src-signoff{color:var(--green);border-color:rgba(137,192,138,.4);}
.src-operator{color:var(--text);}
.set-card{border:1px solid var(--hair);border-radius:12px;background:var(--panel);padding:15px 17px;margin-bottom:14px;max-width:720px;}
.set-h{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:15px;margin-bottom:6px;}
.set-h em{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);margin-left:6px;}
.set-p{font-size:12.5px;color:var(--muted);line-height:1.55;margin:0 0 12px;}
.set-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.set-row{display:flex;gap:9px;align-items:center;flex-wrap:wrap;}
.set-meta{font-size:11px;color:var(--muted);font-family:'IBM Plex Mono',monospace;}
.mf:disabled{opacity:.4;cursor:not-allowed;}
`;
