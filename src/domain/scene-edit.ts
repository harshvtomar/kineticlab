/** Stage 5 pure scene operations.  Stage 4 schema and its serialization remain unchanged. */
import {
  createMechanicalScene,
  selectMechanicalObject,
  type MechanicalObject,
  type MechanicalScene,
} from './registry';

/** The ground is the reference plane for this starter experiment and cannot be removed. */
export function isRemovableObject(object: MechanicalObject): boolean {
  return object.kind !== 'ground';
}

export type RemovalResult =
  | { readonly status: 'removed'; readonly scene: MechanicalScene; readonly removedId: string }
  | { readonly status: 'missing' | 'protected'; readonly scene: MechanicalScene };

/** Returns a newly validated immutable scene when removal succeeds; otherwise no mutation. */
export function removeMechanicalObject(scene: MechanicalScene, id: string): RemovalResult {
  const object = selectMechanicalObject(scene, id);
  if (!object) return { status: 'missing', scene };
  if (!isRemovableObject(object)) return { status: 'protected', scene };
  return {
    status: 'removed',
    removedId: id,
    scene: createMechanicalScene({
      schemaVersion: scene.schemaVersion,
      objects: scene.objects.filter(item => item.id !== id),
    }),
  };
}
