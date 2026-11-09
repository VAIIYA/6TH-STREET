import Link from "next/link";
import { categories, sections, site } from "@/lib/site";
import { Search } from "@/components/Search";

const wikiLinks = categories.filter((c) => c.slug !== "news");

export function Header() {
  const items = [
    ...sections.map((s) => ({ href: s.href, label: s.label })),
    ...wikiLinks.map((c) => ({ href: `/${c.slug}`, label: c.label })),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pt-4 pb-3">
        <Link href="/" className="font-display text-4xl leading-none tracking-wider text-pink">
          {site.name}
        </Link>
        <Search />
      </div>
      <nav aria-label="Sections" className="border-t border-white/10">
        <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em]">
          {items.map((i, idx) => (
            <li key={i.href} className="shrink-0">
              <Link
                href={i.href}
                className={`hover:text-pink ${idx < sections.length ? "text-cream" : "text-cream/60"}`}
              >
                {i.label}
              </Link>
              {idx === sections.length - 1 && <span aria-hidden className="ml-6 text-white/20">|</span>}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
