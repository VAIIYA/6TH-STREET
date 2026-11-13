export function Timeline({ items }: { items: { date: string; label: string }[] }) {
  return (
    <ol className="relative ml-2 space-y-6 border-l-2 border-pink/50 pl-6">
      {items.map((i) => (
        <li key={`${i.date}-${i.label}`} className="relative">
          <span aria-hidden className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full bg-pink ring-4 ring-bg" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">{i.date}</p>
          <p className="mt-1 text-cream">{i.label}</p>
        </li>
      ))}
    </ol>
  );
}
