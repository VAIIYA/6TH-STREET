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
