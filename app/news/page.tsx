import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { FeedRow, SectionHeading } from "@/components/FeedComponents";
import { getArticles, getLatestStories } from "@/lib/content";
import { getFeedItems } from "@/lib/feed";

export const metadata: Metadata = {
  title: "News",
  description: "Live Grand Theft Auto VI headlines from across the web, each linked to its original source.",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  const items = getFeedItems("news");
  const timeline = getArticles("news").filter((a) => !a.auto);
  const stories = getLatestStories(12);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">Live feed · updated hourly</p>
      <h1 className="mt-2 font-display text-6xl leading-none tracking-wide text-pink sm:text-8xl">News</h1>
      <p className="mt-4 max-w-2xl text-lg text-cream/85">
        Our own write-ups of the biggest Grand Theft Auto VI stories, plus headlines from public news sources. Every
        item links to the original reporting. We do not copy articles.
      </p>

      {stories.length > 0 && (
        <section id="stories" className="mt-12 scroll-mt-40" aria-labelledby="stories-heading">
          <div id="stories-heading">
            <SectionHeading>Latest stories</SectionHeading>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((a) => (
              <ArticleCard key={a.href} article={a} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="news-heading">
          <div id="news-heading">
            <SectionHeading>More headlines</SectionHeading>
          </div>
          {items.length > 0 ? (
            <ul>
              {items.map((i) => (
                <FeedRow key={i.id} item={i} />
              ))}
            </ul>
          ) : (
            <p className="text-muted">No headlines yet. The feed refreshes every hour.</p>
          )}
        </section>

        <aside className="lg:sticky lg:top-40 lg:self-start">
          <p className="text-sm text-muted">
            Headlines are not confirmed by Rockstar Games or Take-Two Interactive unless the linked source says so.
          </p>
        </aside>
      </div>

      <section id="timeline" className="mt-20 scroll-mt-40">
        <SectionHeading>Verified timeline</SectionHeading>
        <p className="mb-6 max-w-2xl text-cream/85">Our own summaries of official announcements, with sources.</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {timeline.map((a) => (
            <ArticleCard key={a.href} article={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
