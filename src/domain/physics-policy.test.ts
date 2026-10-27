import { describe, expect, it } from 'vitest';
import { PHYSICS_POLICY, physicsBlueprint, physicsBlueprints } from './physics-policy';
import { STARTER_SCENE } from './starter-scene';
import { placeMechanicalObject } from './placement';

describe('Stage 8 fixed-step physics policy', () => {
  it('uses SI gravity with a fixed positive timestep', () => {
    expect(PHYSICS_POLICY.gravity).toEqual([0, -9.81, 0]);
    expect(PHYSICS_POLICY.timestep).toBeCloseTo(1 / 60, 10);
    expect(PHYSICS_POLICY.updateLoop).toBe('follow');
  });
  it('preserves the existing body kinds and authored starting poses', () => {
    const result = physicsBlueprints(STARTER_SCENE);
    expect(result).toHaveLength(4);
    expect(result.map(x => x.bodyType)).toEqual(['fixed', 'fixed', 'dynamic', 'fixed']);
    expect(result.map(x => x.position)).toEqual(STARTER_SCENE.objects.map(x => x.transform.position));
  });
  it('keeps dynamic sphere material, damping contract and CCD without changing schema', () => {
    const sphere = STARTER_SCENE.objects.find(x => x.kind === 'ball')!;
    const blueprint = physicsBlueprint(sphere);
    expect(blueprint).toMatchObject({collider:'ball',bodyType:'dynamic', friction:0.55,restitution:0.35,ccd:true});
    expect(STARTER_SCENE.schemaVersion).toBe(1);
  });
  it('uses Rapier legacy defaults on fixed colliders', () => {
    const fixed = STARTER_SCENE.objects.filter(x => x.physics.bodyType === 'fixed');
    expect(fixed.every(x => physicsBlueprint(x).friction === 0.5)).toBe(true);
    expect(fixed.every(x => physicsBlueprint(x).restitution === 0)).toBe(true);
  });
  it('does not change the scene by projecting descriptions', () => {
    const before = JSON.stringify(STARTER_SCENE);
    const projected = physicsBlueprints(STARTER_SCENE);
    expect(Object.isFrozen(projected)).toBe(true);
    expect(JSON.stringify(STARTER_SCENE)).toBe(before);
  });
  it('applies the same policy to newly placed spheres', () => {
    const result = placeMechanicalObject(STARTER_SCENE,'ball',4,-3);
    expect(result.status).toBe('placed');
    if(result.status!=='placed')return;
    const ball=result.scene.objects.find(x=>x.id===result.placedId)!;
    expect(physicsBlueprint(ball).collider).toBe('ball');
  });
});
