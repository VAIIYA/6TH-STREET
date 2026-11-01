import Link from "next/link";
import { categories, site } from "@/lib/site";
import { Search } from "@/components/Search";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="font-display text-3xl tracking-wider text-pink">
          {site.name}
        </Link>
        <nav aria-label="Main" className="hidden gap-6 text-sm md:flex">
          {categories.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="text-cream/80 hover:text-peach">
              {c.label}
            </Link>
          ))}
        </nav>
        <Search />
      </div>
      <nav aria-label="Main mobile" className="flex gap-5 overflow-x-auto px-5 pb-3 text-sm md:hidden">
        {categories.map((c) => (
          <Link key={c.slug} href={`/${c.slug}`} className="shrink-0 text-cream/80 hover:text-peach">
            {c.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
