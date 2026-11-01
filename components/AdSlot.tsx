"use client";

import { useEffect, useRef } from "react";
import { site } from "@/lib/site";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = { slot: string; className?: string; minHeight?: number };

// Renders nothing until NEXT_PUBLIC_ADSENSE_CLIENT is set, so dev and forks stay ad-free.
export function AdSlot({ slot, className = "", minHeight = 250 }: Props) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!site.adsenseClient || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ad blockers can throw; ignore
    }
  }, []);

  if (!site.adsenseClient) return null;

  return (
    <aside className={`my-8 ${className}`} aria-label="Advertisement">
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">Advertisement</p>
      <div style={{ minHeight }} className="overflow-hidden rounded-xl bg-surface/60">
        <ins
          className="adsbygoogle block"
          style={{ display: "block", minHeight }}
          data-ad-client={site.adsenseClient}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
