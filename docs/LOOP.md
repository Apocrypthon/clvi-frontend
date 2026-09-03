# LOOP.md — The Loop Protocol

Identical in all CLVI repos. **LOOP.md governs its own revision:** if you learn
a better way to run this loop, change this file as part of your increment.

- **BOOT:** read `CLAUDE.md` → `docs/LOOP.md` → `docs/STATE.md` → last 3
  `CHANGELOG.md` entries.
- **WORK:** take the single smallest next improvement from STATE's Next list (or
  the first unmet milestone). Implement it completely. One increment per session.
- **VERIFY:** `npm run build` passes; run the smoke checks listed in
  `docs/STATE.md` § Verify.
- **RECORD:** rewrite `STATE.md` so a stranger could continue; append one
  `CHANGELOG.md` entry (date · what · why · files · verify result). The docs must
  never describe a repo that no longer exists.
- **SHIP:** `git add -A && git commit -m "loop: <summary>" && git push origin loop`.
  Netlify branch-deploys `loop`; a human promotes to `main`.
- **STOP:** leave the repo green. If blocked > 2 attempts, write the blocker at
  the top of `STATE.md` and improve tests or docs instead.

## Amendments

These are refinements learned while running the loop. They do not replace the
protocol above.

### A1 — Branch (2026-09-03, M0)

The protocol above names `loop` as the integration branch. **Check that it
exists before you rely on it** — at M0 it did not, and a doc that routes work to
a branch nobody has created is worse than no doc.

Some sessions are also handed a **designated branch** by their harness and may
not push anywhere else. When either applies:

1. Do the work on the designated branch.
2. Say so plainly in your CHANGELOG entry and at the top of STATE.md, naming the
   branch and what actually exists on origin, so the next session and whoever
   owns the deploy can find the work.
3. Leave the integration decision to a human. Do not create `loop`, retarget an
   open PR, or merge to a different base to make the protocol true.

Never push to `main`. Never silently retarget the deploy branch.

### A2 — One increment means one milestone

A milestone (M1, M2, …) is the unit of work, not a slice of one. Land it whole:
a half-built title screen leaves the repo un-green and the next session guessing
what was intentional. If a milestone genuinely will not fit, split it *in
STATE.md first* — write the two halves down as separate Next items, then do the
first one. Never leave an undocumented partial.

### A3 — Docs are the memory, so write for a stranger

STATE.md is read by someone with zero context and no scrollback. Before you
ship, reread it as that person: could they run the app, find the file they need
to edit, and know what "done" looks like for the next item? Names of files and
functions beat prose. Delete anything that is no longer true — a stale doc is
worse than a missing one.
