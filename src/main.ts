import './style.css';

/**
 * M0 boot page. Proves the toolchain, the Netlify publish path, and the
 * build-stamp injection. M1 replaces this body with the parallax title screen —
 * see docs/STATE.md for the next increment.
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

const stamp = document.createElement('p');
stamp.className = 'stamp';
stamp.append('clvi-frontend · ');
const stampTime = document.createElement('b');
stampTime.textContent = formatStamp(BUILD_TIME);
stamp.append(stampTime);

const wordmark = document.createElement('h1');
wordmark.className = 'wordmark';
wordmark.textContent = 'STRATA';

const tagline = document.createElement('p');
tagline.className = 'tagline';
tagline.textContent = 'Restore the Paradise service area, one stratum at a time.';

const next = document.createElement('p');
next.className = 'next';
next.textContent = 'M0 shell online · next increment: M1 title screen';

app.append(wordmark, tagline, stamp, next);
