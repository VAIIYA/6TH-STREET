import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  ["Is this an official Rockstar site?", "No. This is an independent fan project with no affiliation to Rockstar Games or Take-Two."],
  ["Where does the information come from?", "Official trailers, Rockstar's own website and press statements. Anything unconfirmed is labelled as such."],
  ["Can I contribute?", "Yes. Articles are plain MDX files in the public GitHub repository. Open a pull request."],
  ["Do I need an account?", "No. There are no accounts and no sign-ups."],
];

export default function Faq() {
  return (
    <div className="prose-wiki mx-auto max-w-3xl px-5 py-12">
      <h1 className="mb-6 font-display text-6xl tracking-wide text-pink">FAQ</h1>
      {faqs.map(([q, a]) => (
        <div key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </div>
      ))}
    </div>
  );
}
