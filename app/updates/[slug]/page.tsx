import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedRow, KindLabel, SectionHeading } from "@/components/FeedComponents";
import { feedHref, feedSlug, formatDateTime, getFeedItem, embedFor, getFeedItems, getRewrite } from "@/lib/feed";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return getFeedItems().map((i) => ({ slug: feedSlug(i) }));
}

export async function generateMetadata({ params }: PageProps<"/updates/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = getFeedItem(slug);
  if (!item) return {};
  const rw = getRewrite(item.id);
  const title = rw?.title ?? item.title;
  const description = rw?.body ? rw.body.split(/(?<=[.!?])\s/)[0].slice(0, 160) : (item.summary ?? `${item.title} (via ${item.source}).`);
  const image = item.thumbnail ?? rw?.image;
  return {
    title,
    description,
    alternates: { canonical: feedHref(item) },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: item.publishedAt,
      ...(image && { images: [image] }),
    },
  };
}

export default async function UpdatePage({ params }: PageProps<"/updates/[slug]">) {
  const { slug } = await params;
  const item = getFeedItem(slug);
  if (!item) notFound();

  const rw = getRewrite(item.id);
  const title = rw?.title ?? item.title;
  const image = item.thumbnail ?? rw?.image;
  const embed = embedFor(item);
  const more = getFeedItems(item.kind)
    .filter((i) => i.id !== item.id)
    .slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": item.kind === "video" ? "VideoObject" : "NewsArticle",
    [item.kind === "video" ? "name" : "headline"]: title,
    description: rw?.body ?? item.summary ?? item.title,
    datePublished: item.publishedAt,
    dateModified: item.publishedAt,
    mainEntityOfPage: `${site.url}${feedHref(item)}`,
    ...(image && { image: [image], ...(item.kind === "video" && { thumbnailUrl: image }) }),
    ...(item.kind === "video" && { uploadDate: item.publishedAt, ...(embed && { embedUrl: embed.src }) }),
    isBasedOn: item.url,
    publisher: { "@type": "Organization", name: site.name, url: site.url },
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm text-muted">
        <Link href="/news" className="text-peach hover:underline">News</Link> / {item.source}
      </p>
      <div className="mt-3">
        <KindLabel kind={item.kind} />
      </div>
      <h1 className="mt-2 font-display text-5xl leading-none tracking-wide text-pink sm:text-7xl">{title}</h1>
      <p className="mt-3 text-xs text-muted">
        <span className="font-semibold text-cream/80">{item.source}</span> ·{" "}
        <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt)}</time>
      </p>

      {embed && (
        <div className={`mt-6 overflow-hidden rounded-card border border-white/10 bg-black ${embed.vertical ? "mx-auto max-w-[340px]" : ""}`}>
          <iframe
            src={embed.src}
            title={title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className={`w-full ${embed.vertical ? "aspect-[9/16]" : "aspect-video"}`}
          />
        </div>
      )}

      {!embed && image && (
        <div className="mt-6 overflow-hidden rounded-card border border-white/10 bg-surface">
          {/* Publisher image, embedded from its own URL: next/image would proxy and re-host it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            width={1200}
            height={630}
            loading="eager"
            referrerPolicy="no-referrer"
            className="aspect-[1200/630] w-full object-cover"
          />
        </div>
      )}

      {rw?.body && <p className="mt-6 text-xl leading-snug text-cream">{rw.body}</p>}
      {item.summary && (
        <blockquote className="mt-6 border-l-4 border-pink pl-4 text-cream/80">
          <p>{item.summary}</p>
          <footer className="mt-1 text-xs text-muted">Excerpt from {item.source}</footer>
        </blockquote>
      )}

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-full bg-pink px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-bg hover:bg-peach"
      >
        {item.platform === "tiktok" ? "Open on TikTok" : item.kind === "video" ? "Watch on YouTube" : `Read the full story at ${item.source}`} →
      </a>
      <p className="mt-4 text-xs text-muted">
        The image, headline and excerpt belong to {item.source}; the summary above is our own wording. Flamingo Six is an unofficial fan site and does not host the original
        reporting.{item.kind === "rumor" && " This item is unconfirmed."}
      </p>

      {more.length > 0 && (
        <section className="mt-14">
          <SectionHeading href="/news" linkLabel="All news">More like this</SectionHeading>
          <ul>
            {more.map((i) => (
              <FeedRow key={i.id} item={i} compact />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
