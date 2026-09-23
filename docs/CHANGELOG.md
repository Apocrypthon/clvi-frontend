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

## 2026-09-09 — M2 state machine

**What.** `BOOT → TITLE → { NEW, RETURNING, SETTINGS }` over hash routing, with
the back gesture safe, and `strata.*` localStorage validated on every read. The
title CTA now branches: *Begin* → NEW with no save, *Continue* → RETURNING with
one. NEW / RETURNING / SETTINGS are honest scaffolds naming the milestone that
fills them in, not fake controls.

**Why.** M2, the first unmet milestone. It is the spine every later screen hangs
off: M3 lands in NEW, M5 in RETURNING, M6 in SETTINGS.

**Files.** `src/router.ts`, `src/store.ts`, `src/screens.ts` (new);
`src/main.ts` reduced to a composition root; `src/style.css`,
`scripts/smoke.mjs`, `docs/ARCHITECTURE.md`, `docs/STATE.md`.

**Decisions worth keeping.**

- Navigation goes through `pushState`/`replaceState`, never `location.hash =`.
  That is the only way to control whether a transition leaves a history entry.
  Normalising an unknown or guarded route uses REPLACE — a push there means Back
  bounces the player straight back into the route you just rejected.
- Each history entry carries its depth in `history.state`, so the in-app Back
  control can tell a real app entry from a deep link with nothing behind it and
  land on TITLE instead of walking off the site.
- Guards must be idempotent; a redirect re-runs `resolve`, and one that keeps
  changing its mind would loop forever. Documented on `RouterOptions.resolve`.
- The next view is built *before* the current one is removed, so the swap is a
  single mutation. Emptying first leaves a frame with nothing on screen, which
  the back gesture makes very visible.
- The vista is mounted once and never remounted; screens swap above it. A
  remount would restart the pan and repaint three canvases per transition.
- `readSave()` validates field by field and treats a blocked localStorage
  (Safari Private Browsing throws on access) as "no save" rather than crashing.
  Only `name` and `createdAt` are required, so a save written by an older build
  stays readable as M4 and M5 add fields.

**Also.** Recorded the north-star gameplay loops in ARCHITECTURE — Modular
Pedestrian (micro) and CLEAN ASCENT (macro) — and corrected the client target to
Godot / Rust / WASM. Not to be built here; noted so the shell does not design
against the wrong shape. Repaired the "Where things are" table in STATE.md,
which M1 had split in half with prose, orphaning three entries. Restored the
neon highlight on the build stamp's timestamp, lost when the title screen moved
into `screens.ts`.

**Verify.** `npm run build` — PASS. `npm run smoke` — PASS: 4/4 viewport
configurations, plus `motion` and a new `routing` pass covering BOOT
normalisation, the CTA branch both ways, Back to TITLE, reload-restores-screen,
unknown-hash rewrite, the RETURNING guard, in-app Back from a deep link, and six
malformed saves each reading as "no save". Two structural invariants are
asserted directly: the vista is never remounted (canvas layers keep a tag across
transitions) and the screen host never empties mid-swap (a MutationObserver
flags any removal without a matching addition). Each new assertion confirmed
non-vacuous by breaking it first — dropping the guard, emptying before
appending, and remounting the scene each failed as expected, then reverted.
Screens reviewed at 390 × 844.

## 2026-09-23 — M3a sign-in provider chooser

**What.** The NEW screen becomes "Connect a wallet": five buttons — Coinbase,
MetaMask, Robinhood, Cash App, and continue-with-email — each with a brand-tinted
mark plate on a dusk-palette pill. Tapping one dispatches `strata:connect` with
the provider id and shows that provider's real status.

**Why.** Asked for directly. It is the front half of M3; LOOP § A2 says split a
milestone in STATE.md before doing half of it, so M3 is now M3a (this) and M3b
(wire one provider).

**Files.** `src/connectors.ts` (new), `src/screens.ts`, `src/style.css`,
`src/scene.ts`, `scripts/smoke.mjs`, `docs/ARCHITECTURE.md`, `docs/STATE.md`.

