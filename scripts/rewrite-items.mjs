#!/usr/bin/env node
// Gives every feed item its own page content: an original rewrite (headline + short text) and
// the article's lead image. Output: content/feed/rewrites.json, keyed by feed item id.
//
// The rewrite may only use facts from the headline and snippet in items.json, is fully
// paraphrased, attributes claims to the outlet and labels rumors as unconfirmed.
// The image is the publisher's own og:image URL, embedded (hotlinked), not copied.
//
// Usage:  node scripts/rewrite-items.mjs [--dry-run]
// Needs:  ANTHROPIC_API_KEY for rewrites (images are still collected without it).
// Tuning (env): ANTHROPIC_MODEL, MAX_REWRITES_PER_RUN (40), BATCH_SIZE (8).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_FILE = path.join(ROOT, "content", "feed", "items.json");
const OUT_FILE = path.join(ROOT, "content", "feed", "rewrites.json");

const int = (name, fallback) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const MAX_PER_RUN = int("MAX_REWRITES_PER_RUN", 40);
const BATCH = int("BATCH_SIZE", 8);
const USER_AGENT = "FlamingoSixFeedBot/1.0 (+https://github.com/VAIIYA/FLAMINGO-SIX)";

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
};

// ---------- images ----------

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&quot;/g, '"');

async function findImage(url) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("google.com")) return undefined; // redirect wrapper, no page to read
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return undefined;
    const html = (await res.text()).slice(0, 300_000);
    const tag = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i)?.[0];
    const content = tag?.match(/content=["']([^"']+)["']/i)?.[1];
    if (!content) return undefined;
    const img = new URL(decode(content), res.url);
    return img.protocol === "https:" ? img.href : undefined;
  } catch {
    return undefined;
  }
}

// ---------- rewrites ----------

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, title: { type: "string" }, body: { type: "string" } },
        required: ["id", "title", "body"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

const SYSTEM = `You are the news editor of Flamingo Six, an unofficial fan site about Grand Theft Auto VI. For each supplied item you write a short, original rewrite for its own page.

Hard rules:
- Use only facts stated in that item's headline and snippet. Never add details, numbers, dates, names or quotes, and never speculate.
- Paraphrase completely. Do not reuse the sentences or distinctive phrasing of the headline or snippet; names and technical terms may be repeated. The result must read as clearly different text from the source.
- Attribute the claim to the outlet by name ("according to IGN", "Insider Gaming reports").
- If the item is a rumor or leak, say plainly it is unconfirmed and that Rockstar Games has not confirmed it.
- No relative time words (today, yesterday). No emoji, HTML, markdown or links.
- title: 40 to 70 characters, specific, no clickbait, no outlet name.
- body: 45 to 90 words, two or three plain sentences, in English. If the snippet is too thin to say anything beyond the headline, keep it short rather than padding.
- Return one result per supplied id, same ids.`;

async function rewriteBatch(client, batch) {
  const material = batch.map((i) => ({
    id: i.id,
    outlet: i.source,
    type: i.kind,
    published: i.publishedAt.slice(0, 10),
    headline: i.title,
    snippet: i.summary,
  }));
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 6000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: JSON.stringify(material, null, 2) }],
  });
  if (response.stop_reason === "refusal") throw new Error("model refused");
  if (response.stop_reason === "max_tokens") throw new Error("response hit max_tokens");
  const block = response.content.find((b) => b.type === "text");
  if (!block) throw new Error("no text block");
  return JSON.parse(block.text).items;
}

const clean = (s) =>
  s
    .replace(/<[^>\n]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const wc = (s) => s.split(/\s+/).filter(Boolean).length;

// ---------- main ----------

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const items = (await readJson(ITEMS_FILE, [])).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const out = await readJson(OUT_FILE, {});
  const ids = new Set(items.map((i) => i.id));

  // Images: items with a snippet or video, newest first, a handful per run so the job stays fast.
  const needImage = items.filter(
    (i) => (i.summary || i.kind === "video") && !i.thumbnail && !(out[i.id] && "image" in out[i.id]) && !(i.id in out && out[i.id].imageChecked),
  );
  let imageBudget = 40;
  await Promise.all(
    needImage.slice(0, imageBudget).map(async (i) => {
      const image = await findImage(i.url);
      out[i.id] = { ...out[i.id], imageChecked: true, ...(image && { image }) };
    }),
  );

  // Rewrites.
  const todo = items.filter((i) => i.summary && i.kind !== "video" && !out[i.id]?.title).slice(0, MAX_PER_RUN);
  console.log(`${todo.length} items to rewrite, ${needImage.length} items without image check`);

  if (!process.env.ANTHROPIC_API_KEY || dryRun) {
    if (!dryRun) console.log("ANTHROPIC_API_KEY is not set; skipping rewrites.");
  } else {
    const client = new Anthropic();
    for (let n = 0; n < todo.length; n += BATCH) {
      const batch = todo.slice(n, n + BATCH);
      try {
        const results = await rewriteBatch(client, batch);
        for (const r of results) {
          if (!batch.some((b) => b.id === r.id)) continue;
          const title = clean(r.title).slice(0, 90);
          const body = clean(r.body);
          if (title.length < 15 || wc(body) < 25) continue; // too thin, retried next hour
          out[r.id] = { ...out[r.id], title, body };
        }
      } catch (err) {
        console.warn(`fail batch ${n / BATCH + 1}: ${err.message}`);
      }
    }
  }

  // Forget entries for items that left the feed.
  for (const id of Object.keys(out)) if (!ids.has(id)) delete out[id];

  const json = JSON.stringify(out, null, 2) + "\n";
  if (!dryRun && json !== (await readFile(OUT_FILE, "utf8").catch(() => ""))) {
    await writeFile(OUT_FILE, json);
    console.log(`wrote content/feed/rewrites.json (${Object.keys(out).length} entries)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
