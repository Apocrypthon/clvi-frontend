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
    src/main.ts         composition root; mounts the vista, swaps screens
    src/router.ts       the state machine + hash routing
    src/store.ts        validated localStorage access under `strata.*`
    src/screens.ts      one render function per screen
    src/connectors.ts   sign-in provider registry (marks, brand, status)
    src/scene.ts        the parallax vista (canvas, no animation loop)
    src/style.css       design tokens + base styles
    scripts/smoke.mjs   headless iPhone smoke check; no project deps
    docs/               the memory: VISION, ARCHITECTURE, STATE, CHANGELOG, LOOP

## Design tokens

The dusk ramp lives in `src/style.css` as custom properties
(`--dusk-0` horizon → `--dusk-4` zenith, plus `--neon`, `--sand`). Every screen
pulls from these; the M1 parallax layers are the same ramp sampled at different
heights. Do not hard-code colours in components.

## Routing and the back gesture

`BOOT → TITLE → { NEW, RETURNING, SETTINGS }`, hash-based so every route works
on a static host. `src/router.ts` navigates with `pushState`/`replaceState`
rather than assigning `location.hash`, because that is the only way to control
whether a transition leaves a history entry — which is what makes Back behave.

- **Normalising a route uses REPLACE.** An unknown hash, or one a guard
  redirects, must not stay in history; a push there means Back bounces the
  player straight into it again.
- **Each entry carries its depth** in `history.state`. An in-app Back control
  needs to know whether there is an app entry behind it or whether Back would
  walk off the site entirely — a deep link has nothing behind it.
- **Guards must be idempotent.** A redirect re-runs `resolve`, so a guard that
  keeps changing its mind loops forever.
- **Build the next view before removing the current one.** `replaceChildren`
  with a ready element swaps in a single mutation; emptying first and appending
  after leaves a frame with nothing on screen, which the back gesture makes very
  visible.
- **The vista is mounted once and never remounted.** Screens swap above it. A
  remount would restart the pan and repaint three canvases on every transition.

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

## Sign-in providers

`src/connectors.ts` is the registry behind the NEW screen. Two rules are not
negotiable:

- **This app never collects a provider's password or seed phrase.** Real
  sign-in either redirects to the provider (OAuth) or asks a wallet extension to
  sign a challenge (EIP-1193 / EIP-4361). A form here that asked for a Coinbase
  password would be a phishing page regardless of intent. `npm run smoke`
  asserts there is no password input on the screen.
- **Each button's `status` must stay true.** `planned` means a documented
  integration exists and is unbuilt; `unavailable` means there is nothing to
  build against. Tapping a button shows that provider's own note, so a player
  is never left guessing whether they did something wrong.

Provider reality as of M3 — **verify before committing engineering time**:

| Provider | Group | What exists |
| --- | --- | --- |
| Coinbase | wallet | Two different things: OAuth for a coinbase.com account, or the Wallet SDK for self-custody. Pick one. |
| MetaMask | wallet | EIP-1193 in-page, then Sign-In With Ethereum (EIP-4361). Signature verification needs a backend. |
| Apple | account | Supabase OAuth provider. Apple ships exact button artwork and forbids altering it. |
| SMS | account | Supabase phone OTP, but needs a paid SMS provider and a rate limit or SMS-pumping fraud will bill you. |
| Email | account | Supabase OTP, per the seed. The route the milestone actually specifies. |

Two providers were offered and then removed once checked: **Robinhood**
publishes no third-party sign-in (their API is key-based for your own account),
and **Cash App Pay** is a payment method via Square, not an identity provider.
Recorded so nobody re-adds them on the assumption they were simply missed.

If this shell is ever wrapped for the App Store, Apple's review guidelines
require an equivalent privacy-preserving login wherever third-party logins are
offered — Sign in with Apple satisfies that. It does not apply to a plain web
build, and the rule should be re-read before anyone relies on it.

The marks in `connectors.ts` are **simplified placeholders drawn in-repo**, not
official logos. Before any public launch, replace them with each company's
official asset and follow their brand guidelines — several forbid redrawing the
mark, and most dictate button wording and clear space.

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

The shipping client is planned as **Godot / Rust / WASM**, against a **Rust +
PostgreSQL** authoritative backend with **Nakama** for realtime, per the CLVI
overview. This repo is the shell that proves the feel and the identity flow
first.

Two gameplay loops it will carry — recorded here so the shell does not design
against the wrong shape, **not to be built in this repo**:

- **Modular Pedestrian (micro-loop)** — moment-to-moment humour, physics
  mishaps, puzzle-solving. The texture of a single outing on foot.
- **CLEAN ASCENT (macro-loop)** — resource scavenging, extraction risk, and
  seasonal vertical resets. The reason to come back, and the reason the map
  moves upward through the strata over a season.

Consequences for decisions made here:

- Keep game logic thin and portable; the shell's job is presentation and
  identity, not simulation.
- The Contracts above are the seam with the backend. Honour them exactly so the
  Godot client can be dropped in behind the same shapes.
- Do not invest in a JS rendering abstraction that Godot will throw away. Canvas
  or SVG drawn directly is correct for M1.
- The shell owns identity and arrival, never the loops above. If a screen here
  starts modelling scavenging, extraction risk or seasonal resets, it has
  wandered out of this repo's slice.
