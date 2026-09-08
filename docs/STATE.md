# STATE — clvi-frontend

**Milestone reached: M1 (title screen).** The repo is green and deployable.
Next increment: **M2 — State machine.**

> **Branch note.** The protocol in `SEED.md` assumes a `loop` branch that Netlify
> branch-deploys and a human promotes to `main`. **That branch does not exist on
> origin.** M0 shipped as PR #1 straight into `main`, and M1 is on
> `claude/strata-frontend-bootstrap-97ql5i` (restarted from `main`, since a merged
> PR cannot carry follow-up commits). Someone with the Netlify account has to
> decide whether to create `loop` and point a branch-deploy at it, or to run this
> repo off `main` and amend `SEED.md`; until then "live on the `loop` deploy" in
> the definition of done is unreachable as written. **No milestone is blocked by
> this — only the deploy target is.** See `docs/LOOP.md` § A1.

## Blockers

None.

## Where things are

    index.html          #app mount, iPhone meta (viewport-fit, safe areas, theme)
    vite.config.ts      injects __BUILD_TIME__ at build time
    src/main.ts         composes the title screen: wordmark, tagline, CTA, stamp
    src/scene.ts        the parallax vista — mountScene(stage), no rAF loop
    src/env.d.ts        declares __BUILD_TIME__
    src/style.css       dusk tokens (--dusk-0..4, --neon, --sand, --tap) + base
    public/favicon.svg  strata bands mark
    scripts/smoke.mjs   automated half of § Verify (`npm run smoke`)

The title screen is two stacked pieces: `.stage` (fixed, clipped, holds the sky
plus three `canvas.layer`s) and `.screen` (the content above it). `mountScene`
returns a handle with `destroy()` so M4's pan-down can tear the vista down.

**The CTA's seam:** tapping "Begin" dispatches `strata:begin` on `document`. It
deliberately routes nowhere — routing is M2's increment. Bind to that event
rather than rewiring the button.
    netlify.toml        build `npm run build`, publish `dist`, SPA fallback
    docs/               VISION · ARCHITECTURE · STATE · CHANGELOG · LOOP
    SEED.md             the originating prompt, verbatim — do not edit

Runtime dependencies: **0**. Dev: `typescript`, `vite`. Read
`docs/ARCHITECTURE.md` before adding any.

## Run it

    npm install
    npm run dev      # http://localhost:5173
    npm run build    # tsc && vite build -> dist/
    npm run smoke    # build first: drives dist/ in an iPhone-profile Chromium
    npm run preview  # serve dist/ locally

## Verify

Smoke checks for **every** increment. All must pass before you ship.

    npm run build && npm run smoke

1. `npm run build` exits 0 and writes `dist/index.html` + `dist/assets/`.
2. `npm run smoke` exits 0. It serves `dist/` and drives it in Chromium under an
   iPhone profile at 390 × 844 and 320 × 568, each with and without
   `prefers-reduced-motion: reduce`, asserting: HTTP 200, no console
   errors/warnings, no page error, no failed request, a well-formed build stamp,
   the wordmark and a CTA present, nothing bleeding past the viewport (layers
   marked `data-overflow="intentional"` are exempt — they are two tiles wide by
   design), no touch target under 44 px, and for each of the three parallax
   layers that it drew something and tiles seamlessly. Then one `motion` pass
   checks the pan actually moves, that nearer layers outrun farther ones, that a
   hidden page freezes it, and that the CTA dispatches `strata:begin`.
   `SMOKE_SHOTS=/some/dir npm run smoke` also writes screenshots.
   It **skips** (exit 0) if Playwright is not on the machine — then do 3–6 by
   hand. Extend it whenever you add a screen; a check that cannot fail is worth
   nothing, so confirm a new assertion fails before you trust it.

   Comparing canvas pixels, compare them **premultiplied by alpha**. Raw RGB in a
   near-transparent pixel is dithering noise: at alpha 5, RGB 51 and RGB 0 are
   both "nothing", and comparing them raw fails loudly for no visible reason.

Still by eye, because the script cannot judge them:

3. The build stamp is from *this* build, not a stale one.
4. Nothing sits under the notch or the home indicator on a real device.
5. It looks right — the dusk palette reads warm at the horizon, cool above.
6. Motion is smooth in one hand and the phone stays cool.
7. No seam slides past. The tile junction is the only place a wrapping mistake
   shows; force it into view with
   `.layer { animation: none !important; transform: translate3d(-25%,0,0) !important }`
   and look for a hard vertical cut.

From M2 onward also check: back gesture / browser Back returns to the previous
screen without a blank frame, and a reload restores the same screen from the
hash.

## Next

Ordered. Take the first unfinished item, whole (`docs/LOOP.md` § A2).

- [x] **M1 — Title screen.** Done. Sky gradient, distant towers, neon haze and
      foreground desert scrub, panning at three rates. No animation loop — see
      ARCHITECTURE § Animation before changing anything in `src/scene.ts`.
- [ ] **M2 — State machine.** `BOOT → TITLE → {NEW, RETURNING, SETTINGS}`.
      Hash-based routing, back gestures safe, state persisted to `localStorage`
      under `strata.*`. Parse saves defensively (ARCHITECTURE § Persistence).
      Bind to the `strata:begin` event the CTA already dispatches. The vista
      should survive the transition rather than remount — `mountScene` returns a
      `destroy()` handle, but TITLE → NEW wants the same sky, not a new one.
- [ ] **M3 — Wallet login.** "Wallet" = custodial Guardian account. Email OTP via
      Supabase JS; public anon key read at runtime from `/config.json` (never
      committed). On success derive `displayId` = `GRD-` + first 6 of
      `sha256(userId)`. Offline/dev fallback: local guest wallet, clearly
      labelled as such in the UI.
- [ ] **M4 — Character creation, pan-down.** Camera pans DOWN from the title
      vista to street level where the silhouette stands. Name field + Holi
      palette pick (8 pigment swatches) + 3 silhouettes. Save to `localStorage`
      and POST to ledger `/account` when available. The chosen palette becomes
      the player's bloom colour on the map.
- [ ] **M5 — Returning: save-init pan-down.** Detect an existing save → pan down
      to a placeholder of their last restored cell (`cellId` from the save), name
      and wallet id overlaid. Re-arrival, not a menu.
- [ ] **M6 — Settings.** Wallet id, sign-out, sound toggle stub, and an
      **Energy** readout: cumulative est. kWh from ledger `/audit/latest`
      (mock at `public/mock/audit.json` until live). Then polish every transition
      to 60 fps.

## Definition of done for this relay

M1–M4 live on the `loop` Netlify deploy, passing items 1–3 and 7 of the
clvi-testing acceptance checklist.
