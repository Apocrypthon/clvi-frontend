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

## 2026-09-08 — M1 title screen

**What.** The Paradise-at-dusk vista: sky gradient, distant towers with lit
windows and masts, neon haze pooling over the strip, foreground desert scrub —
panning continuously at three different rates. "STRATA" wordmark, one CTA
("Begin"), build stamp kept as a footer.

**Why.** M1, the first unmet milestone. It is the whole first impression, and
the seed is explicit that it has to run cool in one hand.

**How, and why it matters.** There is **no animation loop**. Each layer is
painted once into a canvas holding two copies of a tileable strip; the pan is a
CSS `transform` from 0 to -50% that the compositor owns. The main thread does
nothing per frame, so a busy tab cannot stutter the pan. Repaint happens only on
a *width* change — iOS Safari fires `resize` constantly as its toolbars collapse,
and honouring that would churn for nothing. `devicePixelRatio` is capped at 2;
iPhones report 3 and the third pixel is invisible on silhouettes.

**Files.** `src/scene.ts` (new), `src/main.ts`, `src/style.css`,
`scripts/smoke.mjs`, `docs/ARCHITECTURE.md`, `docs/STATE.md`.

**Three bugs found by testing, not by reading.**

1. *Seam, both directions.* The wrap helper only re-drew items overflowing the
   **right** tile edge. Haze blooms are anchored at `centre - radius` and
   routinely start left of zero, so their wrapped copy was never drawn and the
   tile's right edge was missing light. Now covers every offset that touches the
   tile.
2. *Seam, from randomness.* `rand()` was being called *inside* the wrap callback
   for tower windows and haze alpha, so the wrapped copy differed from the
   original. All random draws now happen before wrapping.
3. *Cascade.* `.wordmark { margin-top: 12vh }` sat above the base
   `.wordmark { margin: 0 }`, which silently reclaimed it and jammed the wordmark
   into the notch. Folded into one rule.

**And one bug in the test, not the code.** The seam check compared raw RGB and
failed 83 rows on the haze layer. Alpha matched exactly on every one of them —
the differences were gradient dithering in near-transparent pixels, where RGB 51
at alpha 5 and RGB 0 at alpha 5 are both "nothing". It now compares premultiplied
values. Separately, painting the two tile halves independently made them differ
by a dithering step, because dithering depends on absolute x; the tile is now
painted once offscreen and blitted twice, which is also half the paint work.

**Verify.** `npm run build` — PASS. `npm run smoke` — PASS, 4/4 viewport
configurations plus the `motion` pass. Measured pan over 4 s: towers -6.55 px,
haze -10.49 px, scrub -18.51 px, matching the configured 240 s / 150 s / 85 s.
Hidden page: < 0.1 px drift, `animation-play-state: paused`. Each new assertion
confirmed non-vacuous by breaking it first — removing the pan, inverting the
parallax order, and blanking a layer each failed as expected before being
reverted. Screenshots reviewed at 390 × 844, at the tile junction (forced to
`translate3d(-25%)`, no visible cut), and in landscape.
