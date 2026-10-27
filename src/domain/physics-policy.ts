/** Stage 8 simulation policy. Metres, seconds, radians; runtime-only, not scene schema v1.
 * Numerical fixed timestep improves repeatability. Frame timing, platform and Rapier
 * version can still affect results; no cross-platform bitwise determinism is promised.
 */
import { PHYSICS_SETTINGS } from './legacy-fixtures';
import type { MechanicalObject, MechanicalScene } from './registry';

export const PHYSICS_POLICY = Object.freeze({
  gravity: PHYSICS_SETTINGS.gravity,
  timestep: 1 / 60,
  updateLoop: 'follow' as const,
  maxRecentContacts: 20,
  staticFriction: 0.5, // Rapier default; maintains Stage 7 fixed-body behavior
  staticRestitution: 0, // Rapier default
});

export type PhysicsBlueprint = Readonly<{
  id: string;
  bodyType: 'fixed' | 'dynamic';
  collider: 'cuboid' | 'ball';
  position: readonly [number, number, number];
  friction: number;
  restitution: number;
  ccd: boolean;
}>;

/** Declarative extraction; never mutates the authoritative scene or transforms. */
export function physicsBlueprint(object: MechanicalObject): PhysicsBlueprint {
  return Object.freeze({
    id: object.id,
    bodyType: object.physics.bodyType,
    collider: object.physics.collider,
    position: Object.freeze([...object.transform.position]) as unknown as readonly [number, number, number],
    friction: object.physics.bodyType === 'dynamic' ? object.physics.friction : PHYSICS_POLICY.staticFriction,
    restitution: object.physics.bodyType === 'dynamic' ? object.physics.restitution : PHYSICS_POLICY.staticRestitution,
    ccd: object.physics.bodyType === 'dynamic' ? object.physics.ccd : false,
  });
}

export function physicsBlueprints(scene: MechanicalScene): readonly PhysicsBlueprint[] {
  return Object.freeze(scene.objects.map(physicsBlueprint));
}
