# Contributing

1. Add a file to `content/characters|locations|vehicles|gameplay|news/<slug>.mdx`.
2. Start it with frontmatter:

```yaml
---
title: Example
summary: One sentence shown on cards and in search.
updated: "2026-11-01"
featured: false
infobox:
  Key: Value
related:
  - /locations/vice-city
---
```

3. Use `##` and `###` headings; a table of contents is generated automatically.
4. Only state what is officially confirmed. Label rumours clearly as unconfirmed.
5. Run `npm run lint && npm run build` before opening a pull request. The build fails on invalid frontmatter.
