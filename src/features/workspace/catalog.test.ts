import { describe, it, expect } from 'vitest';
import { COMPONENT_CATALOG, filterCatalog } from './catalog';

describe('component catalog preview', () => {
  it('contains six unique mechanically labeled entries', () => {
    expect(COMPONENT_CATALOG).toHaveLength(6);
    expect(new Set(COMPONENT_CATALOG.map(item => item.id)).size).toBe(6);
    expect(COMPONENT_CATALOG.every(item => item.stage.length > 0)).toBe(true);
  });
  it('searches label and supporting description without case sensitivity', () => {
    expect(filterCatalog('GEARS', 'all').map(x => x.id)).toEqual(['gears']);
    expect(filterCatalog('adjustable slope', 'all').map(x => x.id)).toEqual(['ramps']);
  });
  it('filters by category and trims whitespace', () => {
    expect(filterCatalog('  ', 'mechanisms').map(x => x.id)).toEqual(['levers', 'gears', 'springs']);
    expect(filterCatalog('domino', 'mechanisms')).toHaveLength(0);
  });
  it('returns an empty set for nonmatching input', () => {
    expect(filterCatalog('jet engine', 'all')).toEqual([]);
  });
});
