/** Stage 9 collision filtering: runtime-only policy, not a scene-schema migration.
 * Each Rapier group uses a 16-bit membership and 16-bit symmetric filter mask.
 * Group 0: fixed fixtures; 1: dynamic balls; 2: non-solid sensor regions.
 */
import type { MechanicalObject } from './registry';

export type CollisionMode = 'all' | 'separate-balls';
export const COLLISION_MODES: readonly CollisionMode[] = Object.freeze(['all', 'separate-balls']);
export const COLLISION_LAYERS = Object.freeze({ FIXED: 0, BALL: 1, SENSOR: 2 } as const);

function bits(indices: readonly number[]): number {
  if (indices.some(index => !Number.isInteger(index) || index < 0 || index > 15)) {
    throw new RangeError('Rapier group indices must be integers from 0 to 15');
  }
  return indices.reduce((mask, index) => mask | (1 << index), 0);
}

/** Exact Rapier packed collisionGroups value. */
export function collisionMask(memberships: readonly number[], filters: readonly number[]): number {
  return (((bits(memberships) << 16) | bits(filters)) >>> 0);
}

/** Both filters must accept the other membership for a contact/intersection. */
export function groupsMayInteract(a: number, b: number): boolean {
  const aMembership = (a >>> 16) & 0xffff;
  const aFilter = a & 0xffff;
  const bMembership = (b >>> 16) & 0xffff;
  const bFilter = b & 0xffff;
  return (aMembership & bFilter) !== 0 && (bMembership & aFilter) !== 0;
}

/** Preserve dynamic-vs-ground collision even in the separate-balls experiment. */
export function collisionGroupsForObject(object: MechanicalObject, mode: CollisionMode): number {
  if (mode !== 'all' && mode !== 'separate-balls') throw new Error('Unknown collision mode');
  if (object.physics.bodyType === 'fixed') {
    return collisionMask([COLLISION_LAYERS.FIXED], [COLLISION_LAYERS.BALL]);
  }
  const filters: number[] = [COLLISION_LAYERS.FIXED, COLLISION_LAYERS.SENSOR];
  if (mode === 'all') filters.push(COLLISION_LAYERS.BALL);
  return collisionMask([COLLISION_LAYERS.BALL], filters);
}

/** This invisible fixture reports intersections but cannot exert contact forces. */
export const SENSOR_REGION = Object.freeze({
  id: 'trigger-zone-01',
  center: [0, 0.8, 0] as readonly [number, number, number],
  halfExtents: [1.65, 0.75, 1.65] as readonly [number, number, number],
});
export const SENSOR_COLLISION_GROUPS = collisionMask([COLLISION_LAYERS.SENSOR], [COLLISION_LAYERS.BALL]);
export function sensorMayDetect(object: MechanicalObject, mode: CollisionMode): boolean {
  return groupsMayInteract(collisionGroupsForObject(object, mode), SENSOR_COLLISION_GROUPS);
}
