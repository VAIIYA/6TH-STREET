export function Infobox({ title, data }: { title: string; data: Record<string, string> }) {
  return (
    <aside className="rounded-card border border-white/10 bg-surface p-5">
      <h2 className="mb-3 font-display text-2xl tracking-wide text-pink">{title}</h2>
      <dl className="divide-y divide-white/10 text-sm">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
