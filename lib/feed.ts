import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

// Written hourly by scripts/update-feed.mjs. Every item links to its original source.
const FEED_DIR = path.join(process.cwd(), "content", "feed");

export const feedKinds = ["news", "rumor", "video", "community"] as const;
export type FeedKind = (typeof feedKinds)[number];

export const kindMeta: Record<FeedKind, { label: string; tone: string }> = {
  news: { label: "News", tone: "text-pink" },
  rumor: { label: "Rumor · unconfirmed", tone: "text-peach" },
  video: { label: "Video", tone: "text-[#b9a8ff]" },
  community: { label: "Community", tone: "text-muted" },
};

const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
  kind: z.enum(feedKinds),
  publishedAt: z.string(),
  firstSeen: z.string().optional(),
  summary: z.string().optional(),
  videoId: z.string().optional(),
  platform: z.enum(["short", "tiktok"]).optional(),
  thumbnail: z.string().url().optional(),
});

export type FeedItem = z.infer<typeof itemSchema>;

const wikiSchema = z.object({
  title: z.string(),
  extract: z.string(),
  url: z.string().url(),
  updated: z.string().optional(),
  thumbnail: z.string().url().optional(),
});

// Written hourly by scripts/rewrite-items.mjs. Parsed leniently: a bad entry is ignored, never a build error.
const rewriteSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  image: z.string().url().optional(),
});
export type Rewrite = z.infer<typeof rewriteSchema>;

export function getRewrite(id: string): Rewrite | undefined {
  const data = readJson("rewrites.json");
  if (!data || typeof data !== "object") return undefined;
  const parsed = rewriteSchema.safeParse((data as Record<string, unknown>)[id]);
  return parsed.success ? parsed.data : undefined;
}

export type WikiSnapshot = z.infer<typeof wikiSchema>;

function readJson(file: string): unknown {
  const full = path.join(FEED_DIR, file);
  if (!fs.existsSync(full)) return undefined;
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

/**
 * Newest first. Pass a kind to filter.
 * Items without a snippet are headline-only (kept for story detection). The site shows
 * only items that carry a snippet, except videos, which have a thumbnail instead.
 */
export function getFeedItems(kind?: FeedKind): FeedItem[] {
  const parsed = z.array(itemSchema).safeParse(readJson("items.json") ?? []);
  if (!parsed.success) throw new Error(`Invalid content/feed/items.json: ${parsed.error.message}`);
  const items = [...parsed.data]
    .filter((i) => i.summary || i.kind === "video")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return kind ? items.filter((i) => i.kind === kind) : items;
}

export function getWikipedia(): WikiSnapshot | null {
  const data = readJson("wikipedia.json");
  if (!data) return null;
  const parsed = wikiSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Fixed UTC formatting so server output is deterministic (no "time ago" from the clock). */
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(iso));
}

/** URL slug for an item's own page: readable words for Google, plus the id so it stays unique and stable. */
export function feedSlug(item: FeedItem) {
  const words = item.title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return words ? `${words}-${item.id}` : item.id;
}

export const feedHref = (item: FeedItem) => `/updates/${feedSlug(item)}`;

/** Look up by the trailing id, so a changed headline never breaks an indexed URL. */
export function getFeedItem(slug: string): FeedItem | undefined {
  const id = slug.slice(-12);
  return getFeedItems().find((i) => i.id === id);
}

/** Official channel videos have no platform; Shorts and TikToks do. */
export const isOfficialVideo = (i: FeedItem) => i.kind === "video" && !i.platform;

/** Official embed player for a video item. Vertical formats (Shorts, TikTok) are 9:16. */
export function embedFor(item: FeedItem): { src: string; vertical: boolean } | undefined {
  if (!item.videoId) return undefined;
  if (item.platform === "tiktok") return { src: `https://www.tiktok.com/player/v1/${item.videoId}`, vertical: true };
  return {
    src: `https://www.youtube-nocookie.com/embed/${item.videoId}`,
    vertical: item.platform === "short",
  };
}
