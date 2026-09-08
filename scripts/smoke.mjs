/**
 * Smoke check for the built shell — the automated half of docs/STATE.md § Verify.
 *
 *   npm run build && npm run smoke
 *
 * Serves dist/ on an ephemeral port and drives it in Chromium under an iPhone
 * profile at two widths, with and without prefers-reduced-motion. Zero added
 * dependencies: it uses node:http for the server and whichever Playwright is
 * already on the machine (local or global). If Playwright is absent it SKIPS
 * rather than fails, so the build never depends on it.
 */
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SHOTS = process.env.SMOKE_SHOTS ?? null;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/** Playwright is a machine tool here, not a project dependency. */
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const id of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try {
      return require(id);
    } catch {
      /* try the next location */
    }
  }
  return null;
}

const playwright = loadPlaywright();
if (!playwright) {
  console.log('smoke: Playwright not found — skipping browser checks.');
  console.log('smoke: run docs/STATE.md § Verify by hand, or `npm i -g playwright`.');
  process.exit(0);
}

// Static server. Mirrors netlify.toml's SPA fallback so deep links behave the
// same here as on the deploy.
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let path = normalize(decodeURIComponent(url.pathname));
  if (path.includes('..')) {
    res.writeHead(403).end();
    return;
  }
  if (path.endsWith('/')) path += 'index.html';
  let body;
  try {
    body = await readFile(join(DIST, path));
  } catch {
    path = '/index.html';
    try {
      body = await readFile(join(DIST, path));
    } catch {
      res.writeHead(404).end('no dist/ — run `npm run build` first');
      return;
    }
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
  res.end(body);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const origin = `http://127.0.0.1:${port}/`;

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const SIZES = [
  { name: 'iphone14', width: 390, height: 844 },
  { name: 'iphoneSE', width: 320, height: 568 },
];

const browser = await playwright.chromium.launch();
const failures = [];

for (const size of SIZES) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const tag = `${size.name}/${reducedMotion}`;
    const ctx = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      reducedMotion,
      userAgent: IPHONE_UA,
    });
    const page = await ctx.newPage();

    const noise = [];
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') noise.push(`${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => noise.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) =>
      noise.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`),
    );

    const resp = await page.goto(origin, { waitUntil: 'networkidle' });

    const info = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      // overflow-x:clip hides bleed from scrollWidth, so measure real geometry.
      // Parallax layers are two tiles wide by design and clipped by .stage;
      // they opt out via data-overflow, everything else must fit.
      const bleed = [];
      for (const el of document.querySelectorAll('body *')) {
        if (el.dataset.overflow === 'intentional') continue;
        if (el.closest('[data-overflow="intentional"]')) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > vw + 0.5 || r.left < -0.5) {
          bleed.push(`${el.tagName.toLowerCase()}.${el.className}`);
        }
      }
      // Anything the player must touch has to clear 44px (ARCHITECTURE § Target).
      const small = [];
      const touchable = 'a,button,input,select,textarea,[role="button"],[tabindex]';
      for (const el of document.querySelectorAll(touchable)) {
        const r = el.getBoundingClientRect();
        if (r.width < 44 || r.height < 44) {
          small.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }

      // Every parallax layer must (a) have actually drawn something and (b) be
      // periodic at one tile width: column 0 and column W are what the -50%
      // pan swaps between, so if they differ the loop visibly jumps.
      const layers = [];
      for (const c of document.querySelectorAll('canvas.layer')) {
        const name = c.dataset.layer ?? '?';
        if (c.width < 2 || c.height < 1) {
          layers.push({ name, blank: true, seamDiff: -1 });
          continue;
        }
        // Copy the two columns into a scratch canvas rather than reading back
        // from the page's own context — reading that one would both warn and
        // deoptimise the real rendering surface.
        const half = Math.floor(c.width / 2);
        const probe = document.createElement('canvas');
        probe.width = 2;
        probe.height = c.height;
        const pctx = probe.getContext('2d', { willReadFrequently: true });
        pctx.drawImage(c, 0, 0, 1, c.height, 0, 0, 1, c.height);
        pctx.drawImage(c, half, 0, 1, c.height, 1, 0, 1, c.height);
        const px = pctx.getImageData(0, 0, 2, c.height).data;
        let painted = 0;
        let seamDiff = 0;
        for (let row = 0; row < c.height; row += 1) {
          const a = row * 8;      // column 0 of this row
          const b = a + 4;        // column 1 (the tile-width sample)
          if (px[a + 3] > 0) painted += 1;
          // Compare what is actually displayed: premultiplied by alpha. Raw RGB
          // in a near-transparent pixel is dithering noise — at alpha 5, RGB 51
          // and RGB 0 are both "nothing", and comparing them raw fails loudly
          // for no visible reason.
          const alphaA = px[a + 3];
          const alphaB = px[b + 3];
          if (Math.abs(alphaA - alphaB) > 2) { seamDiff += 1; continue; }
          for (let ch = 0; ch < 3; ch += 1) {
            const va = (px[a + ch] * alphaA) / 255;
            const vb = (px[b + ch] * alphaB) / 255;
            if (Math.abs(va - vb) > 2) { seamDiff += 1; break; }
          }
        }
        layers.push({ name, blank: painted === 0, seamDiff });
      }

      return {
        vw,
        scrollW: document.documentElement.scrollWidth,
        bleed,
        small,
        layers,
        stamp: document.querySelector('.stamp')?.textContent?.trim(),
        wordmark: document.querySelector('.wordmark')?.textContent?.trim(),
        ctaLabel: document.querySelector('.cta')?.textContent?.trim(),
        // 'pan' while motion is allowed, 'none' when the user asked for less.
        panAnimation: getComputedStyle(document.querySelector('.layer')).animationName,
      };
    });

    const problems = [];
    if (resp.status() !== 200) problems.push(`HTTP ${resp.status()}`);
    if (!/^clvi-frontend · \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/.test(info.stamp ?? ''))
      problems.push(`build stamp malformed: ${JSON.stringify(info.stamp)}`);
    if (info.wordmark !== 'STRATA') problems.push(`wordmark: ${JSON.stringify(info.wordmark)}`);
    if (!info.ctaLabel) problems.push('no CTA on the title screen');
    if (info.bleed.length) problems.push(`bleeds past viewport: ${info.bleed.join(', ')}`);
    if (info.small.length) problems.push(`touch target < 44px: ${info.small.join(', ')}`);
    if (info.scrollW > info.vw) problems.push('page scrolls horizontally');

    if (info.layers.length !== 3) problems.push(`expected 3 parallax layers, found ${info.layers.length}`);
    for (const l of info.layers) {
      if (l.blank) problems.push(`layer "${l.name}" drew nothing`);
      else if (l.seamDiff > 0) problems.push(`layer "${l.name}" is not seamless (${l.seamDiff} rows differ at the loop point)`);
    }

    const wantPan = reducedMotion === 'reduce' ? 'none' : 'pan';
    if (info.panAnimation !== wantPan)
      problems.push(`pan animation is "${info.panAnimation}", expected "${wantPan}"`);

    if (noise.length) problems.push(`console: ${noise.join(' | ')}`);

    console.log(problems.length ? `FAIL ${tag}` : `ok   ${tag}`);
    for (const p of problems) {
      console.log(`       ${p}`);
      failures.push(`${tag}: ${p}`);
    }

    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${size.name}-${reducedMotion}.png` });
    await ctx.close();
  }
}

