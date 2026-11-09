import type { Metadata } from "next";
import { SectionHeading, VideoCard } from "@/components/FeedComponents";
import { getFeedItems } from "@/lib/feed";

export const metadata: Metadata = {
  title: "Videos",
  description: "Official Grand Theft Auto VI videos from Rockstar Games’ YouTube channels.",
  alternates: { canonical: "/videos" },
};

export default function VideosPage() {
  const items = getFeedItems("video");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">Official channels · updated hourly</p>
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
    </div>
  );
}
