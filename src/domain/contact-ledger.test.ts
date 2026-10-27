import { describe, expect, it } from 'vitest';
import {EMPTY_CONTACT_LEDGER, contactKey, updateContacts, clearContactHistory, collisionOtherId} from './contact-ledger';

describe('Stage 8 collision telemetry', () => {
  it('canonicalizes pairs to avoid double counting', () => {
    const once=updateContacts(EMPTY_CONTACT_LEDGER,'begin','ball-01','ground-01');
    const twice=updateContacts(once,'begin','ground-01','ball-01');
    expect(twice).toBe(once);
    expect(twice.starts).toBe(1);
    expect(twice.activeKeys).toHaveLength(1);
  });
  it('balances enter/exit events and drops unpaired exits', () => {
    const start=updateContacts(EMPTY_CONTACT_LEDGER,'begin','ball-01','ground-01');
    const ended=updateContacts(start,'end','ground-01','ball-01');
    expect(ended.ends).toBe(1);
    expect(ended.activeKeys).toEqual([]);
    expect(updateContacts(ended,'end','ground-01','ball-01')).toBe(ended);
  });
  it('refuses invalid, identical, and untrusted IDs', () => {
    expect(contactKey('ball-01','ball-01')).toBe(null);
    expect(contactKey('','ground-01')).toBe(null);
    expect(updateContacts(EMPTY_CONTACT_LEDGER,'begin','a|b','c')).toBe(EMPTY_CONTACT_LEDGER);
  });
  it('bounds history while preserving cumulative counts', () => {
    let state=EMPTY_CONTACT_LEDGER;
    for(let i=0;i<50;i++){
      state=updateContacts(state,'begin','ball-01',`stopper-${i}`,5);
      state=updateContacts(state,'end','ball-01',`stopper-${i}`,5);
    }
    expect(state.records).toHaveLength(5);
    expect(state.starts).toBe(50);
    expect(state.ends).toBe(50);
    expect(state.activeKeys).toHaveLength(0);
  });
  it('clears only history without resetting live pairs', () => {
    const active=updateContacts(EMPTY_CONTACT_LEDGER,'begin','ball-01','ramp-01');
    const cleared=clearContactHistory(active);
    expect(cleared.activeKeys).toEqual(active.activeKeys);
    expect(cleared.records).toHaveLength(0);
    expect(updateContacts(cleared,'end','ball-01','ramp-01').activeKeys).toEqual([]);
  });
  it('does not mutate frozen previous snapshots', () => {
    const first=updateContacts(EMPTY_CONTACT_LEDGER,'begin','ball-01','ground-01');
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.records)).toBe(true);
    const after=updateContacts(first,'end','ball-01','ground-01');
    expect(first.activeKeys).toHaveLength(1);
    expect(after.activeKeys).toHaveLength(0);
  });
  it('extracts only explicit Rapier rigid-body metadata', () => {
    expect(collisionOtherId({rigidBody:{userData:{kineticlabId:'ground-01'}}})).toBe('ground-01');
    expect(collisionOtherId({rigidBody:{userData:{kineticlabId:'bad id'}}})).toBeNull();
    expect(collisionOtherId({rigidBody:null})).toBeNull();
  });
});
