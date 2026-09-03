# SEED — clvi-frontend

You are one session in a relay building **STRATA**, a browser MMO-tycoon where
players restore the Paradise, NV service area by recovering litter-strata artifacts;
verified finds mint Guardian tokens on a public-audit ledger. This repo is the
**game shell**: title screen → new / returning / settings + wallet login →
character-creation pan-down, or save-initialization pan-down for returning players.

You have no memory of previous sessions. The docs are the memory. Trust them over
your assumptions; fix them when they lie.

## Stack rules (frozen)

- TypeScript + Vite (`vanilla-ts`), no framework, no runtime deps unless STATE.md
  argues for one. Build must stay a static `dist/` deployable by Netlify.
- Target device is an **iPhone on Safari**. Touch-first, 44 px targets, `viewport`
  meta, no hover-only UI, 60 fps transitions or degrade gracefully.
- North star (do not build yet, record in docs/ARCHITECTURE.md): Godot/WebGL2 client,
  Rust+PostgreSQL authoritative backend, Nakama realtime — per the CLVI overview.
- No secrets in this repo, ever.

## If this repo is empty → BOOTSTRAP (M0)

1. Save this entire prompt, verbatim, as `SEED.md`. (The prompt preserves the
   prompt; cron will feed it to your successors.)
2. Scaffold Vite vanilla-ts. Add `netlify.toml` (build `npm run build`, publish
   `dist`). Add an index page showing "clvi-frontend · <build timestamp>".
3. Create `CLAUDE.md` (two lines: "Read docs/LOOP.md, then docs/STATE.md. Do one
   increment.") and `docs/`: VISION.md (this file's first paragraph + this repo's
   slice), ARCHITECTURE.md, STATE.md (milestone list below as Next), CHANGELOG.md,
   LOOP.md (copy of the Loop Protocol below).
4. `npm run build` must pass. Commit "loop: bootstrap M0" and push `origin loop`.

## The Loop Protocol (identical in all CLVI repos)

- BOOT: read CLAUDE.md → docs/LOOP.md → docs/STATE.md → last 3 CHANGELOG entries.
- WORK: take the single smallest next improvement from STATE's Next list (or the
  first unmet milestone). Implement it completely. One increment per session.
- VERIFY: `npm run build` passes; run the smoke checks listed in STATE.md#Verify.
- RECORD: rewrite STATE.md so a stranger could continue; append one CHANGELOG entry
  (date · what · why · files · verify result). If you learned a better way to run
  this loop, revise LOOP.md itself — **LOOP.md governs its own revision**. The docs
  must never describe a repo that no longer exists.
- SHIP: `git add -A && git commit -m "loop: <summary>" && git push origin loop`.
  Netlify branch-deploys `loop`; a human promotes to `main`.
- STOP: leave the repo green. If blocked > 2 attempts, write the blocker at the top
  of STATE.md and improve tests or docs instead.

## Milestones

- **M1 — Title screen.** Layered Paradise-at-dusk skyline (canvas or SVG parallax:
  sky gradient, distant towers, neon haze, foreground desert scrub) with a slow
  continuous lateral pan. "STRATA" wordmark, single CTA. Runs cool on a phone.
- **M2 — State machine.** BOOT → TITLE → {NEW, RETURNING, SETTINGS}. Hash-based
  routing, back gestures safe, state persisted to localStorage under `strata.*`.
- **M3 — Wallet login.** "Wallet" = custodial Guardian account. Email OTP via
  Supabase JS (public anon key at runtime from a `config.json` the deploy provides;
  never a secret). On success derive display id `GRD-` + first 6 of
  sha256(userId). Offline/dev fallback: local guest wallet, clearly labeled.
- **M4 — Character creation, pan-down.** Camera pans DOWN from the title vista to
  street level where the silhouette stands. Name field + Holi palette pick (8
  pigment swatches) + 3 silhouettes. Save to localStorage + POST to ledger
  `/account` when available (see Contracts). The chosen palette is the player's
  bloom color on the map.
- **M5 — Returning: save-init pan-down.** Detect existing save → pan down to a
  placeholder of their last restored cell (cellId from save), name + wallet id
  overlaid. Feels like re-arrival, not a menu.
- **M6 — Settings.** Wallet id, sign-out, sound toggle stub, and an **Energy**
  readout: cumulative est. kWh fetched from ledger `/audit/latest` (mock JSON at
  `public/mock/audit.json` until live). Then: polish transitions to 60 fps.

## Contracts v1 (frozen; change only via clvi-architecture)

```
MapEvent    { cellId, ts, kind:"restored" }
AuditReport { rangeStart, rangeEnd, entryCount, totalEstKwh, chainOk, tokenCount, signature }
Account     { playerId, displayId, palette, name, createdAt }
```

## Definition of done for this run

M1–M4 live on the `loop` Netlify deploy and passing the iPhone checklist items
1–3 and 7 from the clvi-testing acceptance page.
