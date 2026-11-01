import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <div className="prose-wiki mx-auto max-w-3xl px-5 py-12">
      <h1 className="mb-6 font-display text-6xl tracking-wide text-pink">Privacy</h1>
      <p>We do not have accounts and we do not collect personal data ourselves.</p>
      <h2>Analytics</h2>
      <p>We use Vercel Web Analytics, which is cookie-free and does not track individual visitors across sites.</p>
      <h2>Advertising</h2>
      <p>
        We show a limited number of ads through Google AdSense. Google and its partners may use
        cookies to serve and measure ads. Where required (for example in the EEA and UK) you are
        asked for consent first and can change your choice at any time. You can learn more or opt
        out at <a href="https://adssettings.google.com">adssettings.google.com</a>.
      </p>
      <h2>Contact</h2>
      <p>Questions? Open an issue on our GitHub repository.</p>
    </div>
  );
}
