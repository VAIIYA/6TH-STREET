export const site = {
  name: "Grand Theft Wiki",
  tagline: "The unofficial Grand Theft Auto VI wiki",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://grand-theft-wiki.vercel.app",
  // Single source of truth for the countdown; verify against Rockstar's official announcement.
  releaseDate: "2026-11-19T00:00:00Z",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
  repoUrl: "https://github.com/VAIIYA/GTW",
  disclaimer:
    "Unofficial fan site. Not affiliated with, endorsed by, or connected to Rockstar Games or Take-Two Interactive. Grand Theft Auto is a trademark of Take-Two Interactive Software, Inc.",
} as const;

export const categories = [
  { slug: "characters", label: "Characters", blurb: "The crooks, cops and hustlers of Leonida." },
  { slug: "locations", label: "Locations", blurb: "From Vice City neon to the Grassrivers swamps." },
  { slug: "vehicles", label: "Vehicles", blurb: "Everything on wheels, wings and hulls." },
  { slug: "gameplay", label: "Gameplay", blurb: "Mechanics, systems and what we know so far." },
  { slug: "news", label: "News", blurb: "Announcements, rumours and the full timeline." },
  { slug: "trailers", label: "Trailers", blurb: "Official trailers and launch footage." },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];
