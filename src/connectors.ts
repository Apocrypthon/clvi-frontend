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

export type ConnectorId = 'coinbase' | 'metamask' | 'apple' | 'sms' | 'email';

/**
 * `wallet` = bring your own crypto wallet. `account` = an ordinary sign-in that
 * yields a custodial Guardian account. The NEW screen rules a line between them
 * because they mean very different things for who holds the keys.
 */
export type ConnectorGroup = 'wallet' | 'account';

export type ConnectorStatus =
  /** A documented integration exists; it just is not built yet. */
  | 'planned'
  /** No public third-party sign-in exists. Needs a decision, not code. */
  | 'unavailable';

export type Connector = {
  id: ConnectorId;
  label: string;
  group: ConnectorGroup;
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
    group: 'wallet',
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
    group: 'wallet',
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
    id: 'apple',
    label: 'Sign in with Apple',
    group: 'account',
    brand: '#FFFFFF',
    mark:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M16.2 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.3-.9-2.3-3.2z"/>' +
      '<path fill="currentColor" d="M14.1 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z"/>' +
      '</svg>',
    status: 'planned',
    note: 'Supabase supports Apple as an OAuth provider, so this is close to the email path. Apple ships exact button artwork and forbids altering it — the mark here is a placeholder.',
  },
  {
    id: 'sms',
    label: 'Continue with SMS',
    group: 'account',
    brand: '#F6B57A',
    mark:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M3 6.4a2.6 2.6 0 0 1 2.6-2.6h12.8A2.6 2.6 0 0 1 21 6.4v7.8a2.6 2.6 0 0 1-2.6 2.6H9.3L4.6 20.6a.5.5 0 0 1-.8-.4v-3.5A2.6 2.6 0 0 1 3 14.2z"/>' +
      '<circle cx="8.4" cy="10.3" r="1.15" fill="currentColor"/>' +
      '<circle cx="12" cy="10.3" r="1.15" fill="currentColor"/>' +
      '<circle cx="15.6" cy="10.3" r="1.15" fill="currentColor"/>' +
      '</svg>',
    status: 'planned',
    note: 'Phone OTP, also native to Supabase — but it needs a paid SMS provider (Twilio and friends) and a rate limit, or SMS-pumping fraud will bill you for it.',
  },
  {
    id: 'email',
    label: 'Continue with email',
    group: 'account',
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
