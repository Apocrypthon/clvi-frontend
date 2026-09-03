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
      const bleed = [];
      for (const el of document.querySelectorAll('body *')) {
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
      return {
        vw,
        scrollW: document.documentElement.scrollWidth,
        bleed,
        small,
        stamp: document.querySelector('.stamp')?.textContent?.trim(),
      };
    });

    const problems = [];
    if (resp.status() !== 200) problems.push(`HTTP ${resp.status()}`);
    if (!/^clvi-frontend · \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/.test(info.stamp ?? ''))
      problems.push(`build stamp malformed: ${JSON.stringify(info.stamp)}`);
    if (info.bleed.length) problems.push(`bleeds past viewport: ${info.bleed.join(', ')}`);
    if (info.small.length) problems.push(`touch target < 44px: ${info.small.join(', ')}`);
    if (info.scrollW > info.vw) problems.push('page scrolls horizontally');
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

await browser.close();
server.close();

if (failures.length) {
  console.log(`\nsmoke: ${failures.length} failure(s).`);
  process.exit(1);
}
console.log('\nsmoke: all checks passed.');
