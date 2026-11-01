import type { Heading } from "@/lib/content";

export function Toc({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;
  return (
    <nav aria-label="On this page" className="rounded-card border border-white/10 bg-surface p-5 text-sm">
      <h2 className="mb-2 font-display text-xl tracking-wide text-pink">Contents</h2>
      <ul className="space-y-1.5">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
            <a href={`#${h.id}`} className="text-cream/80 hover:text-peach">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
