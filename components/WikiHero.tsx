import Link from "next/link";

type Props = {
  category: { slug: string; label: string };
  title: string;
  summary: string;
  facts: [string, string][];
  updated: string;
};

/** Designed banner for wiki pages: our own artwork (the site gradient), no third-party images. */
export function WikiHero({ category, title, summary, facts, updated }: Props) {
  return (
    <header className="relative overflow-hidden rounded-card border border-white/10">
      <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: "var(--sunset)" }} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      <p
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-[9rem] leading-none tracking-wide text-white/10 sm:text-[14rem]"
      >
        VI
      </p>
      <div className="relative px-6 pb-8 pt-24 sm:px-10 sm:pt-32">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">
          <Link href={`/${category.slug}`} className="hover:underline">
            {category.label}
          </Link>
        </p>
        <h1 className="mt-2 font-display text-6xl leading-none tracking-wide text-white sm:text-8xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-xl leading-snug text-cream sm:text-2xl">{summary}</p>
        {facts.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {facts.map(([k, v]) => (
              <li key={k} className="rounded-full border border-white/20 bg-bg/60 px-4 py-1.5 text-sm backdrop-blur">
                <span className="text-muted">{k}</span> <span className="font-bold text-white">{v}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-xs text-muted">
          Last updated <time dateTime={updated}>{updated}</time>
        </p>
      </div>
    </header>
  );
}
