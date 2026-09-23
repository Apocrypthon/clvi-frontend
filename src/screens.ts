import type { Router, Screen } from './router.ts';
import type { Save } from './store.ts';
import { CONNECTORS, type Connector } from './connectors.ts';

/**
 * One render function per screen. Each returns a detached `.view` element that
 * main.ts swaps into the content host in a single synchronous step — building
 * the new view before removing the old one is what keeps Back from flashing a
 * blank frame.
 *
 * NEW, RETURNING and SETTINGS are deliberately honest scaffolds. M2 owns the
 * machine that reaches them; M3–M6 fill them in. They say so on screen rather
 * than faking controls that do nothing.
 */

export type ScreenContext = {
  router: Router;
  save: Save | null;
  /** Formatted build time, "YYYY-MM-DD HH:MM UTC". Highlighted in the stamp. */
  buildTime: string;
};

function view(name: Screen): HTMLElement {
  const el = document.createElement('section');
  el.className = `view view--${name}`;
  el.dataset.view = name;
  return el;
}

/** Back control shared by every sub-screen. */
function topbar(ctx: ScreenContext): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'topbar';

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back';
  // The glyph is decoration; the label is what a screen reader announces.
  back.innerHTML = '<span aria-hidden="true">‹</span>';
  back.setAttribute('aria-label', 'Back to title');
  back.addEventListener('click', () => ctx.router.back());

  bar.append(back);
  return bar;
}

function heading(text: string): HTMLElement {
  const h = document.createElement('h1');
  h.className = 'view-title';
  h.textContent = text;
  return h;
}

function placeholder(lines: string[]): HTMLElement {
  const box = document.createElement('div');
  box.className = 'placeholder';
  for (const line of lines) {
    const p = document.createElement('p');
    p.textContent = line;
    box.append(p);
  }
  return box;
}

function renderTitle(ctx: ScreenContext): HTMLElement {
  const el = view('title');

  const nav = document.createElement('div');
  nav.className = 'title-nav';
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'icon-btn';
  settings.textContent = 'Settings';
  settings.addEventListener('click', () => ctx.router.go('settings'));
  nav.append(settings);

  const wordmark = document.createElement('h1');
  wordmark.className = 'wordmark';
  wordmark.textContent = 'STRATA';

  const tagline = document.createElement('p');
  tagline.className = 'tagline';
  tagline.textContent = ctx.save
    ? `Welcome back, ${ctx.save.name}.`
    : 'Restore the Paradise service area, one stratum at a time.';

  const cta = document.createElement('button');
  cta.className = 'cta';
  cta.type = 'button';
  // The save is what makes this a returning player; the label has to match.
  cta.textContent = ctx.save ? 'Continue' : 'Begin';
  cta.addEventListener('click', () => {
    // The seam M1 established. main.ts listens and routes, so the button stays
    // ignorant of the state machine.
    document.dispatchEvent(new CustomEvent('strata:begin'));
  });

  const stamp = document.createElement('p');
  stamp.className = 'stamp';
  stamp.append('clvi-frontend · ');
  const stampTime = document.createElement('b');
  stampTime.textContent = ctx.buildTime;
  stamp.append(stampTime);

  el.append(nav, wordmark, tagline, cta, stamp);
  return el;
}

/**
 * One provider button. The mark sits on a plate tinted with the brand colour;
 * the pill itself stays in the dusk palette so five very loud brands do not
 * turn the screen into a logo salad.
 */
function connectorButton(c: Connector, onPick: (c: Connector) => void): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'connector';
  btn.dataset.connector = c.id;
  btn.style.setProperty('--brand', c.brand);

  const plate = document.createElement('span');
  plate.className = 'connector-mark';
  // Static markup from src/connectors.ts — no user input reaches this.
  plate.innerHTML = c.mark;

  const label = document.createElement('span');
  label.className = 'connector-label';
  label.textContent = c.label;

  btn.append(plate, label);

  if (c.status === 'unavailable') {
    const flag = document.createElement('span');
    flag.className = 'connector-flag';
    flag.textContent = 'no API';
    // Decorative shorthand; the button's own label already names the provider.
    flag.setAttribute('aria-hidden', 'true');
    btn.append(flag);
  }

  btn.addEventListener('click', () => onPick(c));
  return btn;
}

function renderNew(ctx: ScreenContext): HTMLElement {
  const el = view('new');
  el.append(topbar(ctx), heading('Connect a wallet'));

  const sub = document.createElement('p');
  sub.className = 'tagline';
  sub.textContent = 'Your Guardian account holds what you recover.';
  el.append(sub);

  const status = document.createElement('p');
  status.className = 'connector-status';
  // Reserve the line so picking a provider does not shove the buttons upward.
  status.textContent = 'Nothing is wired yet — tap one to see what it needs.';

  const list = document.createElement('div');
  list.className = 'connectors';

  const pick = (c: Connector): void => {
    status.textContent = c.note;
    status.dataset.status = c.status;
    for (const b of list.querySelectorAll('.connector')) {
      b.classList.toggle('is-picked', b instanceof HTMLElement && b.dataset.connector === c.id);
    }
    // The seam M3b binds to, mirroring `strata:begin`. Nothing listens yet.
    document.dispatchEvent(new CustomEvent('strata:connect', { detail: { id: c.id } }));
  };

  const wallets = CONNECTORS.filter((c) => c.id !== 'email');
  const email = CONNECTORS.find((c) => c.id === 'email');
  for (const c of wallets) list.append(connectorButton(c, pick));

  if (email) {
    const rule = document.createElement('div');
    rule.className = 'rule';
    rule.innerHTML = '<span>or</span>';
    list.append(rule, connectorButton(email, pick));
  }

  el.append(list, status);
  return el;
}

function renderReturning(ctx: ScreenContext): HTMLElement {
  const el = view('returning');
  el.append(topbar(ctx), heading('Re-arrival'));
  if (ctx.save) {
    const who = document.createElement('p');
    who.className = 'tagline';
    who.textContent = `${ctx.save.name} · joined ${ctx.save.createdAt.slice(0, 10)}`;
    el.append(who);
  }
  el.append(
    placeholder([
      ctx.save?.cellId
        ? `M5 pans down to the last restored cell (${ctx.save.cellId}).`
        : 'M5 pans down to the last restored cell, name and wallet id overlaid.',
    ]),
  );
  return el;
}

function renderSettings(ctx: ScreenContext): HTMLElement {
  const el = view('settings');
  el.append(
    topbar(ctx),
    heading('Settings'),
    placeholder([
      'M6 puts the wallet id, sign-out and a sound toggle here,',
      'plus an Energy readout: cumulative est. kWh from the ledger audit.',
    ]),
  );
  return el;
}

const RENDERERS: Record<Screen, (ctx: ScreenContext) => HTMLElement> = {
  title: renderTitle,
  new: renderNew,
  returning: renderReturning,
  settings: renderSettings,
};

export function renderScreen(screen: Screen, ctx: ScreenContext): HTMLElement {
  return RENDERERS[screen](ctx);
}
