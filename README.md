# Serene Heights Nathia Gali

Website for Serene Heights Nathia Gali — Pakistan's first winter resort.
React + Vite, GSAP ScrollTrigger and Lenis for scroll motion, React Three Fiber for the 3D map and tower model.

## Run locally

```bash
npm install
npm run dev
```

Opens on http://localhost:5500.

## Build

```bash
npm run build
```

Output goes to `dist/`. The site is a single-page app with real URLs (`/about`, `/floor-plans`…),
so the host must serve `index.html` for every path. `vercel.json` already does this for Vercel.

## Where things live

- `src/home/` — homepage: loader, scroll-driven hero fly-over (`public/assets/hero/`), pinned tour
- `src/pages/` — inner pages
- `src/components/MapSection.tsx` — 3D terrain map (real elevation data in `public/data/galiyat-dem.bin`)
- `src/components/TowerModel.tsx` — 3D tower model; floors open the published plans in `public/assets/img/floors/`
- `src/lib/effects.ts` — site-wide scroll animations; `src/lib/widgets.ts` — gallery, calculator, floor plans, progress, enquiry form
- `src/styles/` — `site.css` (design) and `three.css` (map, towers, motion components)

Scripts call `node ./node_modules/...` directly because `npx`/`.bin` shims break on Windows
paths that contain `&`.
