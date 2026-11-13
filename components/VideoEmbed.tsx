"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Click-to-play YouTube embed (privacy-enhanced domain). Nothing is loaded from YouTube's player
 * until the visitor presses play; only the public thumbnail is shown before that.
 */
export function VideoEmbed({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure>
      <div className="relative aspect-video overflow-hidden rounded-card border border-white/10 bg-surface-2">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${title}`}
            className="group absolute inset-0 block h-full w-full"
          >
            <Image
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(min-width: 1024px) 400px, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-peach text-2xl text-bg transition group-hover:bg-pink"
            >
              ▶
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 text-sm">
        <span className="font-bold text-white">{title}</span>
        <span className="text-muted"> · Rockstar Games · </span>
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink underline underline-offset-4 hover:text-peach"
        >
          Watch on YouTube
        </a>
      </figcaption>
    </figure>
  );
}
