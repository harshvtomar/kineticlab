import { describe, expect, it } from 'vitest';
import { STARTER_SCENE, migrateLegacyStarterScene } from './starter-scene';
import { LEGACY_STARTER_OBJECTS, PHYSICS_SETTINGS } from './legacy-fixtures';
import { STARTER_OBJECTS, validateStarterScene } from './fixtures';
import { selectMechanicalObject, validateMechanicalScene } from './registry';

describe('Stage 4 legacy migration and Rapier invariants', () => {
  it('migrates all four legacy bodies with unchanged order, IDs and positions', () => {
    expect(STARTER_SCENE.objects.map(obj => [obj.id,obj.transform.position])).toEqual(LEGACY_STARTER_OBJECTS.map(obj => [obj.id,obj.position]));
    expect(validateStarterScene(STARTER_OBJECTS)).toEqual([]);
    expect(STARTER_OBJECTS.map(o => o.id)).toEqual(LEGACY_STARTER_OBJECTS.map(o => o.id));
  });
  it('projects original Stage 1–3 API from normalized registry', () => {
    for (const old of STARTER_OBJECTS) {
      const current = selectMechanicalObject(STARTER_SCENE, old.id)!;
      expect(current.label).toBe(old.label);
      expect(current.kind).toBe(old.kind);
      expect(current.transform.position).toEqual(old.position);
      expect(current.physics.bodyType === 'dynamic').toBe(old.dynamic);
    }
  });
  it('preserves the exact original ground mesh and pose', () => {
    const obj=selectMechanicalObject(STARTER_SCENE,'ground-01')!;
    expect(obj.geometry).toEqual({shape:'box',dimensions:[12,0.4,10]});
    expect(obj.transform).toEqual({position:[0,-0.2,0],rotation:[0,0,0],scale:[1,1,1]});
    expect(obj.physics).toEqual({bodyType:'fixed',collider:'cuboid'});
    expect(obj.visual).toEqual({color:'#1b3041',roughness:0.95,metalness:0,castShadow:false,receiveShadow:true});
  });
  it('preserves exact ramp rotation, shape and visual material', () => {
    const obj=selectMechanicalObject(STARTER_SCENE,'ramp-01')!;
    expect(obj.transform.rotation).toEqual([0,0,-0.2]);
    expect(obj.geometry).toEqual({shape:'box',dimensions:[4.3,0.24,2.2]});
    expect(obj.visual).toEqual({color:'#e6a256',roughness:0.55,metalness:0.48,castShadow:true,receiveShadow:true});
  });
  it('preserves ball gravity, radius, CCD, damping, friction and restitution', () => {
    const obj=selectMechanicalObject(STARTER_SCENE,'ball-01')!;
    expect(PHYSICS_SETTINGS.gravity).toEqual([0,-9.81,0]);
    expect(obj.geometry).toEqual({shape:'sphere',radius:0.34,widthSegments:40,heightSegments:28});
    expect(obj.physics).toEqual({bodyType:'dynamic',collider:'ball',friction:0.55,restitution:0.35,linearDamping:0.06,angularDamping:0.04,canSleep:false,ccd:true});
  });
  it('preserves impact block shape, color and fixed body', () => {
    const obj=selectMechanicalObject(STARTER_SCENE,'stopper-01')!;
    expect(obj.geometry).toEqual({shape:'box', dimensions:[0.45,0.84,2.1]});
    expect(obj.physics.bodyType).toBe('fixed');
    expect(obj.visual.color).toBe('#748ca4');
  });
  it('rejects an incompatible legacy dynamic/fixed assignment', () => {
    expect(() => migrateLegacyStarterScene(LEGACY_STARTER_OBJECTS.map(o=>o.kind==='ground'?{...o,dynamic:true}:o))).toThrow('Ground must be fixed');
    expect(() => migrateLegacyStarterScene(LEGACY_STARTER_OBJECTS.map(o=>o.kind==='ball'?{...o,dynamic:false}:o))).toThrow('Ball must be dynamic');
  });
  it('rejects legacy duplicates and nonfinite positions via registry validation', () => {
    expect(() => migrateLegacyStarterScene([...LEGACY_STARTER_OBJECTS,LEGACY_STARTER_OBJECTS[0]])).toThrow('Duplicate object ID');
    expect(() => migrateLegacyStarterScene(LEGACY_STARTER_OBJECTS.map(o=>o.kind==='ball'?{...o,position:[NaN,2.7,0]}:o))).toThrow('Position must contain');
  });
  it('does not mutate Stage 3 legacy descriptors during migration', () => {
    const snapshot=JSON.stringify(LEGACY_STARTER_OBJECTS);
    const next=migrateLegacyStarterScene(LEGACY_STARTER_OBJECTS);
    expect(JSON.stringify(LEGACY_STARTER_OBJECTS)).toBe(snapshot);
    expect(next).toEqual(STARTER_SCENE);
    expect(validateMechanicalScene(next)).toEqual([]);
  });
});