**Nothing is wired, and the UI says so.** Each button carries a `status`:
`planned` where a documented integration exists, `unavailable` where none does.
Two are `unavailable` and say so on the button itself:

- **Robinhood** publishes no third-party sign-in; their API is key-based for
  your own account, not an identity provider.
- **Cash App** offers Cash App Pay through Square — a payment method, not a way
  to sign in.

Coinbase, MetaMask and email are all buildable; ARCHITECTURE § Sign-in providers
records what each needs. Worth re-checking before anyone spends engineering time
on it — third-party auth offerings move.

**Two rules written down so they survive.** This app must never collect a
provider's password or seed phrase — real sign-in redirects (OAuth) or asks the
extension to sign a challenge (EIP-1193), and a password field here would be a
phishing page whatever the intent. And every `status` must stay true. `npm run
smoke` now asserts both.

**Brand assets are placeholders.** The marks are simplified shapes drawn in
`connectors.ts`, not official logos, and are flagged as such at the top of the
file. They must be replaced with each company's official asset, under their
guidelines, before anything ships publicly.

**Open question recorded, not decided.** The seed defines "wallet" as a
*custodial Guardian account*; four of these five buttons imply self-custody or
third-party identity, and `Account` in Contracts v1 has no field for an external
identity. Flagged at the top of STATE.md for `clvi-architecture`.

**Bug found while checking the layout.** A tower could be generated at exactly
the layer's full height, so the tile edge cut it flat and left a hard horizontal
line across the skyline — 6 of 1280 columns in the towers layer's top row were
painted. Capped the height range; the top row is now empty.

**Verify.** `npm run build` — PASS. `npm run smoke` — PASS: 4/4 viewport
configurations plus `motion`, `routing`, and a new `connectors` pass. Each new
assertion confirmed non-vacuous by breaking it first — duplicating a provider's
note, mislabelling Robinhood's status, and adding a password input each failed
as expected, then reverted. Reviewed at 390 × 844 and 320 × 568 (the compact
layout keeps the status line above the fold on a 568 px screen), plus the picked
state.

## 2026-09-23 — M3a revised: Apple and SMS in, Robinhood and Cash App out

**What.** Dropped the two providers that had nothing to connect to and added
Sign in with Apple and SMS (phone OTP). The five buttons are now ruled into two
groups — **wallet** (Coinbase, MetaMask) above the line, **account** (Apple,
SMS, email) below it — because the split is who ends up holding the keys.

**Why.** Asked for directly. Robinhood and Cash App were only ever rendered to
show what the choice looked like; once confirmed unbuildable they were dead
weight on the screen.

**Both, not one.** The ask was "Apple ID login or sms sso". They are different
affordances — Apple is one tap on the target device, SMS needs no existing
account and covers non-Apple users — so both are in. Dropping either is one
entry removed from `CONNECTORS`; the grouping and the smoke expectations follow
from the registry.

**Files.** `src/connectors.ts`, `src/screens.ts`, `scripts/smoke.mjs`,
`docs/ARCHITECTURE.md`, `docs/STATE.md`.

**Notes carried on the new entries.** Apple is a Supabase OAuth provider, so it
is close to the email path already specced — but Apple ships exact button
artwork and forbids altering it, so the placeholder mark here is more of a
problem than most. SMS is Supabase phone OTP, which needs a paid provider
(Twilio and friends) *and* a rate limit, or SMS-pumping fraud will run up the
bill. Both recorded in ARCHITECTURE § Sign-in providers.

**Removals recorded, not just deleted.** ARCHITECTURE now says why Robinhood and
Cash App are absent, so a later session does not re-add them assuming they were
an oversight.

**Also.** The heading was "Connect a wallet", which stopped being true once
three of five options became ordinary sign-ins — now "Create your Guardian".
`Connector` gained a `group` field, so `renderNew` no longer special-cases email
by id to decide where the rule goes.

**Verify.** `npm run build` — PASS. `npm run smoke` — PASS, all seven passes
including `connectors` against the new id list. Reviewed at 390 × 844.
