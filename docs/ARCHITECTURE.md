# ARCHITECTURE — clvi-frontend

## Stack (frozen)

- **TypeScript + Vite (`vanilla-ts`).** No framework. No runtime dependencies
  unless `STATE.md` argues for one and records the argument.
- **Output is a static `dist/`** published by Netlify (`netlify.toml`).
- `npm run build` = `tsc && vite build`. Type errors fail the build on purpose.
- `strict: true` is on in `tsconfig.json` (the create-vite template omits it).

Current dependency count: **0 runtime, 2 dev** (`typescript`, `vite`). Keep it
that way. M3's Supabase client is the one anticipated exception — see below.

## Target device

An **iPhone on Safari**, held in one hand. Everything follows from that:

- `viewport-fit=cover` plus `env(safe-area-inset-*)` padding — the notch and the
  home indicator are not usable space.
- `100dvh`, never `100vh`: Safari's collapsing toolbars make `vh` lie.
- Minimum touch target **44 px** (`--tap`). No `:hover`-only affordances, no
  right-click, no keyboard-only paths.
- 60 fps transitions or degrade gracefully. Animate `transform` and `opacity`
  only; anything that triggers layout is a bug on a phone.
- Honour `prefers-reduced-motion` — the pan-downs (M4, M5) must have a cut.

## Layout

    index.html          single mount point (#app), all iPhone meta tags
    vite.config.ts      injects __BUILD_TIME__ (declared in src/env.d.ts)
    netlify.toml        build/publish, SPA fallback, headers
    public/             copied verbatim to dist/ (favicon, later mock/audit.json)
    src/main.ts         entry; composes the title screen
    src/scene.ts        the parallax vista (canvas, no animation loop)
    src/style.css       design tokens + base styles
    scripts/smoke.mjs   headless iPhone smoke check; no project deps
    docs/               the memory: VISION, ARCHITECTURE, STATE, CHANGELOG, LOOP

## Design tokens

The dusk ramp lives in `src/style.css` as custom properties
(`--dusk-0` horizon → `--dusk-4` zenith, plus `--neon`, `--sand`). Every screen
pulls from these; the M1 parallax layers are the same ramp sampled at different
heights. Do not hard-code colours in components.

## Animation: no loop

The parallax pan has no `requestAnimationFrame` loop. Each layer is painted once
into a canvas holding two copies of a seamlessly tileable strip; the pan is a CSS
`transform` animation from `0` to `-50%`, which the compositor runs off the main
thread. Consequences worth preserving:

- A busy main thread cannot stutter the pan, and idle CPU is genuinely idle.
- Repainting happens only when the stage *width* changes. Height changes are
  ignored on purpose — iOS Safari fires `resize` constantly as its toolbars
  collapse, and redrawing on that would churn for nothing.
- `devicePixelRatio` is capped at 2 (`DPR_CAP`). iPhones report 3; on wide
  silhouettes the third pixel is invisible and costs 2.25x the texture memory.

Two rules keep the loop seamless. Any element that crosses a tile edge must be
painted again a tile-width over — **in both directions**, since blooms anchored
at `centre - radius` routinely start left of zero. And every random draw must
happen *before* that wrapping, or the wrapped copy differs from the original.
The tile is painted once offscreen and blitted twice, so the two copies are
bit-identical; painting the halves separately makes them differ by a dithering
step, because gradient dithering depends on absolute x.

## Persistence

All local state is namespaced `strata.*` in `localStorage` (M2 onward). Treat it
as untrusted input on read: a user can edit it, and a save written by an older
build may lack fields. Parse defensively, never `JSON.parse` straight into a
typed variable without validating.

## Runtime configuration (M3)

The Supabase **public anon key** is not a secret, but it is deploy-specific, so
it is not committed. The deploy provides `/config.json`; the app fetches it at
runtime and degrades to a clearly-labelled local guest wallet when it is absent
or unreachable. `netlify.toml` marks that path `Cache-Control: no-store`.

**No secrets in this repo, ever.** Service-role keys, signing keys, and ledger
credentials belong to the backend, never to a static bundle.

## Contracts v1 (frozen; change only via `clvi-architecture`)

    MapEvent    { cellId, ts, kind:"restored" }
    AuditReport { rangeStart, rangeEnd, entryCount, totalEstKwh, chainOk,
                  tokenCount, signature }
    Account     { playerId, displayId, palette, name, createdAt }

`displayId` is `GRD-` + the first 6 hex chars of `sha256(userId)`, computed with
`crypto.subtle.digest` (available on Safari over HTTPS and on localhost).

## North star — not to be built here

The shipping client is planned as **Godot / WebGL2**, against a **Rust +
PostgreSQL** authoritative backend with **Nakama** for realtime, per the CLVI
overview. This repo is the shell that proves the feel and the identity flow
first. Consequences for decisions made here:

- Keep game logic thin and portable; the shell's job is presentation and
  identity, not simulation.
- The Contracts above are the seam with the backend. Honour them exactly so the
  Godot client can be dropped in behind the same shapes.
- Do not invest in a JS rendering abstraction that Godot will throw away. Canvas
  or SVG drawn directly is correct for M1.
