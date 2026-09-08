import './style.css';
import { mountScene } from './scene.ts';

/**
 * M1 — the title screen. The vista lives in .stage (see src/scene.ts); this
 * module owns the content on top of it: wordmark, tagline, the single CTA, and
 * the build stamp that proves which deploy you are looking at.
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

const screen = document.createElement('main');
screen.className = 'screen';

const wordmark = document.createElement('h1');
wordmark.className = 'wordmark';
wordmark.textContent = 'STRATA';

const tagline = document.createElement('p');
tagline.className = 'tagline';
tagline.textContent = 'Restore the Paradise service area, one stratum at a time.';

const cta = document.createElement('button');
cta.className = 'cta';
cta.type = 'button';
cta.textContent = 'Begin';

/**
 * The seam M2 plugs into. M1 owns the button; routing to NEW / RETURNING is
 * M2's increment, so this announces intent rather than faking a destination.
 */
cta.addEventListener('click', () => {
  document.dispatchEvent(new CustomEvent('strata:begin'));
});

const stamp = document.createElement('p');
stamp.className = 'stamp';
stamp.append('clvi-frontend · ');
const stampTime = document.createElement('b');
stampTime.textContent = formatStamp(BUILD_TIME);
stamp.append(stampTime);

screen.append(wordmark, tagline, cta, stamp);
app.append(stage, screen);

mountScene(stage);
