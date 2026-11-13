export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-white/10 rounded-card border border-white/10 bg-surface">
      {items.map((i) => (
        <details key={i.q} className="group px-6 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-white marker:hidden">
            {i.q}
            <span aria-hidden className="text-peach transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 leading-relaxed text-cream/85">{i.a}</p>
        </details>
      ))}
    </div>
  );
}
