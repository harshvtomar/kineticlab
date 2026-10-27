import { describe, expect, it } from 'vitest';
import { STARTER_SCENE } from './starter-scene';
import { collisionMask, groupsMayInteract, collisionGroupsForObject, SENSOR_COLLISION_GROUPS, SENSOR_REGION, sensorMayDetect, COLLISION_MODES } from './collision-system';

const ground = STARTER_SCENE.objects.find(o => o.kind === 'ground')!;
const ramp = STARTER_SCENE.objects.find(o => o.kind === 'ramp')!;
const ball = STARTER_SCENE.objects.find(o => o.kind === 'ball')!;

describe('Stage 9 Rapier collision groups', () => {
  it('uses exact packed membership and filter bits', () => {
    expect(collisionMask([0, 2, 3], [2])).toBe(0x000d0004);
    expect(collisionMask([1], [0, 2])).toBe(0x00020005);
    expect(collisionMask([], [])).toBe(0);
  });
  it('rejects invalid group indices', () => {
    for (const n of [-1,16,NaN,Infinity,1.5]) expect(() => collisionMask([n],[0])).toThrow();
  });
  it('evaluates two-sided filtering, not one-sided filtering', () => {
    expect(groupsMayInteract(collisionMask([1],[0]),collisionMask([0],[1]))).toBe(true);
    expect(groupsMayInteract(collisionMask([1],[0]),collisionMask([0],[2]))).toBe(false);
    expect(groupsMayInteract(collisionMask([0],[1]),collisionMask([0],[1]))).toBe(false);
  });
  it.each(COLLISION_MODES)('keeps ball-ground and ball-ramp collisions in %s', mode => {
    expect(groupsMayInteract(collisionGroupsForObject(ball,mode),collisionGroupsForObject(ground,mode))).toBe(true);
    expect(groupsMayInteract(collisionGroupsForObject(ball,mode),collisionGroupsForObject(ramp,mode))).toBe(true);
  });
  it('can disable ball-ball contacts without disabling gravity or ground', () => {
    expect(groupsMayInteract(collisionGroupsForObject(ball,'all'),collisionGroupsForObject(ball,'all'))).toBe(true);
    expect(groupsMayInteract(collisionGroupsForObject(ball,'separate-balls'),collisionGroupsForObject(ball,'separate-balls'))).toBe(false);
  });
  it('sensor intersections accept balls but reject fixed objects', () => {
    expect(sensorMayDetect(ball,'all')).toBe(true);
    expect(sensorMayDetect(ball,'separate-balls')).toBe(true);
    expect(sensorMayDetect(ramp,'all')).toBe(false);
    expect(groupsMayInteract(SENSOR_COLLISION_GROUPS,collisionGroupsForObject(ground,'all'))).toBe(false);
  });
  it('does not mutate source scene or resize its object schema', () => {
    expect(SENSOR_REGION.halfExtents.every(n=>n>0)).toBe(true);
    expect(STARTER_SCENE.objects).toHaveLength(4);
    expect(Object.keys(STARTER_SCENE)).toEqual(['schemaVersion','objects']);
  });
  it('fails closed on unsupported collision mode',()=>{
    expect(() => collisionGroupsForObject(ball,'invalid' as never)).toThrow();
  });
});
