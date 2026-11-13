import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/AdSlot";
import { ArticleCard } from "@/components/ArticleCard";
import { Faq } from "@/components/Faq";
import { Infobox } from "@/components/Infobox";
import { Timeline } from "@/components/Timeline";
import { Toc } from "@/components/Toc";
import { VideoEmbed } from "@/components/VideoEmbed";
import { WikiHero } from "@/components/WikiHero";
import { getAllArticles, getArticle, getHeadings, slugify, type Heading } from "@/lib/content";
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
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      ...(article.published && { publishedTime: article.published, modifiedTime: article.published }),
    },
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
  const isWiki = category !== "news";
  const hasVideos = article.videos.length > 0;
  const hasTimeline = article.timeline.length > 0;
  const hasFaq = article.faq.length > 0;
  const headings: Heading[] = [
    ...getHeadings(article.body),
    ...(hasVideos ? [{ id: "videos", text: "Official videos", level: 2 as const }] : []),
    ...(hasTimeline ? [{ id: "timeline", text: "Timeline", level: 2 as const }] : []),
    ...(hasFaq ? [{ id: "faq", text: "Questions", level: 2 as const }] : []),
  ];
  const heroFacts = Object.entries(article.infobox ?? {}).slice(0, 3);
  const all = getAllArticles();
  const related = article.related
    .map((href) => all.find((a) => a.href === href))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const isStory = article.auto && article.category === "news";
  const publisher = { "@type": "Organization", name: site.name, url: site.url };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isStory ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.summary,
    dateModified: article.published ?? article.updated,
    ...(article.published && { datePublished: article.published }),
    ...(isStory && { author: publisher, publisher }),
    mainEntityOfPage: `${site.url}${article.href}`,
    ...(article.sources.length > 0 && { citation: article.sources.map((s) => s.url) }),
  };

  const faqLd = hasFaq && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_300px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <article>
        {isWiki ? (
          <WikiHero
            category={cat}
            title={article.title}
            summary={article.summary}
            facts={heroFacts}
            updated={article.updated}
          />
        ) : (
          <>
            <p className="text-sm text-muted">
              <Link href={`/${cat.slug}`} className="text-peach hover:underline">{cat.label}</Link> / {article.title}
            </p>
            <h1 className="mt-2 font-display text-6xl leading-none tracking-wide text-pink sm:text-8xl">
              {article.title}
            </h1>
            <p className="mt-4 text-xl leading-snug text-cream sm:text-2xl">{article.summary}</p>
            <p className="mt-2 text-xs text-muted">
              {article.kind === "rumor" && (
                <span className="mr-2 font-bold uppercase tracking-widest text-peach">Rumor · unconfirmed</span>
              )}
              Published <time dateTime={article.published ?? article.updated}>{article.updated}</time>
            </p>
          </>
        )}
        <AdSlot slot="article-top" minHeight={120} />
        <div className="prose-wiki mt-6">
          <MDXRemote source={article.body} components={mdxComponents} />
        </div>
        {hasVideos && (
          <section id="videos" className="mt-12 scroll-mt-24">
            <h2 className="mb-4 font-display text-4xl tracking-wide text-white">Official videos</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {article.videos.map((v) => (
                <VideoEmbed key={v.id} id={v.id} title={v.title} />
              ))}
            </div>
          </section>
        )}
        {hasTimeline && (
          <section id="timeline" className="mt-12 scroll-mt-24">
            <h2 className="mb-5 font-display text-4xl tracking-wide text-white">Timeline</h2>
            <Timeline items={article.timeline} />
          </section>
        )}
        {hasFaq && (
          <section id="faq" className="mt-12 scroll-mt-24">
            <h2 className="mb-4 font-display text-4xl tracking-wide text-white">Questions</h2>
            <Faq items={article.faq} />
          </section>
        )}
        {article.sources.length > 0 && (
          <section className="mt-12 rounded-card border border-white/10 bg-surface p-6">
            <h2 className="mb-3 font-display text-3xl tracking-wide text-white">Sources</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              {article.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink underline underline-offset-4 hover:text-peach"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">
              {article.auto
                ? "Written by 6th Street from the reporting linked above, with AI assistance. We only restate what those sources say; follow the links for the original coverage."
                : "This article is our own summary. Follow the links above for the original sources."}
            </p>
          </section>
        )}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-4xl tracking-wide text-white">Related</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {related.map((r) => (
                <ArticleCard key={r.href} article={r} />
              ))}
            </div>
          </section>
        )}
      </article>
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        {article.infobox && <Infobox title="At a glance" data={article.infobox} />}
        <Toc headings={headings} />
        <AdSlot slot="sidebar" className="hidden lg:block" />
      </div>
    </div>
  );
}
