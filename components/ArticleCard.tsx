import Link from "next/link";
import type { Article } from "@/lib/content";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={article.href}
      className="group relative flex min-h-48 flex-col justify-end overflow-hidden rounded-card border border-white/10 bg-surface p-6 transition hover:-translate-y-1 hover:border-pink/60"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 transition group-hover:opacity-50"
        style={{ background: "var(--sunset)" }}
      />
      <div className="relative">
        <p className="text-xs uppercase tracking-widest text-peach">{article.category}</p>
        <h3 className="font-display text-3xl leading-tight tracking-wide text-white">{article.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-cream/80">{article.summary}</p>
      </div>
    </Link>
  );
}
