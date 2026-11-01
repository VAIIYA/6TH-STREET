import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { categories, type CategorySlug } from "@/lib/site";

const CONTENT_DIR = path.join(process.cwd(), "content");

const schema = z.object({
  title: z.string(),
  summary: z.string(),
  updated: z.string(),
  featured: z.boolean().default(false),
  infobox: z.record(z.string(), z.string()).optional(),
  related: z.array(z.string()).default([]),
  sources: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .default([]),
});

export type Article = z.infer<typeof schema> & {
  category: CategorySlug;
  slug: string;
  body: string;
  href: string;
};

export type Heading = { id: string; text: string; level: 2 | 3 };

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getHeadings(body: string): Heading[] {
  return [...body.matchAll(/^(##|###) (.+)$/gm)].map((m) => ({
    id: slugify(m[2]),
    text: m[2],
    level: m[1].length as 2 | 3,
  }));
}

function load(category: CategorySlug, file: string): Article {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, category, file), "utf8");
  const { data, content } = matter(raw);
  const slug = file.replace(/\.mdx$/, "");
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in content/${category}/${file}: ${parsed.error.message}`);
  }
  return { ...parsed.data, category, slug, body: content, href: `/${category}/${slug}` };
}

export function getArticles(category: CategorySlug): Article[] {
  const dir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => load(category, f))
    .sort((a, b) =>
      category === "news" ? b.updated.localeCompare(a.updated) : a.title.localeCompare(b.title),
    );
}

export function getArticle(category: string, slug: string): Article | undefined {
  return getArticles(category as CategorySlug).find((a) => a.slug === slug);
}

export function getAllArticles(): Article[] {
  return categories.flatMap((c) => getArticles(c.slug));
}

export function isCategory(value: string): value is CategorySlug {
  return categories.some((c) => c.slug === value);
}
