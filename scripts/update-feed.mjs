#!/usr/bin/env node
// Hourly GTA 6 feed collector. Pulls public RSS/Atom feeds and the Wikipedia
// lead, keeps only headlines + short excerpts with a link back to the original
// source, and writes content/feed/*.json. Run by .github/workflows/update-feed.yml.
//
// Usage: node scripts/update-feed.mjs
// No dependencies: Node 18+ built-ins only.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FEED_DIR = path.join(ROOT, "content", "feed");
const ITEMS_FILE = path.join(FEED_DIR, "items.json");
const WIKI_FILE = path.join(FEED_DIR, "wikipedia.json");

const MAX_ITEMS = 300;
const TIMEOUT_MS = 20_000;
const USER_AGENT = "GrandTheftWikiFeedBot/1.0 (+https://github.com/VAIIYA/6TH-STREET)";

// Only keep entries that are actually about GTA 6.
const ABOUT_GTA6 = /\bGTA ?(?:6|VI)\b|Grand Theft Auto VI|GTA6/i;
// Heuristic label for unconfirmed reporting. Shown as "Rumor" on the site.
const RUMOR_HINT = /\b(rumou?rs?|leaks?|leaked|insider|reportedly|allegedly|sources say|speculat\w*|tipped)\b/i;

const gnews = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

const SOURCES = [
  {
    name: "Google News",
    kind: "news",
    url: gnews('("GTA 6" OR "GTA VI" OR "Grand Theft Auto VI") when:3d'),
  },
  {
    name: "Google News",
    kind: "rumor",
    url: gnews('(GTA 6 OR "GTA VI") (rumor OR leak OR insider OR reportedly) when:3d'),
  },
  {
    name: "Rockstar Games (YouTube)",
    kind: "video",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC6VcWc1rAoWdBCM0JxrRQ3A",
  },
  {
    name: "Rockstar Games UK & Ireland (YouTube)",
    kind: "video",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCULwHhkI31JHAKe57LZdzcA",
  },
  {
    name: "r/GTA6",
    kind: "community",
    url: "https://www.reddit.com/r/GTA6/.rss",
  },
];

const WIKI_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/Grand_Theft_Auto_VI";

// ---------- helpers ----------

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

// Feeds often carry HTML escaped inside XML (Atom <content>, Google <description>).
// Decode, strip tags, then decode once more for double-escaped text.
function cleanText(raw) {
  const unwrapped = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  const decoded = decodeEntities(unwrapped);
  return decodeEntities(decoded.replace(/<[^>]+>/g, " "))
    .replace(/submitted by \/u\/\S+\s*\[link\]\s*\[comments\]/g, "") // Reddit boilerplate
    .replace(/This post contains content not supported on old Reddit.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? m[1] : undefined;
}

function getText(block, name) {
  const raw = getTag(block, name);
  return raw === undefined ? undefined : cleanText(raw);
}

function getLink(block) {
  // Atom: <link rel="alternate" href="..."/>  |  RSS: <link>...</link>
  const href = block.match(/<link\b[^>]*\bhref="([^"]+)"[^>]*\/?>/);
  if (href) return decodeEntities(href[1]);
  return getText(block, "link");
}

function excerpt(text, max = 220) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sha = (s) => createHash("sha1").update(s).digest("hex").slice(0, 12);

function parseFeed(xml, source) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/g) ?? [];
  const out = [];

  for (const block of blocks) {
    const url = getLink(block);
    let title = getText(block, "title");
    const publishedRaw = getText(block, "pubDate") ?? getText(block, "published") ?? getText(block, "updated");
    if (!url || !title || !publishedRaw) continue;

    const publishedAt = new Date(publishedRaw);
    if (Number.isNaN(publishedAt.getTime())) continue;

    // Google News appends " - Publisher" to titles and provides the publisher in <source>.
    const publisher = getText(block, "source");
    if (publisher) title = title.replace(new RegExp(`\\s+-\\s+${publisher.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");

    if (!ABOUT_GTA6.test(title)) continue;

    const videoId = getText(block, "yt:videoId");
    const description = getText(block, "description") ?? getText(block, "media:description") ?? getText(block, "summary") ?? getText(block, "content");
    const summary =
      description && !norm(description).startsWith(norm(title).slice(0, 40)) && description.length > 40
        ? excerpt(description)
        : undefined;

    const kind = source.kind === "video" ? "video" : RUMOR_HINT.test(title) ? "rumor" : source.kind;

    out.push({
      id: sha(url),
      title,
      url,
      source: publisher ?? source.name,
      kind,
      publishedAt: publishedAt.toISOString(),
      ...(summary && { summary }),
      ...(videoId && { videoId, thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }),
    });
  }
  return out;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

// ---------- main ----------

async function main() {
  await mkdir(FEED_DIR, { recursive: true });

  // Re-clean summaries stored by earlier runs so old HTML leftovers disappear too.
  const previousItems = (await readJson(ITEMS_FILE, [])).map((i) => {
    if (!i.summary) return i;
    const summary = cleanText(i.summary);
    const { summary: _drop, ...rest } = i;
    return summary.length > 40 ? { ...rest, summary: excerpt(summary) } : rest;
  });
  const previousById = new Map(previousItems.map((i) => [i.id, i]));

  const fetched = [];
  let okSources = 0;
  for (const source of SOURCES) {
    try {
      const xml = await fetchText(source.url);
      const items = parseFeed(xml, source);
      fetched.push(...items);
      okSources++;
      console.log(`ok   ${source.name} (${source.kind}): ${items.length} GTA 6 items`);
    } catch (err) {
      console.warn(`fail ${source.name} (${source.kind}): ${err.message}`);
    }
  }

  // Wikipedia lead. Stored without a fetch timestamp so unchanged content does not cause a commit.
  let wiki = null;
  try {
    const res = await fetch(WIKI_URL, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    wiki = {
      title: data.title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page ?? "https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI",
      updated: data.timestamp,
      ...(data.thumbnail?.source && { thumbnail: data.thumbnail.source }),
    };
    console.log("ok   Wikipedia lead");
  } catch (err) {
    console.warn(`fail Wikipedia lead: ${err.message}`);
  }

  if (okSources === 0 && !wiki) {
    console.error("All sources failed; keeping the previous feed.");
    process.exit(1);
  }

  // Merge: keep first-seen timestamps, drop duplicate stories (same headline from several outlets).
  const merged = new Map(previousById);
  for (const item of fetched) {
    const prev = previousById.get(item.id);
    merged.set(item.id, { ...item, firstSeen: prev?.firstSeen ?? new Date().toISOString() });
  }

  const seenTitles = new Set();
  const items = [...merged.values()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((i) => {
      const key = norm(i.title);
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    })
    .slice(0, MAX_ITEMS);

  const itemsJson = JSON.stringify(items, null, 2) + "\n";
  const prevItemsRaw = await readFile(ITEMS_FILE, "utf8").catch(() => "");
  if (itemsJson !== prevItemsRaw) {
    await writeFile(ITEMS_FILE, itemsJson);
    console.log(`wrote ${path.relative(ROOT, ITEMS_FILE)} (${items.length} items)`);
  } else {
    console.log("items unchanged");
  }

  if (wiki) {
    const wikiJson = JSON.stringify(wiki, null, 2) + "\n";
    const prevWiki = await readFile(WIKI_FILE, "utf8").catch(() => "");
    if (wikiJson !== prevWiki) {
      await writeFile(WIKI_FILE, wikiJson);
      console.log(`wrote ${path.relative(ROOT, WIKI_FILE)}`);
    } else {
      console.log("wikipedia unchanged");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
