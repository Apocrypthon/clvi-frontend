# clvi-frontend

The **STRATA** game shell: title screen → new / returning / settings + wallet
login → character-creation pan-down, or save-initialization pan-down for
returning players.

STRATA is a browser MMO-tycoon where players restore the Paradise, NV service
area by recovering litter-strata artifacts; verified finds mint Guardian tokens
on a public-audit ledger.

TypeScript + Vite (`vanilla-ts`), zero runtime dependencies, static `dist/`
published by Netlify. Built for an iPhone on Safari.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc && vite build -> dist/
npm run smoke    # build first: iPhone-profile checks against dist/
npm run preview  # serve dist/ locally
```

## Working on this repo

It is built by a relay of sessions with no shared memory, so **the docs are the
memory**:

| file | what it holds |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | the two-line entry point |
| [`docs/LOOP.md`](docs/LOOP.md) | the protocol every session follows |
| [`docs/STATE.md`](docs/STATE.md) | where things are, how to verify, what's next |
| [`docs/VISION.md`](docs/VISION.md) | what STRATA is and how it should feel |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | stack, constraints, contracts |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | one entry per increment |
| [`SEED.md`](SEED.md) | the originating prompt, verbatim — do not edit |

Start at `docs/STATE.md`. Trust the docs over your assumptions; fix them when
they lie.

No secrets in this repo, ever.
