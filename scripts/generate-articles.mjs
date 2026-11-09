#!/usr/bin/env node
// Turns the hourly feed into original 6th Street news articles (content/news/*.mdx).
//
// For each story that several outlets cover, Claude writes a short, fully
// paraphrased article from the headlines and snippets in content/feed/items.json.
// Every article lists its sources, labels rumors as unconfirmed, and may only use
// facts that are in the supplied material. The model can also decline (publish=false).
//
// Usage:  node scripts/generate-articles.mjs [--dry-run]
// Needs:  ANTHROPIC_API_KEY (without it the script exits 0 and does nothing).
// Tuning (env): ANTHROPIC_MODEL, MAX_NEW_PER_RUN (3), MAX_PER_DAY (12),
//               MIN_SOURCES (2), LOOKBACK_HOURS (72).

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import matter from "gray-matter";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FEED_DIR = path.join(ROOT, "content", "feed");
const NEWS_DIR = path.join(ROOT, "content", "news");
const ITEMS_FILE = path.join(FEED_DIR, "items.json");
const WIKI_FILE = path.join(FEED_DIR, "wikipedia.json");
const STATE_FILE = path.join(FEED_DIR, "articles.json");
const WIKI_CATEGORIES = ["characters", "locations", "vehicles", "gameplay", "news"];

const int = (name, fallback) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const CONFIG = {
  model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
  maxNewPerRun: int("MAX_NEW_PER_RUN", 3),
  maxPerDay: int("MAX_PER_DAY", 12),
  minSources: int("MIN_SOURCES", 2),
  lookbackHours: int("LOOKBACK_HOURS", 72),
  minWords: 150,
};

// ---------- clustering ----------

const STOP = new Set(
  ("the a an of to for and in on at is are was were be with by from as it its this that new game games " +
    "grand theft auto gta vi 6 rockstar says say report reports after about more all")
    .split(" "),
);

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)));

function similar(a, b) {
  const shared = [...a].filter((t) => b.has(t)).length;
  const union = a.size + b.size - shared;
  return union > 0 && (shared >= 3 || shared / union >= 0.34);
}

/** Group items about the same event. Items must be sorted newest first. */
export function clusterItems(items) {
  const clusters = [];
  for (const item of items) {
    const t = tokens(item.title);
    const home = clusters.find((c) => c.members.some((m) => similar(m.tokens, t)));
    if (home) home.members.push({ item, tokens: t });
    else clusters.push({ members: [{ item, tokens: t }] });
  }
  return clusters.map((c) => {
    const list = c.members.map((m) => m.item);
    const publishers = new Set(list.map((i) => i.source));
    return {
      items: list,
      publishers: publishers.size,
      newest: list[0].publishedAt,
      kind: list.every((i) => i.kind === "rumor") ? "rumor" : list.some((i) => i.kind === "news") ? "news" : "rumor",
    };
  });
}

// ---------- article file ----------

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70)
    .replace(/-$/g, "");
}

