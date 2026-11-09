import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import { categories, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/faq", "/privacy"].map((p) => ({ url: `${site.url}${p}` }));
  const cats = categories.map((c) => ({ url: `${site.url}/${c.slug}` }));
  const articles = getAllArticles().map((a) => ({
    url: `${site.url}${a.href}`,
    lastModified: a.published ?? a.updated,
  }));
  return [...pages, ...cats, ...articles];
}
