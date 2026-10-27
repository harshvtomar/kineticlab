/** Collision telemetry is observational only. No impulses, physics forces or
 * body transforms are changed when these records are updated.
 */
export type ContactRecord = Readonly<{
  sequence: number;
  type: 'begin' | 'end';
  first: string;
  second: string;
}>;
export type ContactLedger = Readonly<{
  activeKeys: readonly string[];
  records: readonly ContactRecord[];
  starts: number;
  ends: number;
}>;

export const EMPTY_CONTACT_LEDGER: ContactLedger = Object.freeze({
  activeKeys: Object.freeze([]), records: Object.freeze([]), starts: 0, ends: 0,
});
const SAFE_ID = /^[A-Za-z][A-Za-z0-9_-]{0,99}$/;

/** Canonical ID pair avoids double-counting callbacks from both rigid bodies. */
export function contactKey(a: string, b: string): string | null {
  if (!SAFE_ID.test(a) || !SAFE_ID.test(b) || a === b) return null;
  return [a, b].sort().join('|');
}

export function updateContacts(
  ledger: ContactLedger,
  kind: 'begin' | 'end',
  a: string,
  b: string,
  maxRecords = 20,
): ContactLedger {
  const key = contactKey(a, b);
  if (!key) return ledger;
  const active = ledger.activeKeys.includes(key);
  if ((kind === 'begin' && active) || (kind === 'end' && !active)) return ledger;
  const [first, second] = key.split('|');
  const record: ContactRecord = Object.freeze({sequence: ledger.starts + ledger.ends + 1, type: kind, first, second});
  return Object.freeze({
    activeKeys: Object.freeze(kind === 'begin' ? [...ledger.activeKeys, key].sort() : ledger.activeKeys.filter(k => k !== key)),
    records: Object.freeze([...ledger.records, record].slice(-Math.max(0, Math.min(100, Math.floor(maxRecords) || 0)))),
    starts: ledger.starts + (kind === 'begin' ? 1 : 0),
    ends: ledger.ends + (kind === 'end' ? 1 : 0),
  });
}

/** Clearing history keeps currently active pairs, so future exits stay balanced. */
export function clearContactHistory(ledger: ContactLedger): ContactLedger {
  return Object.freeze({...ledger, records: Object.freeze([])});
}

/** Strict, fail-closed extraction from Rapier collision event metadata. */
export function collisionOtherId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const body = (value as {rigidBody?: unknown}).rigidBody;
  if (!body || typeof body !== 'object') return null;
  const data = (body as {userData?: unknown}).userData;
  if (!data || typeof data !== 'object') return null;
  const id = (data as {kineticlabId?: unknown}).kineticlabId;
  return typeof id === 'string' && SAFE_ID.test(id) ? id : null;
}
