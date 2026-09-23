/**
 * Sign-in providers offered on the NEW screen.
 *
 * ⚠️ THE MARKS BELOW ARE SIMPLIFIED PLACEHOLDERS, drawn here so the layout is
 * real. They are not the companies' official logos. Before this ships publicly,
 * replace each `mark` with the official asset from that company's brand page
 * and follow their guidelines — most require exact artwork, minimum clear space
 * and specific button wording ("Sign in with X"), and several forbid redrawing
 * the mark at all.
 *
 * ⚠️ NOTHING HERE IS WIRED YET. `status` records what actually exists behind
 * each button so the UI can tell the truth when tapped, rather than pretending.
 * A provider button must never collect that provider's password or seed phrase
 * in this app — real sign-in redirects to the provider (OAuth) or asks the
 * wallet extension to sign a challenge (EIP-1193). Keep it that way.
 */

export type ConnectorId = 'coinbase' | 'metamask' | 'robinhood' | 'cashapp' | 'email';

export type ConnectorStatus =
  /** A documented integration exists; it just is not built yet. */
  | 'planned'
  /** No public third-party sign-in exists. Needs a decision, not code. */
  | 'unavailable';

export type Connector = {
  id: ConnectorId;
  label: string;
  /** Brand colour, used for the mark plate and the pressed state. */
  brand: string;
  /** Inline SVG, 24x24 viewBox. Placeholder — see the file note above. */
  mark: string;
  status: ConnectorStatus;
  /** Shown when tapped. Specific and true; no "coming soon" hand-waving. */
  note: string;
};

export const CONNECTORS: Connector[] = [
  {
    id: 'coinbase',
    label: 'Coinbase',
    brand: '#0052FF',
    mark:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="11" fill="currentColor"/>' +
      '<rect x="8.6" y="8.6" width="6.8" height="6.8" rx="1.7" fill="#fff"/>' +
      '</svg>',
    status: 'planned',
    note: 'Coinbase has two different sign-ins — OAuth for a coinbase.com account, or the Wallet SDK for self-custody. M3 has to pick one.',
  },
  {
    id: 'metamask',
    label: 'MetaMask',
    brand: '#E2761B',
    mark:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      // Simplified fox mask: two ears over a shield.
      '<path fill="currentColor" d="M2.6 3.1 10 7.4h4l7.4-4.3-1.4 5.7 1.3 2.6-1 1.2.7 2.3-2.1 1.3-.3 2.1-4-.9h-4.2l-4 .9-.3-2.1-2.1-1.3.7-2.3-1-1.2 1.3-2.6z"/>' +
      '<path fill="#fff" opacity=".82" d="M9.1 11.2h5.8l.7 2.9-3.6 1.2-3.6-1.2z"/>' +
      '</svg>',
    status: 'planned',
    note: 'MetaMask is the straightforward one: EIP-1193 in the browser, then Sign-In With Ethereum (EIP-4361). Needs a backend to verify the signature.',
  },
  {
    id: 'robinhood',
    label: 'Robinhood',
    brand: '#00C805',
    mark:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      // Simplified feather.
      '<path fill="currentColor" d="M18.6 2.6c-5 .5-8.4 2.6-10 6.2-1.1 2.5-1 5 .1 7.2L5 19.7l1.5 1.5 3.7-3.7c2.3 1.1 4.8 1.1 7-.2 3.4-2 5-5.9 5.1-11.5 0-1.9-.2-2.9-.6-3.2-.4-.3-1.4-.2-3.1 0z"/>' +
      '<path fill="#fff" opacity=".55" d="M17.7 5.6 9.4 14l.9.9 8.3-8.4z"/>' +
      '</svg>',
    status: 'unavailable',
    note: 'Robinhood publishes no third-party sign-in. Their API is key-based for your own account, not an identity provider. This button has nothing to connect to.',
  },
  {
    id: 'cashapp',
    label: 'Cash App',
    brand: '#00D54B',
    mark:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="currentColor"/>' +
      '<path fill="#fff" d="M13.4 5.2h-1.6l-.3 1.5c-1.9.1-3.3 1.2-3.3 3 0 1.9 1.6 2.6 3 3 1.2.4 1.8.7 1.8 1.3 0 .7-.7 1.1-1.6 1.1-1 0-2-.4-2.8-1.1l-1.2 1.4c.8.8 1.9 1.3 3 1.4l-.3 1.5h1.6l.3-1.5c2-.2 3.3-1.4 3.3-3.1 0-1.9-1.6-2.6-3.1-3-1.1-.4-1.7-.6-1.7-1.2 0-.6.6-1 1.5-1 .9 0 1.7.3 2.4.9l1.2-1.4c-.7-.6-1.5-1-2.4-1.2z"/>' +
      '</svg>',
    status: 'unavailable',
    note: 'Cash App Pay is a payment method through Square, not a way to sign in. There is no "Sign in with Cash App" to build against.',
  },
  {
    id: 'email',
    label: 'Continue with email',
    brand: '#6FF2E4',
    mark:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="2" y="4.5" width="20" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
      '<path d="M3.2 6.6 12 13l8.8-6.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>',
    status: 'planned',
    note: 'The route the seed specifies: email OTP via Supabase, with the public anon key read from /config.json at runtime.',
  },
];
