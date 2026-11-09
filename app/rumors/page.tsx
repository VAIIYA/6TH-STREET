import type { Metadata } from "next";
import { FeedRow, SectionHeading } from "@/components/FeedComponents";
import { getFeedItems } from "@/lib/feed";

export const metadata: Metadata = {
  title: "Rumors",
  description: "Reported and unconfirmed Grand Theft Auto VI rumors, each linked to its source.",
  alternates: { canonical: "/rumors" },
};

export default function RumorsPage() {
  const items = getFeedItems("rumor");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">Unconfirmed · updated hourly</p>
      <h1 className="mt-2 font-display text-6xl leading-none tracking-wide text-pink sm:text-8xl">Rumors</h1>
      <p className="mt-4 max-w-2xl text-lg text-cream/85">
        These are reports, leaks and speculation. Nothing here is confirmed. Check the linked source and any official
        announcement before you treat a rumor as fact.
      </p>

      <section className="mt-12 max-w-3xl" aria-labelledby="rumor-heading">
        <div id="rumor-heading">
          <SectionHeading>Reported this week</SectionHeading>
        </div>
        {items.length > 0 ? (
          <ul>
            {items.map((i) => (
              <FeedRow key={i.id} item={i} />
            ))}
          </ul>
        ) : (
          <p className="text-muted">No rumors right now.</p>
        )}
      </section>
    </div>
  );
}
