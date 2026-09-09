import './style.css';
import { mountScene } from './scene.ts';
import { createRouter, type Screen } from './router.ts';
import { readSave } from './store.ts';
import { renderScreen, type ScreenContext } from './screens.ts';

/**
 * Composition root. Mounts the vista once, then swaps screens above it as the
 * router changes — the sky is the one thing that must NOT remount, or every
 * transition would restart the pan and repaint three canvases.
 */

const BUILD_TIME = __BUILD_TIME__;

/** "2026-09-03T07:41:12.000Z" -> "2026-09-03 07:41 UTC" */
function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app mount point missing from index.html');

const stage = document.createElement('div');
stage.className = 'stage';
// Decorative: the vista carries no information a screen reader needs.
stage.setAttribute('aria-hidden', 'true');

const host = document.createElement('main');
host.className = 'screen';

app.append(stage, host);
mountScene(stage);

const buildTime = formatStamp(BUILD_TIME);

const router = createRouter({
  /**
   * The only guard M2 needs: RETURNING is meaningless without a save, so a deep
   * link or a stale bookmark lands on NEW instead. Idempotent, as createRouter
   * requires — NEW never redirects.
   */
  resolve: (screen: Screen) => (screen === 'returning' && !readSave() ? 'new' : screen),
});

function show(screen: Screen): void {
  const ctx: ScreenContext = { router, save: readSave(), buildTime };
  // Build first, then swap in one step: replaceChildren with a ready element
  // never leaves the host empty, so Back cannot flash a blank frame.
  host.replaceChildren(renderScreen(screen, ctx));
  document.documentElement.dataset.screen = screen;
}

router.subscribe(show);
show(router.current());

// The CTA's seam, established in M1. The button announces intent; routing is
// decided here, where the save is already in hand.
document.addEventListener('strata:begin', () => {
  router.go(readSave() ? 'returning' : 'new');
});
