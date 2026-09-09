/**
 * The shell's state machine: BOOT → TITLE → { NEW, RETURNING, SETTINGS }.
 *
 * Hash-based, so every route is reachable on a static host with no server
 * rewrite. Navigation goes through pushState/replaceState rather than assigning
 * `location.hash`, because that is the only way to control whether a transition
 * leaves a history entry — which is what makes the back gesture behave.
 *
 * Two rules keep Back safe:
 *   - Normalising a route (unknown hash, or one a guard redirects) uses
 *     REPLACE. A push there would leave the bad entry in history, and Back
 *     would bounce the player straight into it again.
 *   - Each entry carries its depth in `history.state`, so an in-app Back knows
 *     whether there is an app entry behind it or whether Back would leave the
 *     site entirely.
 */

export type Screen = 'title' | 'new' | 'returning' | 'settings';

const ROUTES: Record<Screen, string> = {
  title: '#/',
  new: '#/new',
  returning: '#/returning',
  settings: '#/settings',
};

const SCREENS = Object.keys(ROUTES) as Screen[];

function screenFromHash(hash: string): Screen | null {
  // Tolerate a missing hash, a bare '#', and a stray trailing slash.
  const normalised = (hash || '#/').replace(/^#\/?/, '#/').replace(/\/+$/, '/');
  return SCREENS.find((s) => ROUTES[s] === normalised) ?? null;
}

function depthOf(state: unknown): number {
  if (typeof state !== 'object' || state === null) return 0;
  const d = (state as { strataDepth?: unknown }).strataDepth;
  return typeof d === 'number' && Number.isFinite(d) ? d : 0;
}

export type RouterOptions = {
  /**
   * Applies guards — e.g. RETURNING is meaningless without a save. MUST be
   * idempotent (`resolve(resolve(x)) === resolve(x)`), because a redirect
   * re-runs it; a resolve that keeps changing its mind would loop forever.
   */
  resolve?: (screen: Screen) => Screen;
};

export type Router = {
  current(): Screen;
  /** Navigate, leaving a history entry so Back returns here. */
  go(screen: Screen): void;
  /** Navigate in place — no new history entry. */
  replace(screen: Screen): void;
  /** Step back if this session put an entry behind us, else fall back to TITLE. */
  back(): void;
  subscribe(fn: (screen: Screen, previous: Screen | null) => void): () => void;
  destroy(): void;
};

export function createRouter(options: RouterOptions = {}): Router {
  const resolve = options.resolve ?? ((s: Screen) => s);
  const listeners = new Set<(screen: Screen, previous: Screen | null) => void>();

  let current: Screen | null = null;

  function apply(screen: Screen, mode: 'push' | 'replace'): void {
    const target = resolve(screen);
    const hash = ROUTES[target];
    const depth = mode === 'push' ? depthOf(history.state) + 1 : depthOf(history.state);
    const state = { strataDepth: depth };

    if (mode === 'push' && location.hash !== hash) {
      history.pushState(state, '', hash);
    } else {
      history.replaceState(state, '', hash);
    }
    settle(target);
  }

  function settle(screen: Screen): void {
    if (screen === current) return;
    const previous = current;
    current = screen;
    for (const fn of listeners) fn(screen, previous);
  }

  /** Reconciles the machine with whatever the URL currently says. */
  function sync(): void {
    const requested = screenFromHash(location.hash) ?? 'title';
    const target = resolve(requested);
    if (target !== requested || location.hash !== ROUTES[target]) {
      // Unknown or guarded route: rewrite in place so Back cannot return to it.
      history.replaceState({ strataDepth: depthOf(history.state) }, '', ROUTES[target]);
    }
    settle(target);
  }

  // popstate covers Back/Forward over our own pushState entries; hashchange
  // covers a hash typed or pasted into the address bar.
  const onPop = () => sync();
  const onHash = () => sync();
  window.addEventListener('popstate', onPop);
  window.addEventListener('hashchange', onHash);

  sync(); // BOOT → TITLE (or straight to a deep-linked screen).

  return {
    current: () => current ?? 'title',
    go: (screen) => apply(screen, 'push'),
    replace: (screen) => apply(screen, 'replace'),
    back(): void {
      if (depthOf(history.state) > 0) history.back();
      // Deep-linked straight into a sub-screen: Back would leave the site, so
      // send them to the title instead of off the edge of the app.
      else apply('title', 'replace');
    },
    subscribe(fn): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    destroy(): void {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onHash);
      listeners.clear();
    },
  };
}
