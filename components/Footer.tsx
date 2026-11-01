import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-surface/50">
      <div className="mx-auto max-w-6xl space-y-4 px-5 py-10 text-sm text-muted">
        <p className="font-display text-2xl tracking-wider text-pink">{site.name}</p>
        <p className="max-w-3xl">{site.disclaimer}</p>
        <nav className="flex flex-wrap gap-5 text-cream/80">
          <Link href="/about" className="hover:text-peach">About</Link>
          <Link href="/faq" className="hover:text-peach">FAQ</Link>
          <Link href="/privacy" className="hover:text-peach">Privacy</Link>
          <a href={site.repoUrl} className="hover:text-peach">GitHub</a>
        </nav>
        <p>Text content is available under CC BY-SA 4.0. Code is MIT licensed.</p>
      </div>
    </footer>
  );
}
