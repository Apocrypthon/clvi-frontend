/**
 * M1 — the Paradise-at-dusk parallax vista behind the title screen.
 *
 * How it runs cool on a phone: there is no animation loop. Each layer is drawn
 * ONCE into a canvas holding two copies of a seamlessly tileable strip, and the
 * pan is a CSS `transform` animation from 0 to -50%. The compositor owns it, so
 * the main thread does no per-frame work and a busy JS task cannot stutter it.
 * Redrawing happens only on a width change.
 *
 * Everything here is drawn directly with Canvas 2D — no rendering abstraction,
 * per docs/ARCHITECTURE.md § North star, because the Godot client will replace
 * it wholesale.
 */

/**
 * iPhones report devicePixelRatio 3. These layers are wide silhouettes, so the
 * third pixel buys nothing visible and costs 2.25x the texture memory and fill.
 */
const DPR_CAP = 2;

/** Deterministic PRNG (mulberry32) so the skyline is identical across reloads. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) => void;

type LayerDef = {
  /** Modifier appended to `layer--`, also the element's data-layer value. */
  name: string;
  /** Fraction of stage height where the layer's top edge sits. */
  top: number;
  /** Fraction of stage height the layer occupies. */
  height: number;
  /** Seconds for one full tile to traverse. Farther layers must be slower. */
  durationS: number;
  seed: number;
  paint: Paint;
};

/**
 * Paints an item at every horizontal offset where it would touch the tile, so
 * the strip is periodic at width `tileW` — which is what lets the -50% translate
 * loop invisibly.
 *
 * Both directions matter: towers overflow the right edge, but haze blooms are
 * anchored at `centre - radius` and routinely start left of zero. Handling only
 * one side leaves a visible seam at the loop point.
 */
function wrapped(
  x: number,
  width: number,
  tileW: number,
  paintAt: (x: number) => void,
): void {
  // Every k where [x + k*tileW, x + k*tileW + width) overlaps [0, tileW).
  const kMin = Math.floor(-(x + width) / tileW) + 1;
  const kMax = Math.ceil((tileW - x) / tileW) - 1;
  for (let k = kMin; k <= kMax; k += 1) paintAt(x + k * tileW);
}

/** Distant towers: hazy, desaturated, rooted just under the horizon glow. */
const paintTowers: Paint = (ctx, w, h, rand) => {
  let x = 0;
  while (x < w) {
    const bw = 16 + rand() * 30;
    // Capped below 1.0: a building that reaches the canvas top is cut flat by
    // the tile edge, which reads as a hard horizontal line across the skyline.
    const bh = h * (0.3 + rand() * 0.64);
    const top = h - bh;

    wrapped(x, bw, w, (px) => {
      // Atmospheric perspective: distant mass is lighter at its base, where the
      // horizon glow sits behind it.
      const g = ctx.createLinearGradient(0, top, 0, h);
      g.addColorStop(0, '#171033');
      g.addColorStop(1, '#2c1f4d');
      ctx.fillStyle = g;
      ctx.fillRect(px, top, bw, bh);
    });

    // Only the taller towers read as lit at this distance.
    if (bh > h * 0.55) {
      const cols = Math.max(1, Math.floor(bw / 9));
      const rows = Math.floor(bh / 14);
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          if (rand() > 0.22) continue;
          const wx = x + 4 + c * 9;
          const wy = top + 8 + r * 14;
          // Every random draw must happen before wrapped(), or the wrapped
          // copy differs from the original and the loop point shows a seam.
          const warm = rand() > 0.35;
          const fill = warm
            ? `rgba(246, 181, 122, ${0.25 + rand() * 0.35})`
            : `rgba(111, 242, 228, ${0.18 + rand() * 0.25})`;
          wrapped(wx, 2.5, w, (px) => {
            ctx.fillStyle = fill;
            ctx.fillRect(px, wy, 2.5, 3.5);
          });
        }
      }
    }

    // An occasional mast with an aircraft-warning light.
    if (bh > h * 0.75 && rand() > 0.6) {
      const mx = x + bw / 2;
      const mastTop = top - 6 - rand() * 14;
      wrapped(mx, 1, w, (px) => {
        ctx.strokeStyle = 'rgba(23, 16, 51, 0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, top);
        ctx.lineTo(px, mastTop);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 120, 120, 0.5)';
        ctx.fillRect(px - 1, mastTop - 1, 2, 2);
      });
    }

    x += bw + 3 + rand() * 12;
  }
};