/** The body is rendered as MDX: neutralise anything MDX would try to execute or parse as JSX. */
export function sanitizeBody(raw, allowedLinks = new Set()) {
  return raw
    .replace(/\r/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>\n]*>/g, "") // raw HTML / JSX
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => (allowedLinks.has(href) ? m : label)) // external links come from `sources`
    .replace(/^#\s+/gm, "## ") // the page already renders the title as h1
    .replace(/^#{4,}\s+/gm, "### ")
    .replace(/[{}]/g, (c) => `\\${c}`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;

export function buildArticleFile({ draft, cluster, now = new Date(), allowedRelated = new Set() }) {
  const body = sanitizeBody(draft.body, allowedRelated);
  const sources = cluster.items.slice(0, 6).map((i) => ({ label: `${i.source}: ${i.title}`, url: i.url }));
  const related = [...new Set(draft.related)].filter((h) => allowedRelated.has(h)).slice(0, 3);
  const data = {
    title: draft.title.trim().slice(0, 90),
    summary: draft.description.trim().slice(0, 170),
    updated: now.toISOString().slice(0, 10),
    published: now.toISOString(),
    auto: true,
    kind: cluster.kind,
    featured: false,
    related,
    sources,
  };
  return { data, body, file: matter.stringify(`\n${body}\n`, data) };
}

// ---------- model call ----------

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    publish: { type: "boolean" },
    reason: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    body: { type: "string" },
    related: { type: "array", items: { type: "string" } },
  },
  required: ["publish", "reason", "title", "description", "body", "related"],
  additionalProperties: false,
};

const SYSTEM = `You are the news editor of 6th Street, an unofficial fan site about Grand Theft Auto VI. You write short, original news articles from source material that the user supplies.

Hard rules:
- Use only facts that are stated in the supplied material. Never add details, numbers, dates, names or quotes that are not in it, and never speculate.
- Paraphrase completely. Do not reuse the sentences or distinctive phrasing of the source headlines. Names, titles and technical terms may be repeated.
- Attribute claims to the outlet by name, for example "according to IGN". When outlets disagree, say so.
- If the story is a rumor, a leak or a single outlet's claim, say plainly that it is unconfirmed and that Rockstar Games has not confirmed it. Never present unconfirmed information as fact.
- Do not use relative time words such as "today" or "yesterday". Use the absolute dates that are in the material.
- If the material is not clearly about Grand Theft Auto VI, is contradictory, or is too thin to support a genuinely informative article, set publish to false and explain briefly in reason. Leave the other fields empty strings and an empty array in that case. Declining is better than padding.

Output rules (when publish is true):
- title: at most 60 characters, plain and specific, no clickbait, no outlet names.
- description: at most 155 characters, one sentence that stands on its own for search results.
- body: Markdown, 200 to 380 words, two or three "##" sections with descriptive headings, no top-level "#" heading, no HTML, no curly braces, no links, no emoji. Open with the news itself. Close with what is still unconfirmed or unknown, only if the material says so.
- related: up to three hrefs chosen only from the supplied list of existing wiki pages that are directly relevant; an empty array if none fit.`;

function buildPrompt({ cluster, wiki, pages, today }) {
  const material = cluster.items.slice(0, 8).map((i) => ({
    outlet: i.source,
    published: i.publishedAt.slice(0, 10),
    headline: i.title,
    ...(i.summary && { snippet: i.summary }),
  }));
  return [
    `Today is ${today}. Story type: ${cluster.kind}. Distinct outlets: ${cluster.publishers}.`,
    "",
    "Source material (headlines and snippets only):",
    JSON.stringify(material, null, 2),
    "",
    wiki ? `Background (Wikipedia lead, may be used for context only):\n${wiki.extract}\n` : "",
    "Existing wiki pages you may list in related:",
    JSON.stringify(pages.map((p) => ({ href: p.href, title: p.title })), null, 2),
  ].join("\n");
}

async function draftArticle(client, args) {
  const response = await client.beta.messages.create({
    model: CONFIG.model,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort: "low", format: { type: "json_schema", schema: DRAFT_SCHEMA } },
    messages: [{ role: "user", content: buildPrompt(args) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`model refused (${response.stop_details?.category ?? "unknown"})`);
  }
  if (response.stop_reason === "max_tokens") throw new Error("response hit max_tokens");
  const block = response.content.find((b) => b.type === "text");
  if (!block) throw new Error("no text block in response");
  return JSON.parse(block.text);
}

// ---------- io helpers ----------

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function listWikiPages() {
  const pages = [];
  for (const cat of WIKI_CATEGORIES) {
    const dir = path.join(ROOT, "content", cat);
    const files = await readdir(dir).catch(() => []);
    for (const f of files.filter((n) => n.endsWith(".mdx"))) {
      const { data } = matter(await readFile(path.join(dir, f), "utf8"));
      if (data.auto) continue; // link to curated pages only
      pages.push({ href: `/${cat}/${f.replace(/\.mdx$/, "")}`, title: String(data.title ?? f) });
    }
  }
  return pages;
}

async function uniqueSlug(base) {
  const taken = new Set((await readdir(NEWS_DIR).catch(() => [])).map((f) => f.replace(/\.mdx$/, "")));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

async function articlesPublishedToday(today) {
  let count = 0;
  for (const f of (await readdir(NEWS_DIR).catch(() => [])).filter((n) => n.endsWith(".mdx"))) {
    const { data } = matter(await readFile(path.join(NEWS_DIR, f), "utf8"));
    if (data.auto && String(data.published ?? "").startsWith(today)) count++;
  }
  return count;
}

// ---------- main ----------

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.ANTHROPIC_API_KEY && !dryRun) {
    console.log("ANTHROPIC_API_KEY is not set; skipping article generation.");
    return;
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cutoff = now.getTime() - CONFIG.lookbackHours * 3_600_000;

  const state = await readJson(STATE_FILE, { covered: {}, skipped: {} });
  const handled = new Set([...Object.keys(state.covered), ...Object.keys(state.skipped)]);

  const items = (await readJson(ITEMS_FILE, []))
    .filter((i) => (i.kind === "news" || i.kind === "rumor") && new Date(i.publishedAt).getTime() >= cutoff)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  // A story is new when none of its items has been written up or rejected before.
  const clusters = clusterItems(items)
    .filter((c) => !c.items.some((i) => handled.has(i.id)))
    .filter((c) => c.publishers >= CONFIG.minSources)
    .filter((c) => c.items.some((i) => i.summary)) // never write from headlines alone
    .sort((a, b) => b.publishers - a.publishers || b.newest.localeCompare(a.newest));

  const budget = Math.min(CONFIG.maxNewPerRun, Math.max(0, CONFIG.maxPerDay - (await articlesPublishedToday(today))));
  console.log(`${clusters.length} eligible stories, budget ${budget} for this run`);
  if (budget === 0 || clusters.length === 0) return;

  const [pages, wiki] = await Promise.all([listWikiPages(), readJson(WIKI_FILE, null)]);
  const allowedRelated = new Set(pages.map((p) => p.href));
  const client = dryRun ? null : new Anthropic();
  await mkdir(NEWS_DIR, { recursive: true });

  let written = 0;
  for (const cluster of clusters) {
    if (written >= budget) break;
    const ids = cluster.items.map((i) => i.id);
    const label = cluster.items[0].title;

    if (dryRun) {
      console.log(`\n--- ${label} (${cluster.publishers} outlets, ${cluster.kind})\n${buildPrompt({ cluster, wiki, pages, today })}`);
      written++;
      continue;
    }

    try {
      const draft = await draftArticle(client, { cluster, wiki, pages, today });
      const reject = (why) => {
        console.log(`skip  ${label}: ${why}`);
        for (const id of ids) state.skipped[id] = today;
      };
      if (!draft.publish) {
        reject(draft.reason || "model declined");
        continue;
      }
      const built = buildArticleFile({ draft, cluster, now, allowedRelated });
      if (wordCount(built.body) < CONFIG.minWords) {
        reject(`too short (${wordCount(built.body)} words)`);
        continue;
      }
      if (built.data.title.length < 15) {
        reject("title too short");
        continue;
      }

      const slug = await uniqueSlug(slugify(built.data.title));
      await writeFile(path.join(NEWS_DIR, `${slug}.mdx`), built.file);
      for (const id of ids) state.covered[id] = slug;
      written++;
      console.log(`wrote content/news/${slug}.mdx (${wordCount(built.body)} words)`);
    } catch (err) {
      // Transient API errors are not recorded, so the story is retried next hour.
      console.warn(`fail  ${label}: ${err.message}`);
    }
  }

  if (dryRun) return;

  // Keep the state file small: forget skip records older than the lookback window.
  const trim = (obj) => Object.fromEntries(Object.entries(obj).slice(-600));
  state.covered = trim(state.covered);
  state.skipped = trim(state.skipped);
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
  console.log(`generated ${written} article(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
