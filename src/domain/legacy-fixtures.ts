/** Historical Stage 1–3 starter metadata retained as Stage 4 migration input.
 * Do not use this list to render or inspect the scene; consume STARTER_SCENE.
 */
export type Vec3 = readonly [number, number, number];
export interface LegacySceneObjectDefinition {
  readonly id: string;
  readonly label: string;
  readonly kind: 'ground' | 'ramp' | 'ball' | 'stopper';
  readonly position: Vec3;
  readonly dynamic: boolean;
}
export const PHYSICS_SETTINGS = {
  gravity: [0, -9.81, 0] as Vec3,
  ballRadius: 0.34,
  ballRestitution: 0.35,
  ballFriction: 0.55,
} as const;
export const LEGACY_STARTER_OBJECTS: readonly LegacySceneObjectDefinition[] = [
  { id: 'ground-01', label: 'Ground plane', kind: 'ground', position: [0, -0.2, 0], dynamic: false },
  { id: 'ramp-01', label: 'Inclined ramp', kind: 'ramp', position: [0, 1.15, 0], dynamic: false },
  { id: 'ball-01', label: 'Steel sphere', kind: 'ball', position: [-1.65, 2.7, 0], dynamic: true },
  { id: 'stopper-01', label: 'Impact block', kind: 'stopper', position: [3.0, 0.42, 0], dynamic: false },
];
