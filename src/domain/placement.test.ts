import { describe, expect, it } from 'vitest';
import { STARTER_SCENE } from './starter-scene';
import { createMechanicalScene, deserializeMechanicalScene, serializeMechanicalScene } from './registry';
import { removeMechanicalObject } from './scene-edit';
import { allocateMechanicalId, isPlaceableKind, makePlacementObject, placementGroundHeight, placeMechanicalObject, snapToPlacementGrid } from './placement';

describe('Stage 6 placement: supported template and schema safety', () => {
  it.each(['ball','stopper','ramp'])('allows %s primitive', kind => expect(isPlaceableKind(kind)).toBe(true));
  it.each(['ground','gear','spring','domino',null,1])('rejects unsupported %s', kind => expect(isPlaceableKind(kind)).toBe(false));
  it('never permits unsupported ground placement', () => expect(placeMechanicalObject(STARTER_SCENE, 'ground', 4, 4).status).toBe('invalid-kind'));
  it('uses a 0.5m snap grid for positive and negative coordinates', () => {
    expect(snapToPlacementGrid(1.26)).toBe(1.5);
    expect(snapToPlacementGrid(-1.24)).toBe(-1);
  });
  it.each([NaN,Infinity,-Infinity])('rejects nonfinite coordinate %s', v => {
    expect(() => snapToPlacementGrid(v)).toThrow();
    expect(placeMechanicalObject(STARTER_SCENE, 'ball', v, 2).status).toBe('invalid-position');
  });
  it('has ground height zero in the canonical scene', () => expect(placementGroundHeight(STARTER_SCENE)).toBe(0));
  it('rejects scenes without a ground', () => {
    const scene = createMechanicalScene({ schemaVersion: 1, objects: STARTER_SCENE.objects.filter(o => o.kind !== 'ground') });
    expect(placeMechanicalObject(scene, 'ball', 3, 3).status).toBe('outside-ground');
  });
  it('does not mutate the canonical scene or template', () => {
    const json = serializeMechanicalScene(STARTER_SCENE);
    const result = placeMechanicalObject(STARTER_SCENE, 'ball', 4, -3);
    expect(result.status).toBe('placed');
    expect(serializeMechanicalScene(STARTER_SCENE)).toBe(json);
    expect(Object.isFrozen(STARTER_SCENE)).toBe(true);
    expect(result.scene).not.toBe(STARTER_SCENE);
  });
  it('allocates stable unique IDs from current registry', () => {
    expect(allocateMechanicalId(STARTER_SCENE, 'ball')).toBe('ball-new-001');
    const result = placeMechanicalObject(STARTER_SCENE, 'ball', 4, -3);
    expect(result.status).toBe('placed');
    expect(allocateMechanicalId(result.scene, 'ball')).toBe('ball-new-002');
  });
  it.each([
    ['ball',4,-3],['stopper',4,3],['ramp',0,3.5],
  ] as const)('places a valid %s using schema-v1 physics and materials', (kind,x,z) => {
    const result = placeMechanicalObject(STARTER_SCENE,kind,x,z);
    expect(result.status).toBe('placed');
    if (result.status !== 'placed') return;
    const obj = result.scene.objects.at(-1)!;
    expect(obj.kind).toBe(kind);
    expect(obj.id).toBe(result.placedId);
    expect(result.scene.objects).toHaveLength(5);
    expect(obj.transform.position[1]).toBeGreaterThan(0);
    expect(deserializeMechanicalScene(serializeMechanicalScene(result.scene))).toEqual(result.scene);
  });
  it('rejects large objects placed outside ground boundaries', () => {
    expect(placeMechanicalObject(STARTER_SCENE, 'ramp', 5, -4).status).toBe('outside-ground');
    expect(placeMechanicalObject(STARTER_SCENE, 'ball', 100, 0).status).toBe('outside-ground');
  });
  it('rejects overlaps with original ramp', () => expect(placeMechanicalObject(STARTER_SCENE,'ball',0,0).status).toBe('overlap'));
  it('rejects duplicate same-position additions', () => {
    const first = placeMechanicalObject(STARTER_SCENE,'ball',4,-3);
    expect(first.status).toBe('placed');
    expect(placeMechanicalObject(first.scene,'ball',4,-3).status).toBe('overlap');
  });
  it('preserves original on failure', () => {
    expect(placeMechanicalObject(STARTER_SCENE, 'ball', 0, 0).scene).toBe(STARTER_SCENE);
    expect(placeMechanicalObject(STARTER_SCENE, 'ball', Infinity, 0).scene).toBe(STARTER_SCENE);
  });
  it('retains ground protection while allowing new object deletion', () => {
    const result = placeMechanicalObject(STARTER_SCENE, 'ball', 4, -3);
    expect(result.status).toBe('placed');
    if (result.status !== 'placed') return;
    const removed = removeMechanicalObject(result.scene,result.placedId);
    expect(removed.status).toBe('removed');
    expect(removed.scene.objects).toEqual(STARTER_SCENE.objects);
    expect(removeMechanicalObject(result.scene,'ground-01').status).toBe('protected');
  });
  it('creates a labeled, validated immutable object from template', () => {
    const obj = makePlacementObject(STARTER_SCENE,'stopper',4,3);
    expect(obj.id).toBe('stopper-new-001');
    expect(obj.label).toMatch(/^Block /);
    expect(obj.physics.bodyType).toBe('fixed');
    expect(obj.transform.position[0]).toBe(4);
  });
});
