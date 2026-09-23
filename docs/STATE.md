# STATE — clvi-frontend

**Milestone reached: M2, plus M3a (the sign-in provider chooser).** The repo is
green and deployable. Next increment: **M3b — wire one provider.**

> **Open question for a human, not code.** `SEED.md` defines "wallet" as a
> **custodial Guardian account** reached by email OTP. The chooser now also
> offers Coinbase, MetaMask, Robinhood and Cash App, which point at
> self-custody or third-party identity instead. That is a product direction
> change and it belongs in `clvi-architecture`, since `Account` in Contracts v1
> has no field for an external identity. Nothing is wired, so nothing is
> committed yet.

> **Branch note.** The protocol in `SEED.md` assumes a `loop` branch that Netlify
> branch-deploys and a human promotes to `main`. **That branch does not exist on
> origin.** M0 shipped as PR #1 straight into `main`; M1 and M2 are on
> `claude/strata-frontend-bootstrap-97ql5i` and are **not yet merged**. Someone
> with the Netlify account has to
> decide whether to create `loop` and point a branch-deploy at it, or to run this
> repo off `main` and amend `SEED.md`; until then "live on the `loop` deploy" in
> the definition of done is unreachable as written. **No milestone is blocked by
> this — only the deploy target is.** See `docs/LOOP.md` § A1.

## Blockers

None.

## Where things are

    index.html          #app mount, iPhone meta (viewport-fit, safe areas, theme)
    vite.config.ts      injects __BUILD_TIME__ at build time
    src/main.ts         composition root — mounts the vista, swaps screens
    src/router.ts       state machine + hash routing; createRouter({ resolve })
    src/store.ts        validated localStorage under `strata.*`; readSave()
    src/screens.ts      renderScreen(name, ctx) — one function per screen
    src/connectors.ts   sign-in providers: marks, brand colours, real status
    src/scene.ts        the parallax vista — mountScene(stage), no rAF loop
    src/env.d.ts        declares __BUILD_TIME__
    src/style.css       dusk tokens (--dusk-0..4, --neon, --sand, --tap) + base
    public/favicon.svg  strata bands mark
    scripts/smoke.mjs   automated half of § Verify (`npm run smoke`)
    netlify.toml        build `npm run build`, publish `dist`, SPA fallback
    docs/               VISION · ARCHITECTURE · STATE · CHANGELOG · LOOP
    SEED.md             the originating prompt, verbatim — do not edit

Runtime dependencies: **0**. Dev: `typescript`, `vite`. Read
`docs/ARCHITECTURE.md` before adding any.

## How a screen works

Three stacked pieces, and only the middle one changes:

    .stage    fixed, clipped, holds the sky + three canvas.layer — mounted ONCE
    .screen   bare host; main.ts swaps one .view into it per route
    .view     the current screen's root, rendered by src/screens.ts

`main.ts` mounts the vista once and never remounts it — a remount restarts the
pan and repaints three canvases. `mountScene` still returns `destroy()` for M4's
pan-down, but a route change must not call it.

Routes: `#/` title · `#/new` · `#/returning` · `#/settings`. Unknown hashes and
guarded redirects are rewritten with REPLACE so Back cannot return into them.
Read `docs/ARCHITECTURE.md` § Routing before touching `src/router.ts` — every
rule in there exists because getting it wrong breaks the back gesture silently.

**The CTA's seam:** tapping the title CTA dispatches `strata:begin` on
`document`; `main.ts` listens and routes to NEW or RETURNING depending on
`readSave()`. Keep that split — the button should stay ignorant of the machine.

**The save is the branch.** `readSave()` returning non-null is what makes a
player "returning": the CTA reads *Continue*, and `#/returning` stops
redirecting to `#/new`. Nothing in the app writes a save yet — **M4 is the first
writer**. Until then, exercise the branch with:

    localStorage.setItem('strata.save', JSON.stringify(
      { name: 'Vela', createdAt: '2026-09-01T00:00:00.000Z' }))

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
   Then a `routing` pass drives the state machine: BOOT normalises to `#/`, the
   CTA reaches NEW, Back returns to TITLE, a reload restores the screen from the
   hash, an unknown hash and a guarded `#/returning` are both rewritten in place,
   in-app Back from a deep link lands on TITLE, a save flips the CTA to
   *Continue*, and six malformed saves each read as "no save". A `connectors`
   pass then checks all five provider buttons render with a mark and a label,
   clear 44 px, carry the "no API" flag exactly when their status says so, each
   produce their own distinct status note, fire `strata:connect` once per tap —
   and that the screen contains no password input, ever. It also asserts
   the vista is never remounted and that the screen host never goes empty mid-swap
   (a blank frame). `SMOKE_SHOTS=/some/dir npm run smoke` also writes screenshots.
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

8. On a real device, the swipe-back gesture (not just the toolbar Back) returns
   to the previous screen without a flash. The smoke check proves the DOM never
   empties; only a device shows you the paint.

## Next

Ordered. Take the first unfinished item, whole (`docs/LOOP.md` § A2).

- [x] **M1 — Title screen.** Done. Sky gradient, distant towers, neon haze and
      foreground desert scrub, panning at three rates. No animation loop — see
      ARCHITECTURE § Animation before changing anything in `src/scene.ts`.
- [x] **M2 — State machine.** Done. Hash routing, guarded transitions, back
      gesture safe, `strata.*` storage validated on read. NEW / RETURNING /
      SETTINGS are honest scaffolds that name the milestone filling them in.
- [x] **M3a — Sign-in provider chooser.** Done. Five buttons on the NEW screen
      (Coinbase, MetaMask, Robinhood, Cash App, email). **None are wired.**
      Tapping one dispatches `strata:connect` with the provider id and shows
      that provider's real status. See ARCHITECTURE § Sign-in providers for
      what each one can actually be built against — two of them, nothing.
- [ ] **M3b — Wire one provider.** Email OTP via Supabase JS is the route the
      seed specifies: public anon key read at runtime from `/config.json` (never
      committed), then derive `displayId` = `GRD-` + first 6 of
      `sha256(userId)` via `crypto.subtle.digest`. Offline/dev fallback: local
      guest wallet, clearly labelled in the UI. Bind to `strata:connect` rather
      than rewiring the buttons. The Supabase client would be this repo's first
      runtime dependency — ARCHITECTURE says argue for it here before adding it.
      **Resolve the direction question at the top of this file first**: if the
      answer is self-custody, MetaMask (EIP-1193 + EIP-4361) is the cheaper
      first wire and needs no anon key, but it does need a backend to verify
      the signature, which this repo does not have.
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
