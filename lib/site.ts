export const site = {
  name: "6th Street",
  tagline: "The unofficial Grand Theft Auto VI wiki",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://6thstreet.vercel.app",
  // Single source of truth for the countdown; verify against Rockstar's official announcement.
  releaseDate: "2026-11-19T00:00:00Z",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
  repoUrl: "https://github.com/VAIIYA/6TH-STREET",
  disclaimer:
    "Unofficial fan site. Not affiliated with, endorsed by, or connected to Rockstar Games or Take-Two Interactive. Grand Theft Auto is a trademark of Take-Two Interactive Software, Inc.",
} as const;

export const categories = [
  { slug: "characters", label: "Characters", blurb: "The crooks, cops and hustlers of Leonida." },
  { slug: "locations", label: "Locations", blurb: "From Vice City neon to the Grassrivers swamps." },
  { slug: "vehicles", label: "Vehicles", blurb: "Everything on wheels, wings and hulls." },
  { slug: "gameplay", label: "Gameplay", blurb: "Mechanics, systems and what we know so far." },
  { slug: "news", label: "News", blurb: "Trailers, announcements and the full timeline." },
] as const;

// Top-level live sections (fed hourly from content/feed). Wiki categories come after.
export const sections = [
  { href: "/news", label: "News" },
  { href: "/rumors", label: "Rumors" },
  { href: "/videos", label: "Videos" },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];
