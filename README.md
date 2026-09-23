# ByteBriefs

Data & AI in 60 seconds — an Inshorts-style vertical swipe feed for curated
Data & Analytics news. Pure HTML/CSS/JS, no build step.

## Deploy to Cloudflare Pages (via GitHub)

1. Push this folder's contents to a new GitHub repo (root of the repo, not a subfolder).
2. In Cloudflare Pages → **Create a project** → **Connect to Git** → pick the repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/`
4. Deploy. Cloudflare will serve `index.html` at the root automatically.

## Data source

`js/app.js` fetches the published Google Sheet CSV at the URL in
`SHEET_CSV_URL`. If that request fails (offline, sheet unpublished, CORS
issue), the app falls back to:
1. the last successful fetch, cached in `localStorage`, then
2. the bundled sample data in `js/mock-data.js`.

Sheet columns expected, in order: `Date Fetched`, `Category`, `Headline`,
`Image URL`, `Preview`, `Article Link`. A row's `Image URL` cell may contain
the literal text `No Image Available`, which the app treats as "no image"
and renders a placeholder instead.

## Local preview

Any static file server works, e.g.:

```
npx serve .
```

Opening `index.html` directly via `file://` will mostly work, but the
service worker and `fetch()` to Google Sheets both require `http(s)://`,
so a local server is recommended.

## Customizing

- Feedback address, category list, and the sheet URL are constants at the
  top of `js/app.js`.
- Colors and type are CSS variables at the top of `css/styles.css`.
- Regenerate `assets/icon-192.png` / `icon-512.png` if you want a different
  app icon — they're plain PNGs, no special tooling required.
