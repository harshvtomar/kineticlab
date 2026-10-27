import { describe, expect, it } from 'vitest';
import { STARTER_SCENE } from './starter-scene';
import { createMechanicalScene, deserializeMechanicalScene, selectMechanicalObject, serializeMechanicalScene } from './registry';
import { isRemovableObject, removeMechanicalObject } from './scene-edit';

describe('Stage 5 immutable deletion policy', () => {
  it('protects ground plane', () => {
    const object = selectMechanicalObject(STARTER_SCENE, 'ground-01');
    expect(object && isRemovableObject(object)).toBe(false);
  });
  it.each(['ball-01', 'ramp-01', 'stopper-01'])('allows removal of %s', id => {
    const object = selectMechanicalObject(STARTER_SCENE, id);
    expect(object && isRemovableObject(object)).toBe(true);
    const result = removeMechanicalObject(STARTER_SCENE, id);
    expect(result.status).toBe('removed');
    expect(result.scene.objects).toHaveLength(3);
    expect(selectMechanicalObject(result.scene, id)).toBeUndefined();
    expect(selectMechanicalObject(STARTER_SCENE, id)).toBeDefined();
  });
  it('protects ground without changing scene reference', () => {
    const result = removeMechanicalObject(STARTER_SCENE, 'ground-01');
    expect(result.status).toBe('protected');
    expect(result.scene).toBe(STARTER_SCENE);
  });
  it('does not mutate for nonexistent identifiers', () => {
    const result = removeMechanicalObject(STARTER_SCENE, 'ghost-42');
    expect(result.status).toBe('missing');
    expect(result.scene).toBe(STARTER_SCENE);
  });
  it('removes only one identified object and preserves survivors exactly', () => {
    const result = removeMechanicalObject(STARTER_SCENE, 'ball-01');
    expect(result.scene.objects.map(o => o.id)).toEqual(STARTER_SCENE.objects.filter(o => o.id !== 'ball-01').map(o => o.id));
    expect(result.scene.objects[0]).toEqual(STARTER_SCENE.objects[0]);
  });
  it('retains schema and stable JSON roundtrip', () => {
    const result = removeMechanicalObject(STARTER_SCENE, 'ramp-01');
    expect(result.scene.schemaVersion).toBe(1);
    expect(deserializeMechanicalScene(serializeMechanicalScene(result.scene))).toEqual(result.scene);
  });
  it('returns a deep frozen scene and arrays', () => {
    const result = removeMechanicalObject(STARTER_SCENE, 'stopper-01');
    expect(Object.isFrozen(result.scene)).toBe(true);
    expect(Object.isFrozen(result.scene.objects)).toBe(true);
    expect(Object.isFrozen(result.scene.objects[0].transform.position)).toBe(true);
  });
  it('supports independent edits to two removable objects', () => {
    const a = removeMechanicalObject(STARTER_SCENE, 'ball-01');
    const b = removeMechanicalObject(a.scene, 'stopper-01');
    expect(b.status).toBe('removed');
    expect(b.scene.objects).toHaveLength(2);
  });
  it('preserves empty-scene schema but protects default ground', () => {
    const empty = createMechanicalScene({ schemaVersion: 1, objects: [] });
    expect(removeMechanicalObject(empty, 'ground-01').status).toBe('missing');
    expect(removeMechanicalObject(STARTER_SCENE, 'ground-01').status).toBe('protected');
  });
});
