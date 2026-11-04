# Kanav Khera · The Portfolio Depot

A one-page portfolio. A crane claw rides a rail above a pile of 3D shipping containers; click a container (or a nav link) and the claw puts back the one it holds, fetches the new one, lifts it to the top and swings its doors open to show that section.

Built with Next.js 16 (App Router), React 19 and plain CSS. No animation library: the containers are CSS 3D boxes, and the motion runs on registered CSS custom properties.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # layout maths (node:test, no extra packages)
npm run lint
npm run build && npm start
```

## Where things live

| Path | What it is |
|---|---|
| `components/sections.tsx` | The text inside every container, plus your email address |
| `components/containers.ts` | The nine containers: colour, door label, tag, pile position, which section they hold; and the nav links |
| `components/DeckCarousel.tsx` | The ON DECK screenshots (list at the top of the file) |
| `components/StatsBoard.tsx` | The split-flap stats and their screen-reader text |
| `components/Depot.tsx` | Page layout: nav, stage, rail and claw |
| `components/ContainerBox.tsx` | One 3D container: faces, doors, inside wall |
| `lib/crane.ts` | The claw engine: put back, travel, drop, grip, lift, open; queues clicks; Escape goes home |
| `lib/geometry.ts` | Pure sizing and positioning maths (tested in `tests/geometry.test.ts`) |
| `app/globals.css` | All styles, including the `@property` registrations the animation depends on |
| `public/screens/` | Screenshots shown in ON DECK |

## Common changes

- **Update the resume:** replace `public/resume/Kanav-Khera-Resume.pdf` (keep the name, or change `RESUME` in `components/sections.tsx`). The nav button and the SAY HELLO button are plain `download` links, so the browser saves the file directly.
- **Add a screenshot:** drop a `.webp` in `public/screens/` and add an entry to `SLIDES` in `components/DeckCarousel.tsx`. Use `frame: 'phone'` for app screens and `frame: 'browser'` for websites.
- **Edit a section:** change its component in `components/sections.tsx`. Headings take a `title` and an `accent` (the last word, set in italic serif).
- **Add or reorder a container:** edit `CONTAINERS` in `components/containers.ts`. Give it a `pile` and `pilePhone` position; within a row, keep `y` creeping down from left to right so a box never covers its right-hand neighbour's label (a test checks this). Update the copies of the pile tables in `tests/geometry.test.ts` too.
- **Fonts:** the design calls for Clash Display and Cabinet Grotesk (Fontshare). The page uses them when they are installed and otherwise falls back to Bricolage Grotesque and Figtree from `next/font`. To ship the real faces, add them with `next/font/local` and point `--font-display` / `--font-body` at them in `app/layout.tsx`.

## Accessibility

Every container front is a real button with an `aria-label`; closed containers are `inert`; focus moves to the section heading after a container opens; Escape brings back the PORTFOLIO container; `prefers-reduced-motion` skips the animation and shows each step immediately.
