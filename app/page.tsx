import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSlot";
import { getAllArticles, getArticles } from "@/lib/content";
import { categories, site } from "@/lib/site";

export default function Home() {
  const featured = getAllArticles().filter((a) => a.featured && a.category !== "news").slice(0, 6);
  const news = getArticles("news").slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "var(--sunset)" }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/70 to-bg" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <h1 className="fade-up font-display text-7xl leading-none tracking-wide text-pink sm:text-9xl">
            Welcome to Leonida.
          </h1>
          <p className="fade-up mt-6 max-w-3xl text-2xl leading-snug text-cream sm:text-4xl" style={{ animationDelay: "0.1s" }}>
            Your unofficial guide to Grand Theft Auto VI — characters, places, vehicles and every
            confirmed detail.
          </p>
          <div className="fade-up mt-10 space-y-3" style={{ animationDelay: "0.2s" }}>
            <p className="text-xs uppercase tracking-widest text-peach">Release countdown</p>
            <Countdown target={site.releaseDate} />
          </div>
          <div className="fade-up mt-10 flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
            <Link href="/locations/vice-city" className="rounded-full bg-peach px-6 py-3 font-semibold text-bg hover:bg-pink">
              Explore Vice City
            </Link>
            <Link href="/news" className="rounded-full border border-white/20 px-6 py-3 hover:border-pink">
              Latest news
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="mb-6 font-display text-4xl tracking-wide text-white">Browse the wiki</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="rounded-card border border-white/10 bg-surface p-5 transition hover:border-pink/60"
            >
              <h3 className="font-display text-2xl tracking-wide text-peach">{c.label}</h3>
              <p className="mt-1 text-sm text-muted">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-8">
          <h2 className="mb-6 font-display text-4xl tracking-wide text-white">Featured</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => (
              <ArticleCard key={a.href} article={a} />
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-4xl px-5">
        <AdSlot slot="home-mid" />
      </div>

      {news.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-8">
          <h2 className="mb-6 font-display text-4xl tracking-wide text-white">Latest news</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((a) => (
              <ArticleCard key={a.href} article={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