// The pan is the milestone. Verified once rather than per viewport: the layers
// must actually move, must move at different rates (that is the parallax), and
// must stop dead when the page is hidden.
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: IPHONE_UA,
  });
  const page = await ctx.newPage();
  await page.goto(origin, { waitUntil: 'networkidle' });

  const readX = () =>
    page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('canvas.layer')].map((c) => [
          c.dataset.layer,
          new DOMMatrixReadOnly(getComputedStyle(c).transform).m41,
        ]),
      ),
    );

  const before = await readX();
  await page.waitForTimeout(1500);
  const after = await readX();
  const moved = Object.fromEntries(
    Object.keys(before).map((k) => [k, after[k] - before[k]]),
  );

  const problems = [];
  for (const [name, dx] of Object.entries(moved)) {
    if (dx > -0.5) problems.push(`layer "${name}" did not pan (${dx.toFixed(2)}px in 1.5s)`);
  }
  // Nearer layers must outrun farther ones or there is no depth.
  if (!(moved.scrub < moved.haze && moved.haze < moved.towers))
    problems.push(`parallax order wrong: ${JSON.stringify(moved)}`);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden0 = await readX();
  await page.waitForTimeout(1000);
  const hidden1 = await readX();
  for (const k of Object.keys(hidden0)) {
    if (Math.abs(hidden1[k] - hidden0[k]) > 0.5)
      problems.push(`layer "${k}" kept panning while the page was hidden`);
  }

  const ctaFires = await page.evaluate(() => {
    let seen = false;
    document.addEventListener('strata:begin', () => { seen = true; }, { once: true });
    document.querySelector('.cta')?.click();
    return seen;
  });
  if (!ctaFires) problems.push('CTA does not dispatch strata:begin (the seam M2 binds to)');

  console.log(problems.length ? 'FAIL motion' : 'ok   motion');
  for (const p of problems) {
    console.log(`       ${p}`);
    failures.push(`motion: ${p}`);
  }
  await ctx.close();
}

await browser.close();
server.close();

if (failures.length) {
  console.log(`\nsmoke: ${failures.length} failure(s).`);
  process.exit(1);
}
console.log('\nsmoke: all checks passed.');
