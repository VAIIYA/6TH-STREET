import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <div className="prose-wiki mx-auto max-w-3xl px-5 py-12">
      <h1 className="mb-6 font-display text-6xl tracking-wide text-pink">About</h1>
      <p>
        {site.name} is a community-run wiki about Grand Theft Auto VI. We collect confirmed
        information from official trailers and announcements and clearly separate it from rumours.
      </p>
      <p>{site.disclaimer}</p>
      <p>
        The project is open source. Spotted a mistake or want to add an article? Open a pull request
        on <a href={site.repoUrl}>GitHub</a>.
      </p>
    </div>
  );
}
