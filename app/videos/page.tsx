import type { Metadata } from "next";
import { SectionHeading, VideoCard } from "@/components/FeedComponents";
import { getFeedItems } from "@/lib/feed";

export const metadata: Metadata = {
  title: "Videos",
  description: "Grand Theft Auto VI trailers from Rockstar Games plus the latest YouTube Shorts and TikTok videos, updated hourly.",
  alternates: { canonical: "/videos" },
};

export default function VideosPage() {
  const all = getFeedItems("video");
  const items = all.filter((v) => !v.platform);
  const social = all.filter((v) => v.platform).slice(0, 60);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">Updated hourly</p>
      <h1 className="mt-2 font-display text-6xl leading-none tracking-wide text-pink sm:text-8xl">Videos</h1>
      <p className="mt-4 max-w-2xl text-lg text-cream/85">Trailers and videos from Rockstar Games’ YouTube channels.</p>

      <section className="mt-12" aria-labelledby="video-heading">
        <div id="video-heading">
          <SectionHeading>Latest videos</SectionHeading>
        </div>
        {items.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => (
              <VideoCard key={v.id} item={v} />
            ))}
          </div>
        ) : (
          <p className="text-muted">No videos yet.</p>
        )}
      </section>

      {social.length > 0 && (
        <section className="mt-16" aria-labelledby="social-heading">
          <div id="social-heading">
            <SectionHeading>Shorts &amp; TikTok</SectionHeading>
          </div>
          <p className="mb-6 max-w-2xl text-sm text-muted">
            Fan and creator videos from YouTube Shorts and TikTok. Not made or endorsed by Rockstar Games.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {social.map((v) => (
              <VideoCard key={v.id} item={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
