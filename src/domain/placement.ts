/** Stage 6: deterministic, immutable placement of the three schema-v1 primitives.
 * Geometry editing, real gears and joint-based mechanisms are explicitly out of scope.
 */
import { createMechanicalScene, type MechanicalObject, type MechanicalScene, type Vec3 } from './registry';
import { STARTER_SCENE } from './starter-scene';

export type PlaceableKind = 'ball' | 'stopper' | 'ramp';
export const PLACEABLE_KINDS: readonly PlaceableKind[] = ['ball', 'stopper', 'ramp'];
export const PLACEMENT_GRID_METRES = 0.5;
export const PLACEMENT_MAX_OBJECTS = 1000;

export function isPlaceableKind(value: unknown): value is PlaceableKind {
  return typeof value === 'string' && PLACEABLE_KINDS.includes(value as PlaceableKind);
}

export function snapToPlacementGrid(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Placement coordinate must be finite');
  return Math.round(value / PLACEMENT_GRID_METRES) * PLACEMENT_GRID_METRES;
}

export function allocateMechanicalId(scene: MechanicalScene, kind: PlaceableKind): string {
  const taken = new Set(scene.objects.map(o => o.id));
  for (let index = 1; index <= 10000; index += 1) {
    const candidate = `${kind}-new-${String(index).padStart(3, '0')}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error('No free IDs available');
}

const canonical = (kind: PlaceableKind): MechanicalObject => {
  const template = STARTER_SCENE.objects.find(o => o.kind === kind);
  if (!template) throw new Error(`No Stage 4 primitive for ${kind}`);
  return template;
};

function extent(object: MechanicalObject): { x: number; y: number; z: number } {
  const { scale } = object.transform;
  if (object.geometry.shape === 'sphere') {
    return { x: object.geometry.radius * scale[0], y: object.geometry.radius * scale[1], z: object.geometry.radius * scale[2] };
  }
  // Conservative horizontal AABB for rotated ramps; rotation is not freely editable until Stage 7.
  const halfX = object.geometry.dimensions[0] * scale[0] / 2;
  const halfY = object.geometry.dimensions[1] * scale[1] / 2;
  const a = object.transform.rotation[2];
  return { x: Math.abs(Math.cos(a)) * halfX + Math.abs(Math.sin(a)) * halfY,
    y: Math.abs(Math.sin(a)) * halfX + Math.abs(Math.cos(a)) * halfY,
    z: object.geometry.dimensions[2] * scale[2] / 2 };
}

function groundBounds(scene: MechanicalScene) {
  const ground = scene.objects.find(o => o.kind === 'ground');
  if (!ground || ground.geometry.shape !== 'box') return null;
  const extentX = ground.geometry.dimensions[0] * ground.transform.scale[0] / 2;
  const extentZ = ground.geometry.dimensions[2] * ground.transform.scale[2] / 2;
  const top = ground.transform.position[1] + ground.geometry.dimensions[1] * ground.transform.scale[1] / 2;
  return { x: ground.transform.position[0], z: ground.transform.position[2], halfX: extentX, halfZ: extentZ, top };
}

export function placementGroundHeight(scene: MechanicalScene): number | null {
  return groundBounds(scene)?.top ?? null;
}

/** Builds schema-v1 object with preserved Rapier materials/colliders, never mutating the template. */
export function makePlacementObject(scene: MechanicalScene, kind: PlaceableKind, x: number, z: number): MechanicalObject {
  if (!isPlaceableKind(kind) || !Number.isFinite(x) || !Number.isFinite(z)) throw new Error('Invalid primitive or nonfinite coordinate');
  const ground = groundBounds(scene);
  if (!ground) throw new Error('Ground reference is required for placement');
  const template = canonical(kind);
  const newId = allocateMechanicalId(scene, kind);
  const dimensions = extent(template);
  const position: Vec3 = [snapToPlacementGrid(x), ground.top + dimensions.y + 0.03, snapToPlacementGrid(z)];
  const name = kind === 'ball' ? 'Sphere' : kind === 'ramp' ? 'Ramp' : 'Block';
  return { ...template, id: newId, label: `${name} ${newId.split('-').at(-1)}`,
    transform: { ...template.transform, position } };
}

export type PlacementStatus = 'placed' | 'invalid-kind' | 'invalid-position' | 'outside-ground' | 'overlap' | 'limit';
export type PlacementResult =
  | { readonly status: 'placed'; readonly scene: MechanicalScene; readonly placedId: string }
  | { readonly status: Exclude<PlacementStatus, 'placed'>; readonly scene: MechanicalScene };

/** Checked independently of the UI to prevent outside-ground and overlapping initial colliders. */
export function placeMechanicalObject(scene: MechanicalScene, kind: unknown, x: number, z: number): PlacementResult {
  if (!isPlaceableKind(kind)) return { status: 'invalid-kind', scene };
  if (!Number.isFinite(x) || !Number.isFinite(z)) return { status: 'invalid-position', scene };
  if (scene.objects.length >= PLACEMENT_MAX_OBJECTS) return { status: 'limit', scene };
  const bounds = groundBounds(scene);
  if (!bounds) return { status: 'outside-ground', scene };
  const candidate = makePlacementObject(scene, kind, x, z);
  const radius = extent(candidate);
  const safeMargin = 0.1;
  if (Math.abs(candidate.transform.position[0] - bounds.x) + radius.x + safeMargin > bounds.halfX ||
    Math.abs(candidate.transform.position[2] - bounds.z) + radius.z + safeMargin > bounds.halfZ) {
    return { status: 'outside-ground', scene };
  }
  for (const other of scene.objects) {
    if (other.kind === 'ground') continue;
    const otherRadius = extent(other);
    // Use an intentionally conservative footprint to avoid rigid bodies spawned inside each other.
    if (Math.abs(candidate.transform.position[0] - other.transform.position[0]) < radius.x + otherRadius.x + 0.08 &&
        Math.abs(candidate.transform.position[2] - other.transform.position[2]) < radius.z + otherRadius.z + 0.08) {
      return { status: 'overlap', scene };
    }
  }
  return {
    status: 'placed', placedId: candidate.id,
    scene: createMechanicalScene({ schemaVersion: scene.schemaVersion, objects: [...scene.objects, candidate] }),
  };
}

export function placementStatusMessage(status: PlacementStatus): string {
  switch (status) {
    case 'placed': return 'Component placed successfully.';
    case 'invalid-kind': return 'This component is not available for placement yet.';
    case 'invalid-position': return 'Choose a valid location on the workbench.';
    case 'outside-ground': return 'Keep the entire component inside the ground plane.';
    case 'overlap': return 'That location overlaps another component. Choose a free area.';
    case 'limit': return 'Scene has reached its safe placement limit.';
  }
}
