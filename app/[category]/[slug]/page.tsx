import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/AdSlot";
import { Infobox } from "@/components/Infobox";
import { Toc } from "@/components/Toc";
import { getAllArticles, getArticle, getHeadings, slugify } from "@/lib/content";
import { categories, site } from "@/lib/site";

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ category: a.category, slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[category]/[slug]">): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getArticle(category, slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: article.href },
    openGraph: { title: article.title, description: article.summary, type: "article" },
  };
}

const text = (children: ReactNode) => (typeof children === "string" ? children : String(children));

const mdxComponents = {
  h2: ({ children }: { children?: ReactNode }) => <h2 id={slugify(text(children))}>{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 id={slugify(text(children))}>{children}</h3>,
};

export default async function ArticlePage({ params }: PageProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  const article = getArticle(category, slug);
  if (!article) notFound();

  const cat = categories.find((c) => c.slug === category)!;
  const headings = getHeadings(article.body);
  const all = getAllArticles();
  const related = article.related
    .map((href) => all.find((a) => a.href === href))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    dateModified: article.updated,
    mainEntityOfPage: `${site.url}${article.href}`,
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_300px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <p className="text-sm text-muted">
          <Link href={`/${cat.slug}`} className="text-peach hover:underline">{cat.label}</Link> / {article.title}
        </p>
        <h1 className="mt-2 font-display text-6xl leading-none tracking-wide text-pink sm:text-8xl">
          {article.title}
        </h1>
        <p className="mt-4 text-xl leading-snug text-cream sm:text-2xl">{article.summary}</p>
        <p className="mt-2 text-xs text-muted">Last updated {article.updated}</p>
        <AdSlot slot="article-top" minHeight={120} />
        <div className="prose-wiki mt-6">
          <MDXRemote source={article.body} components={mdxComponents} />
        </div>
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-3 font-display text-3xl tracking-wide text-white">Related</h2>
            <ul className="flex flex-wrap gap-3">
              {related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="rounded-full border border-white/15 px-4 py-1.5 text-sm hover:border-pink hover:text-pink">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        {article.infobox && <Infobox title={article.title} data={article.infobox} />}
        <Toc headings={headings} />
        <AdSlot slot="sidebar" className="hidden lg:block" />
      </div>
    </div>
  );
}
