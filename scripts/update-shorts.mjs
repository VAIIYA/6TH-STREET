#!/usr/bin/env node
// Finds new GTA 6 YouTube Shorts and TikTok videos and adds them to content/feed/items.json
// as kind "video" with platform "short" | "tiktok". Each gets its own page with the official
// embedded player. Run hourly after scripts/update-feed.mjs.
//
// Discovery: YouTube search pages (Shorts only) and Bing Videos (TikTok URLs). Metadata comes
// from the platforms' public oEmbed endpoints. Every source is best-effort: a failing source is
// skipped and never blocks the run.
//
// Usage: node scripts/update-shorts.mjs      Needs Node 18+, no dependencies.

import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS_FILE = path.join(ROOT, "content", "feed", "items.json");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const MAX_NEW_PER_PLATFORM = 15;
const ABOUT_GTA6 = /\bGTA ?(?:6|VI)\b|Grand Theft Auto (?:VI|6)\b|GTA6/i;

const YT_QUERIES = ["GTA 6 shorts", "GTA VI shorts", "GTA 6 trailer shorts", "GTA 6 leak shorts", "GTA 6 gameplay shorts"];
const TT_QUERIES = ["GTA 6 tiktok", "GTA VI tiktok", "GTA 6 leak tiktok", "gta6 tiktok video"];

const sha = (s) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const get = (url, opts = {}) =>
  fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(15_000),
    ...opts,
  });
const clean = (s) => s.replace(/\s+/g, " ").trim();

async function oembed(endpoint, url) {
  try {
    const res = await get(`${endpoint}?url=${encodeURIComponent(url)}&format=json`);
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  }
}

// ---------- YouTube Shorts ----------

async function youtubeIds() {
  const ids = new Set();
  for (const q of YT_QUERIES) {
    try {
      // sp=CAI%3D sorts by upload date.
      const res = await get(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAI%253D`);
      if (!res.ok) continue;
      const html = await res.text();
      for (const m of html.matchAll(/"reelWatchEndpoint":\{"videoId":"([A-Za-z0-9_-]{11})"/g)) ids.add(m[1]);
    } catch (err) {
      console.warn(`fail YouTube search "${q}": ${err.message}`);
    }
  }
  return [...ids];
}

async function youtubeItem(videoId, now) {
  const url = `https://www.youtube.com/shorts/${videoId}`;
  // The ids come from search results marked as Shorts (reelWatchEndpoint), so no extra check is needed.
  const meta = await oembed("https://www.youtube.com/oembed", url);
  if (!meta?.title || !ABOUT_GTA6.test(meta.title)) return undefined;
  const html = await get(url).then((r) => r.text()).catch(() => "");
  const date = html.match(/"(?:publishDate|uploadDate)":"([^"]+)"/)?.[1];
  const published = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : now;
  return {
    id: sha(url),
    title: tidyTitle(clean(meta.title).replace(/\s*#shorts\b/gi, "")) || clean(meta.title),
    url,
    source: meta.author_name ? clean(meta.author_name) : "YouTube",
    kind: "video",
    platform: "short",
    publishedAt: published,
    videoId,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

// ---------- TikTok ----------

const unescapeHtml = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// TikTok's own oEmbed no longer returns titles, so caption and URL both come from Bing's result card.
async function tiktokCandidates() {
  const found = new Map();
  for (const q of TT_QUERIES) {
    try {
      const res = await get(`https://www.bing.com/videos/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) continue;
      const html = await res.text();
      for (const m of html.matchAll(/tiktok\.com\/@([A-Za-z0-9_.]+)\/video\/(\d{15,25})/g)) {
        const url = `https://www.tiktok.com/@${m[1]}/video/${m[2]}`;
        if (found.has(url)) continue;
        const near = html.slice(Math.max(0, m.index - 1500), m.index + 2500);
        const title = near.match(/(?:title|aria-label)="([^"]{15,200})"/)?.[1];
        if (title) found.set(url, { url, handle: m[1], title: clean(unescapeHtml(title)) });
      }
    } catch (err) {
      console.warn(`fail Bing Videos "${q}": ${err.message}`);
    }
  }
  return [...found.values()];
}

// Bing appends " | <query> from TikTok · Duration ..." to the caption; drop it and trailing hashtags.
const tidyTitle = (t) =>
  t
    .replace(/\s*(?:\|[^|]*)?\bfrom TikTok\b.*$/i, "")
    .replace(/\s*(#[\p{L}\p{N}_]+\s*)+$/u, "")
    .replace(/\s+/g, " ")
    .trim();

function tiktokItem({ url, handle, title: rawTitle }, now) {
  const title = tidyTitle(rawTitle);
  if (!ABOUT_GTA6.test(rawTitle) || title.length < 8) return undefined;
  const videoId = url.match(/video\/(\d+)/)[1];
  // TikTok ids embed the upload time in their upper bits (seconds since epoch).
  const ts = Number(BigInt(videoId) >> 32n) * 1000;
  const published = ts > 1.5e12 && ts < Date.parse(now) + 864e5 ? new Date(ts).toISOString() : now;
  return {
    id: sha(url),
    title,
    url,
    source: `@${handle} (TikTok)`,
    kind: "video",
    platform: "tiktok",
    publishedAt: published,
    videoId, // TikTok video id, used to build the embed player URL
    // No thumbnail: TikTok's are signed and expire, so cards use the site placeholder.
  };
}

// ---------- main ----------

async function main() {
  const now = new Date().toISOString();
  const items = JSON.parse(await readFile(ITEMS_FILE, "utf8").catch(() => "[]"));
  const known = new Set(items.map((i) => i.id));
  const knownVideoIds = new Set(items.filter((i) => i.videoId).map((i) => i.videoId));
  const added = [];

  const ytIds = (await youtubeIds()).filter((id) => !knownVideoIds.has(id) && !known.has(sha(`https://www.youtube.com/shorts/${id}`)));
  let n = 0;
  for (const id of ytIds) {
    if (n >= MAX_NEW_PER_PLATFORM) break;
    const item = await youtubeItem(id, now).catch(() => undefined);
    if (item) {
      added.push({ ...item, firstSeen: now });
      n++;
    }
  }
  console.log(`youtube shorts: ${ytIds.length} candidates, ${n} added`);

  const ttCands = (await tiktokCandidates()).filter((c) => !known.has(sha(c.url)));
  n = 0;
  for (const c of ttCands) {
    if (n >= MAX_NEW_PER_PLATFORM) break;
    const item = tiktokItem(c, now);
    if (item) {
      added.push({ ...item, firstSeen: now });
      n++;
    }
  }
  console.log(`tiktok: ${ttCands.length} candidates, ${n} added`);

  if (added.length === 0) return console.log("no new shorts or tiktoks");
  const merged = [...items, ...added].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  await writeFile(ITEMS_FILE, JSON.stringify(merged, null, 2) + "\n");
  console.log(`wrote ${added.length} new video item(s)`);
}

main().catch((err) => {
  // Never fail the hourly job because of this optional step.
  console.error(err);
});
