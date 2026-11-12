# Serene Heights Nathia Gali

Website for Serene Heights Nathia Gali — Pakistan's first winter resort.
React + Vite, GSAP ScrollTrigger and Lenis for scroll motion, React Three Fiber for the 3D map and tower model.

## Run locally

```bash
npm install
npm run dev
```

Opens on http://localhost:5500/serene-heights-nathiagali.

## Served inside the Serene Heights Group site

The site lives at `/serene-heights-nathiagali` on the Serene Heights Group domain (Next.js Multi-Zones:
the group site forwards that path to this deployment when its `NATHIAGALI_ORIGIN` is set). So it is
built with that base path everywhere:

- `vite.config.ts` sets `base`; `VITE_BASE_PATH=/` builds it for a domain root instead.
- Public files are referenced through `BASE` (`src/lib/base.ts`), e.g. `` `${BASE}assets/img/…` ``.
- Routes are still written as `/about`, `/floor-plans`…; the router adds and strips the base path.
- On its own Vercel deployment `/` redirects to `/serene-heights-nathiagali`.

## Build

```bash
npm run build
```

Output goes to `dist/serene-heights-nathiagali/`. The site is a single-page app with real URLs
(`/serene-heights-nathiagali/about`…), so the host must serve `index.html` for every path under it.
`vercel.json` already does this for Vercel.

## Where things live

- `src/home/` — homepage: loader, scroll-driven hero fly-over (`public/assets/hero/`), pinned tour
- `src/pages/` — inner pages
- `src/components/MapSection.tsx` — 3D terrain map (real elevation data in `public/data/galiyat-dem.bin`)
- `src/components/TowerModel.tsx` — 3D tower model; floors open the published plans in `public/assets/img/floors/`
- `src/lib/effects.ts` — site-wide scroll animations; `src/lib/widgets.ts` — gallery, calculator, floor plans, progress, enquiry form
- `src/styles/` — `site.css` (design) and `three.css` (map, towers, motion components)

Scripts call `node ./node_modules/...` directly because `npx`/`.bin` shims break on Windows
paths that contain `&`.
