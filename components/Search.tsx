"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";

type Entry = { title: string; summary: string; href: string; category: string };

export function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Entry[]>([]);

  useEffect(() => {
    if (!open || index.length) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => {});
  }, [open, index.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fuse = useMemo(
    () => new Fuse(index, { keys: ["title", "summary"], threshold: 0.35 }),
    [index],
  );
  const results = q ? fuse.search(q).slice(0, 8) : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-cream/80 hover:border-pink hover:text-pink"
        aria-label="Search the wiki"
      >
        Search
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-24 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div
            className="w-full max-w-xl rounded-card border border-white/10 bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search characters, places, vehicles…"
              className="w-full rounded-full bg-bg px-5 py-3 text-cream placeholder:text-muted"
            />
            <ul className="mt-3 space-y-1">
              {results.map(({ item }) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-2 hover:bg-surface-2"
                  >
                    <span className="text-xs uppercase tracking-widest text-peach">{item.category}</span>
                    <span className="block font-semibold">{item.title}</span>
                  </Link>
                </li>
              ))}
              {q && results.length === 0 && <li className="px-4 py-2 text-muted">No results.</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
