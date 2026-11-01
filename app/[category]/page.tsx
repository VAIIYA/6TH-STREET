import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticles, isCategory } from "@/lib/content";
import { categories } from "@/lib/site";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const { category } = await params;
  const meta = categories.find((c) => c.slug === category);
  return meta ? { title: meta.label, description: meta.blurb } : {};
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const meta = categories.find((c) => c.slug === category)!;
  const articles = getArticles(category);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-6xl tracking-wide text-pink sm:text-8xl">{meta.label}</h1>
      <p className="mt-2 max-w-2xl text-xl text-cream/90">{meta.blurb}</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.href} article={a} />
        ))}
      </div>
      {articles.length === 0 && <p className="mt-10 text-muted">Nothing here yet — check back soon.</p>}
    </div>
  );
}