/** Neon haze: light pollution pooling over the strip, in front of the towers. */
const paintHaze: Paint = (ctx, w, h, rand) => {
  ctx.globalCompositeOperation = 'lighter';
  const blooms = Math.max(4, Math.round(w / 130));
  for (let i = 0; i < blooms; i += 1) {
    const cx = rand() * w;
    const cy = h * (0.55 + rand() * 0.4);
    const r = h * (0.5 + rand() * 0.9);
    const neon = rand() > 0.55;
    const alpha = 0.05 + rand() * 0.09;

    wrapped(cx - r, r * 2, w, (px) => {
      const g = ctx.createRadialGradient(px + r, cy, 0, px + r, cy, r);
      g.addColorStop(0, neon
        ? `rgba(111, 242, 228, ${alpha})`
        : `rgba(246, 181, 122, ${alpha * 1.4})`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(px, cy - r, r * 2, r * 2);
    });
  }
  ctx.globalCompositeOperation = 'source-over';
};

/** Foreground desert scrub: near-black, the only layer with hard edges. */
const paintScrub: Paint = (ctx, w, h, rand) => {
  const INK = '#07060f';
  const groundY = h * 0.42;

  // Undulating ground line.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, groundY);
  for (let x = 0; x <= w; x += 24) {
    // Periodic in w so the two copies meet flush.
    const t = (x / w) * Math.PI * 2;
    const y = groundY + Math.sin(t * 3) * 5 + Math.sin(t * 7) * 3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';

  // Low bushes: fans of stalks radiating from a point on the ground.
  const bushes = Math.max(6, Math.round(w / 55));
  for (let i = 0; i < bushes; i += 1) {
    const bx = rand() * w;
    const spread = 10 + rand() * 22;
    const tall = 12 + rand() * 26;
    const stalks = 5 + Math.floor(rand() * 8);
    const angles: number[] = [];
    const lengths: number[] = [];
    for (let s = 0; s < stalks; s += 1) {
      angles.push((-0.5 + rand()) * 1.6);
      lengths.push(tall * (0.55 + rand() * 0.65));
    }
    wrapped(bx - spread, spread * 2, w, (px) => {
      const rootX = px + spread;
      ctx.lineWidth = 1.6;
      for (let s = 0; s < stalks; s += 1) {
        ctx.beginPath();
        ctx.moveTo(rootX, groundY + 4);
        ctx.lineTo(rootX + Math.sin(angles[s]!) * spread, groundY + 4 - lengths[s]!);
        ctx.stroke();
      }
    });
  }

  // A few tall stalks breaking the skyline of the scrub.
  const stalkCount = Math.max(2, Math.round(w / 220));
  for (let i = 0; i < stalkCount; i += 1) {
    const sx = rand() * w;
    const sh = 40 + rand() * 55;
    const lean = (-0.5 + rand()) * 14;
    wrapped(sx - 8, 16, w, (px) => {
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(px + 8, groundY + 6);
      ctx.quadraticCurveTo(px + 8 + lean * 0.5, groundY - sh * 0.6, px + 8 + lean, groundY - sh);
      ctx.stroke();
    });
  }
};

const LAYERS: LayerDef[] = [
  { name: 'towers', top: 0.40, height: 0.36, durationS: 240, seed: 0x5714a, paint: paintTowers },
  { name: 'haze', top: 0.58, height: 0.24, durationS: 150, seed: 0x21be7, paint: paintHaze },
  { name: 'scrub', top: 0.70, height: 0.30, durationS: 85, seed: 0x9c033, paint: paintScrub },
];

export type Scene = { destroy(): void };

/**
 * Builds the vista inside `stage` and keeps it correct across width changes.
 * Returns a handle so a future screen transition can tear it down.
 */
export function mountScene(stage: HTMLElement): Scene {
  const sky = document.createElement('div');
  sky.className = 'sky';
  stage.append(sky);

  const canvases = LAYERS.map((def) => {
    const el = document.createElement('canvas');
    el.className = `layer layer--${def.name}`;
    el.dataset.layer = def.name;
    // Two tiles wide by design; the stage clips it. Flagged so the smoke check
    // knows this overflow is deliberate (scripts/smoke.mjs).
    el.dataset.overflow = 'intentional';
    el.style.setProperty('--dur', `${def.durationS}s`);
    el.setAttribute('aria-hidden', 'true');
    stage.append(el);
    return el;
  });

  const vignette = document.createElement('div');
  vignette.className = 'vignette';
  stage.append(vignette);

  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

  function render(): void {
    const stageW = Math.max(1, Math.round(stage.clientWidth));
    const stageH = Math.max(1, Math.round(stage.clientHeight));

    LAYERS.forEach((def, i) => {
      const el = canvases[i]!;
      const h = Math.max(1, Math.round(stageH * def.height));

      el.style.top = `${Math.round(stageH * def.top)}px`;
      el.style.height = `${h}px`;
      el.width = Math.round(stageW * 2 * dpr);
      el.height = Math.round(h * dpr);

      const ctx = el.getContext('2d');
      if (!ctx) return; // Canvas unavailable: the sky gradient alone still reads.

      // Paint one tile offscreen, then blit it twice. Painting directly into
      // the two halves instead would cost double the work and make the copies
      // only approximately equal — gradient dithering depends on absolute x,
      // so the halves would differ by a quantisation step. Blitting a single
      // bitmap makes them exact, which is what the -50% loop relies on.
      const tile = document.createElement('canvas');
      tile.width = Math.round(stageW * dpr);
      tile.height = Math.round(h * dpr);
      const tctx = tile.getContext('2d');
      if (!tctx) return;
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // The tile canvas clips its own overflow, so wrapped() alone decides
      // periodicity — no clip path needed.
      def.paint(tctx, stageW, h, seededRandom(def.seed));

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.drawImage(tile, 0, 0);
      ctx.drawImage(tile, tile.width, 0);
    });
  }

  render();

  // iOS Safari fires resize as its toolbars collapse, which changes height only.
  // Redrawing on that would churn for nothing, so track width.
  let lastWidth = stage.clientWidth;
  let pending = 0;
  function onResize(): void {
    if (stage.clientWidth === lastWidth) return;
    lastWidth = stage.clientWidth;
    window.clearTimeout(pending);
    pending = window.setTimeout(render, 150);
  }
  window.addEventListener('resize', onResize, { passive: true });

  // CSS animations are already throttled when the page is hidden; pausing them
  // explicitly means a backgrounded tab is doing provably nothing.
  function onVisibility(): void {
    document.documentElement.classList.toggle('is-hidden', document.hidden);
  }
  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();

  return {
    destroy(): void {
      window.clearTimeout(pending);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      stage.replaceChildren();
    },
  };
}
