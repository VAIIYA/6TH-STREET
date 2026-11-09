# 6th Street

An unofficial fan wiki for Grand Theft Auto VI, built with Next.js (App Router), Tailwind CSS v4 and MDX.

> Unofficial fan site. Not affiliated with Rockstar Games or Take-Two Interactive.

## Develop

```bash
npm install
npm run dev
```

## Live feed (news, rumors, videos)

`scripts/update-feed.mjs` collects GTA 6 headlines from public feeds (Google News, Rockstar's YouTube channels, r/GTA6) and the Wikipedia lead. It writes `content/feed/items.json` and `content/feed/wikipedia.json`. Only headlines, links and short excerpts are stored. Each item links to its original source.

- `.github/workflows/update-feed.yml` runs it every hour and commits changes to `main`. Vercel deploys each commit.
- Run it locally with `npm run feed:update`.
- Rumors are labelled "unconfirmed" by a keyword heuristic. Check the source before you rely on one.

## Auto-written stories

`scripts/generate-articles.mjs` runs right after the feed update. It groups headlines about the same event, and for stories covered by at least two outlets it asks Claude to write a short, fully paraphrased article. The result is an MDX file in `content/news/` (frontmatter `auto: true`) with a sources box. The model may only use facts from the supplied headlines and snippets, labels rumors as unconfirmed, and can decline a story.

- Add the repository secret `ANTHROPIC_API_KEY`. Without it the step is skipped.
- Limits (env, with defaults): `MAX_NEW_PER_RUN=3`, `MAX_PER_DAY=12`, `MIN_SOURCES=2`, `LOOKBACK_HOURS=72`, `ANTHROPIC_MODEL=claude-sonnet-5-5`.
- The workflow runs `npm run build` before committing and discards new articles if the build fails.
- Preview the prompts without calling the API: `node scripts/generate-articles.mjs --dry-run`.
- `content/feed/articles.json` remembers which headlines were written up or rejected.

## Add or edit an article

Articles are MDX files in `content/<category>/`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Environment variables

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (sitemap, metadata) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher id (`ca-pub-…`). Leave empty for no ads. |

## License

Code: MIT. Wiki text: CC BY-SA 4.0.
