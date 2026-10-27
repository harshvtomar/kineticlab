/** Compatibility facade for original Stage 1–3 public fixture contract.
 * STARTER_OBJECTS is now a read-only projection of authoritative STARTER_SCENE.
 */
import { STARTER_SCENE } from './starter-scene';
import type { LegacySceneObjectDefinition } from './legacy-fixtures';
export { PHYSICS_SETTINGS } from './legacy-fixtures';
export type { Vec3 } from './legacy-fixtures';
export type SceneObjectDefinition = LegacySceneObjectDefinition;

export const STARTER_OBJECTS: readonly SceneObjectDefinition[] = Object.freeze(STARTER_SCENE.objects.map(object =>
  Object.freeze({
    id: object.id, label: object.label, kind: object.kind,
    position: object.transform.position, dynamic: object.physics.bodyType === 'dynamic',
  }),
));

/** Historical validator retained unchanged for original regression suite. */
export function validateStarterScene(objects: readonly SceneObjectDefinition[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const object of objects) {
    if (!object.id.trim()) errors.push('Object has an empty id');
    if (seen.has(object.id)) errors.push(`Duplicate object id: ${object.id}`);
    seen.add(object.id);
    if (object.position.length !== 3 || object.position.some(value => !Number.isFinite(value))) {
      errors.push(`Invalid position: ${object.id}`);
    }
    if (object.kind === 'ground' && object.dynamic) errors.push('Ground must be a fixed rigid body');
  }
  if (!objects.some(object => object.kind === 'ground')) errors.push('Scene has no ground');
  if (!objects.some(object => object.dynamic)) errors.push('Scene has no moving objects');
  return errors;
}
