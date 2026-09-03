# VISION — STRATA / clvi-frontend

STRATA is a browser MMO-tycoon where players restore the Paradise, NV service
area by recovering litter-strata artifacts; verified finds mint Guardian tokens
on a public-audit ledger.

## This repo's slice

`clvi-frontend` is the **game shell** — everything that happens before play
begins, and the frame that play later mounts into:

    title screen
      → new / returning / settings + wallet login
        → character-creation pan-down            (new players)
        → save-initialization pan-down           (returning players)

The shell is not the game. It owns first impression, identity, and persistence
handoff. It must feel like arriving somewhere, not like filling in a form.

## Feel

- **Paradise at dusk.** Sodium-orange horizon under a bruised purple sky, neon
  haze off the strip, desert scrub in the near dark. Warm, worn, a little sad.
- **The camera is the verb.** Screens are not pages; they are places the camera
  pans to. Down from the vista to street level. Never a modal where a move
  would do.
- **Restoration, not extraction.** The player is a caretaker of a place. Copy
  and colour should never read as loot-grinding.

## Non-negotiables

- Target device is an **iPhone on Safari**. If it does not run cool and smooth
  in one hand, it is not done.
- The ledger is public and auditable; the shell never hides what it recorded.
- No secrets in this repo, ever.
