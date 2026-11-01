"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

export function Countdown({ target }: { target: string }) {
  const ts = new Date(target).getTime();
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    const tick = () => setT(diff(ts));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ts]);

  const units = [
    ["Days", t?.days],
    ["Hours", t?.hours],
    ["Min", t?.minutes],
    ["Sec", t?.seconds],
  ] as const;

  return (
    <div className="flex gap-3 sm:gap-5" role="timer" aria-label="Countdown to release">
      {units.map(([label, value]) => (
        <div key={label} className="min-w-16 rounded-2xl bg-surface/80 px-3 py-3 text-center backdrop-blur sm:min-w-24">
          <div className="font-display text-4xl tabular-nums text-peach sm:text-6xl">
            {value === undefined ? "--" : String(value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}
