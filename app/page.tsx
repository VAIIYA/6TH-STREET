import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSlot";
import { FeedLead, FeedRow, SectionHeading, VideoCard } from "@/components/FeedComponents";
import { getAllArticles } from "@/lib/content";
import { getFeedItems, getWikipedia } from "@/lib/feed";
import { categories, site } from "@/lib/site";

export default function Home() {
  const all = getFeedItems();
  const [lead, ...rest] = all;
  const secondary = rest.slice(0, 4);
  const latest = rest.slice(4, 14);
  const rumors = getFeedItems("rumor").slice(0, 5);
  const videos = getFeedItems("video").slice(0, 3);
  const wiki = getWikipedia();
  const featured = getAllArticles()
    .filter((a) => a.featured && a.category !== "news")
    .slice(0, 3);

  return (
    <>
      {lead ? (
        <section className="mx-auto grid max-w-6xl gap-10 px-5 pt-8 pb-12 lg:grid-cols-[1.6fr_1fr]">
          <FeedLead item={lead} />
          <aside aria-label="Also today">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted">Also today</h2>
            <ul>
              {secondary.map((i) => (
                <FeedRow key={i.id} item={i} compact />
              ))}
            </ul>
            <Link href="/news" className="mt-6 inline-block rounded-full bg-peach px-5 py-2.5 text-sm font-bold text-bg hover:bg-pink">
              All news
            </Link>
          </aside>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h1 className="font-display text-7xl leading-none tracking-wide text-pink sm:text-9xl">Welcome to Leonida.</h1>
          <p className="mt-4 text-xl text-cream/85">The live feed is empty. It refreshes every hour.</p>
        </section>
      )}

      <section className="border-y border-white/10 bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">Release countdown</p>
            <Countdown target={site.releaseDate} />
          </div>
          <Link href="/news#timeline" className="self-start text-sm font-bold uppercase tracking-[0.18em] text-cream hover:text-pink sm:self-auto">
            Read the timeline →
          </Link>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="latest-heading">
          <div id="latest-heading">
            <SectionHeading href="/news" linkLabel="More">
              Latest
            </SectionHeading>
          </div>
          {latest.length > 0 ? (
            <ul>
              {latest.map((i) => (
                <FeedRow key={i.id} item={i} />
              ))}
            </ul>
          ) : (
            <p className="text-muted">No more headlines yet.</p>
          )}
        </section>

        <aside className="space-y-12" aria-label="Rumors and wiki">
          <section>
            <SectionHeading href="/rumors" linkLabel="All rumors">
              Rumor mill
            </SectionHeading>
            <p className="mb-4 text-xs text-muted">Reported, not confirmed. Check the source before you believe it.</p>
            {rumors.length > 0 ? (
              <ul>
                {rumors.map((i) => (
                  <FeedRow key={i.id} item={i} compact />
                ))}
              </ul>
            ) : (
              <p className="text-muted">No rumors right now.</p>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-display text-4xl tracking-wide text-white">Browse the wiki</h2>
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {categories
                .filter((c) => c.slug !== "news")
                .map((c) => (
                  <li key={c.slug}>
                    <Link href={`/${c.slug}`} className="group flex items-center justify-between py-3">
                      <span>
                        <span className="block font-bold text-white group-hover:text-pink">{c.label}</span>
                        <span className="block text-sm text-muted">{c.blurb}</span>
                      </span>
                      <span aria-hidden className="text-peach">→</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>

          <AdSlot slot="sidebar" className="hidden lg:block" />
        </aside>
      </div>

      {videos.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-8">
          <SectionHeading href="/videos" linkLabel="All videos">
            Videos
          </SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v.id} item={v} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-12">
        <SectionHeading href="/characters" linkLabel="Wiki">
          From the wiki
        </SectionHeading>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          {wiki && (
            <article className="rounded-card border border-white/10 bg-surface p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">Wikipedia</p>
              <h3 className="mt-2 font-display text-4xl tracking-wide text-white">{wiki.title}</h3>
              <p className="mt-3 line-clamp-6 text-cream/85">{wiki.extract}</p>
              <a
                href={wiki.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block text-sm font-bold text-pink underline underline-offset-4 hover:text-peach"
              >
                Read on Wikipedia
              </a>
            </article>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            {featured.map((a) => (
              <ArticleCard key={a.href} article={a} />
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5">
        <AdSlot slot="home-mid" />
      </div>
    </>
  );
}
