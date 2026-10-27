import { LEGACY_STARTER_OBJECTS, PHYSICS_SETTINGS, type LegacySceneObjectDefinition } from './legacy-fixtures';
import {
  createMechanicalScene, type MechanicalObject, type MechanicalScene, type Vec3,
} from './registry';

const ZERO: Vec3 = [0, 0, 0];
const ONE: Vec3 = [1, 1, 1];

/** Explicit mapping of Stage 3's exact shape, materials and Rapier properties. */
function migrateObject(object: LegacySceneObjectDefinition): MechanicalObject {
  const common = {
    id: object.id, label: object.label,
    transform: { position: [...object.position] as unknown as Vec3, rotation: ZERO, scale: ONE },
  };
  switch (object.kind) {
    case 'ground':
      if (object.dynamic) throw new Error('Ground must be fixed');
      return { ...common, kind: 'ground', geometry: { shape: 'box', dimensions: [12, 0.4, 10] },
        visual: { color: '#1b3041', roughness: 0.95, metalness: 0, castShadow: false, receiveShadow: true },
        physics: { bodyType: 'fixed', collider: 'cuboid' } };
    case 'ramp':
      if (object.dynamic) throw new Error('Ramp must be fixed');
      return { ...common, kind: 'ramp', transform: { ...common.transform, rotation: [0, 0, -0.2] },
        geometry: { shape: 'box', dimensions: [4.3, 0.24, 2.2] },
        visual: { color: '#e6a256', roughness: 0.55, metalness: 0.48, castShadow: true, receiveShadow: true },
        physics: { bodyType: 'fixed', collider: 'cuboid' } };
    case 'ball':
      if (!object.dynamic) throw new Error('Ball must be dynamic');
      return { ...common, kind: 'ball', geometry: { shape: 'sphere', radius: PHYSICS_SETTINGS.ballRadius, widthSegments: 40, heightSegments: 28 },
        visual: { color: '#75dbe0', roughness: 0.23, metalness: 0.72, castShadow: true, receiveShadow: false },
        physics: { bodyType: 'dynamic', collider: 'ball', friction: PHYSICS_SETTINGS.ballFriction,
          restitution: PHYSICS_SETTINGS.ballRestitution, linearDamping: 0.06, angularDamping: 0.04,
          canSleep: false, ccd: true } };
    case 'stopper':
      if (object.dynamic) throw new Error('Stopper must be fixed');
      return { ...common, kind: 'stopper', geometry: { shape: 'box', dimensions: [0.45, 0.84, 2.1] },
        visual: { color: '#748ca4', roughness: 0.48, metalness: 0.55, castShadow: true, receiveShadow: true },
        physics: { bodyType: 'fixed', collider: 'cuboid' } };
  }
}

/** Pure migration; intentionally no object editing or interactivity in Stage 4. */
export function migrateLegacyStarterScene(objects: readonly LegacySceneObjectDefinition[]): MechanicalScene {
  return createMechanicalScene({ schemaVersion: 1, objects: objects.map(migrateObject) });
}

export const STARTER_SCENE = migrateLegacyStarterScene(LEGACY_STARTER_OBJECTS);
