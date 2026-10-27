import { describe, expect, it } from 'vitest';
import { PHYSICS_SETTINGS, STARTER_OBJECTS, validateStarterScene } from './fixtures';

describe('starter mechanical scene contract', () => {
  it('contains four uniquely named rigid bodies with finite positions', () => {
    expect(STARTER_OBJECTS).toHaveLength(4);
    expect(validateStarterScene(STARTER_OBJECTS)).toEqual([]);
  });

  it('uses earth-like gravity and positive ball radius', () => {
    expect(PHYSICS_SETTINGS.gravity).toEqual([0, -9.81, 0]);
    expect(PHYSICS_SETTINGS.ballRadius).toBeGreaterThan(0);
  });

  it('rejects duplicate ids', () => {
    const scene = [...STARTER_OBJECTS, STARTER_OBJECTS[0]];
    expect(validateStarterScene(scene)).toContain('Duplicate object id: ground-01');
  });

  it('rejects an invalid coordinate', () => {
    const modified = [{ ...STARTER_OBJECTS[0], position: [Infinity, 0, 0] as const }, ...STARTER_OBJECTS.slice(1)];
    expect(validateStarterScene(modified)).toContain('Invalid position: ground-01');
  });

  it('requires ground and at least one moving body', () => {
    expect(validateStarterScene([])).toEqual(['Scene has no ground', 'Scene has no moving objects']);
    expect(validateStarterScene(STARTER_OBJECTS.filter(item => !item.dynamic))).toContain('Scene has no moving objects');
  });
});
