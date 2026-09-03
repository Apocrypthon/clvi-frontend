# STATE — clvi-frontend

**Milestone reached: M0 (bootstrap).** The repo is green and deployable.
Next increment: **M1 — Title screen.**

> **Branch note.** The protocol in `SEED.md` assumes a `loop` branch that Netlify
> branch-deploys and a human promotes to `main`. **As of this commit that branch
> does not exist on origin** — the only branches are `main` and the harness-pinned
> `claude/strata-frontend-bootstrap-97ql5i`, where M0 lives. PR #1 targets `main`
> directly. Someone with the Netlify account has to decide whether to create
> `loop` and point the branch-deploy at it, or to run this repo off `main`; until
> then "live on the `loop` deploy" in the definition of done is unreachable as
> written. Nothing about M1–M6 is blocked by this — only the deploy target is.
> See `docs/LOOP.md` § A1.

## Blockers

None.

## Where things are

    index.html          #app mount, iPhone meta (viewport-fit, safe areas, theme)
    vite.config.ts      injects __BUILD_TIME__ at build time
    src/main.ts         M0 boot page — replace its body for M1
    src/env.d.ts        declares __BUILD_TIME__
    src/style.css       dusk tokens (--dusk-0..4, --neon, --sand, --tap) + base
    public/favicon.svg  strata bands mark
    scripts/smoke.mjs   automated half of § Verify (`npm run smoke`)
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
   nothing bleeding past the viewport, and no touch target under 44 px.
   `SMOKE_SHOTS=/some/dir npm run smoke` also writes screenshots.
   It **skips** (exit 0) if Playwright is not on the machine — then do 3–6 by
   hand. Extend it whenever you add a screen; a check that cannot fail is worth
   nothing, so confirm a new assertion fails before you trust it.

Still by eye, because the script cannot judge them:

3. The build stamp is from *this* build, not a stale one.
4. Nothing sits under the notch or the home indicator on a real device.
5. It looks right — the dusk palette reads warm at the horizon, cool above.
6. Motion is smooth in one hand and the phone stays cool.

From M2 onward also check: back gesture / browser Back returns to the previous
screen without a blank frame, and a reload restores the same screen from the
hash.

## Next

Ordered. Take the first unfinished item, whole (`docs/LOOP.md` § A2).

- [ ] **M1 — Title screen.** Layered Paradise-at-dusk skyline with a slow
      continuous lateral pan: sky gradient, distant towers, neon haze, foreground
      desert scrub. "STRATA" wordmark, single CTA. Canvas or SVG — see
      ARCHITECTURE § North star for why not to build an abstraction. Must run
      cool on a phone: animate `transform`/`opacity` only, cap the work per
      frame, pause when the tab is hidden (`visibilitychange`), and cut the pan
      under `prefers-reduced-motion`.
- [ ] **M2 — State machine.** `BOOT → TITLE → {NEW, RETURNING, SETTINGS}`.
      Hash-based routing, back gestures safe, state persisted to `localStorage`
      under `strata.*`. Parse saves defensively (ARCHITECTURE § Persistence).
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
