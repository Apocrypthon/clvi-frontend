# CHANGELOG — clvi-frontend

Newest last. One entry per increment: date · what · why · files · verify result.

## 2026-09-03 — M0 bootstrap

**What.** Turned an empty repo into a green, deployable Vite `vanilla-ts` shell
with the full docs memory, and shipped an M0 boot page that renders
`clvi-frontend · <build timestamp>`.

**Why.** The relay has no memory between sessions; the docs are the memory and
the build is the proof. Nothing else can start until `npm run build` passes and
a stranger can read `STATE.md` and continue.

**Files.**

- `SEED.md` — the originating prompt, verbatim.
- `CLAUDE.md` — two lines pointing at LOOP then STATE.
- `docs/VISION.md`, `docs/ARCHITECTURE.md`, `docs/STATE.md`, `docs/LOOP.md`,
  this file.
- `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore` — scaffold.
  `strict: true` added (create-vite@9 omits it); `vite.config.ts` injects
  `__BUILD_TIME__`, declared in `src/env.d.ts`.
- `index.html` — `#app` mount plus the iPhone meta set: `viewport-fit=cover`,
  `theme-color`, `apple-mobile-web-app-*`.
- `src/main.ts`, `src/style.css`, `public/favicon.svg` — boot page and the dusk
  design tokens later screens draw from.
- `netlify.toml` — build `npm run build`, publish `dist`, Node 22, SPA fallback
  for deep links, `no-store` on `/config.json` (M3's runtime anon key).
- `scripts/smoke.mjs` + `npm run smoke` — the automated half of § Verify.
- `README.md` rewritten; it still described a Rails app.

**Decisions worth keeping.** Design tokens centralised in `style.css` so M1's
parallax samples the same ramp. Safe-area insets and `100dvh` from the start,
because retrofitting them to a finished layout is worse. SPA fallback added now
so M2's hash routing has nothing to discover.

`docs/STATE.md` § Verify was a list of things to *remember* to do, which across a
memoryless relay means a list of things that stop happening. `npm run smoke` runs
the mechanical half instead. It uses whichever Playwright is on the machine and
skips cleanly when there is none, so it adds no project dependency and cannot
break the Netlify build.

**Bug found and fixed by that check.** The wordmark at `clamp(2.5rem, 18vw, 5rem)`
plus `0.22em` tracking bled 8 px past a 390 px viewport. Dropped to
`clamp(2.25rem, 14vw, 4.5rem)`, which clears the padding box at 320 px too, and
added `overflow-x: clip` on `html, body` as a guard. Because clipping hides bleed
from `scrollWidth`, the check measures element rects rather than trusting it.

**Verify.** `npm run build` — PASS (exit 0, `dist/index.html` + `dist/assets/`).
`npm run smoke` — PASS, 4/4 (390 × 844 and 320 × 568, each with and without
`prefers-reduced-motion`): HTTP 200, console clean, build stamp well-formed, no
viewport bleed, no undersized touch target. The check was confirmed non-vacuous
by reintroducing the wordmark bug — it failed 4/4 and exited 1 — then reverted
and rebuilt green. Screenshot reviewed at 390 × 844.

**Note.** Pushed to `claude/strata-frontend-bootstrap-97ql5i`, not `loop` — this
session's harness pinned the branch (`docs/LOOP.md` § A1). Opening PR #1 exposed
a second thing: **`loop` does not exist on origin at all** (only `main` and this
branch), so the protocol's "push `origin loop`, Netlify branch-deploys it, a
human promotes to `main`" describes a setup nobody has built yet. PR #1 targets
`main`. Left for a human to decide — creating `loop` or retargeting the PR is a
deploy decision, not a code one. STATE.md and LOOP.md § A1 now say what actually
exists rather than what the protocol assumes.
