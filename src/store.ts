/**
 * Everything the shell keeps on the device, namespaced `strata.*`.
 *
 * localStorage is untrusted input, per docs/ARCHITECTURE.md § Persistence: a
 * player can edit it, a save written by an older build may be missing fields,
 * and Safari *throws* on access when storage is blocked (Private Browsing, or
 * "Block All Cookies"). So every access is wrapped and every read is validated
 * field by field. A corrupt or unavailable store degrades to "no save" — it
 * never throws into the caller.
 */

const NS = 'strata.';

function getRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(NS + key);
  } catch {
    return null; // Storage blocked. Behave exactly as if it were empty.
  }
}

function setRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(NS + key, value);
    return true;
  } catch {
    return false; // Blocked or over quota; the caller decides whether that matters.
  }
}

/** Parses to a plain object, or null for anything else — including arrays. */
function parseObject(raw: string | null): Record<string, unknown> | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * The local player record. Mirrors `Account` from Contracts v1 plus `cellId`,
 * which M5 needs to pan down to the last restored cell.
 *
 * Only `name` and `createdAt` are required — those are what make a save "real".
 * The rest arrive in M4 (palette, silhouette) and M5 (cellId), so a save written
 * by an earlier build stays readable instead of being thrown away.
 */
export type Save = {
  name: string;
  createdAt: string;
  palette: string | null;
  silhouette: number | null;
  cellId: string | null;
};

/** The one question M2 asks of storage: is there a player here already? */
export function readSave(): Save | null {
  const raw = parseObject(getRaw('save'));
  if (!raw) return null;

  const name = str(raw.name);
  const createdAt = str(raw.createdAt);
  if (!name || !createdAt) return null; // Not a save, whatever else it contains.

  const silhouette =
    typeof raw.silhouette === 'number' && Number.isInteger(raw.silhouette)
      ? raw.silhouette
      : null;

  return { name, createdAt, palette: str(raw.palette), silhouette, cellId: str(raw.cellId) };
}

/** M4 is the first caller in the app; M2 ships it so the branch is testable. */
export function writeSave(save: Save): boolean {
  return setRaw('save', JSON.stringify(save));
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(NS + 'save');
  } catch {
    // Nothing to do — if we cannot reach storage there is nothing to clear.
  }
}
