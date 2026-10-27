import { STARTER_OBJECTS, type SceneObjectDefinition, type Vec3 } from '../../domain/fixtures';

/** Camera mathematics is deterministic and independent of WebGL and React. */
export type CameraView = 'home' | 'frame' | 'top' | 'front' | 'side';
export type CameraCommand = CameraView | 'zoom-in' | 'zoom-out';
export type GridSpacing = 0.5 | 1 | 2;
export const GRID_SPACINGS: readonly GridSpacing[] = [0.5, 1, 2] as const;
export const GRID_SIZE = 34;
export const CAMERA_MIN_DISTANCE = 2.5;
export const CAMERA_MAX_DISTANCE = 34;

export interface CameraPose { readonly position: Vec3; readonly target: Vec3; }
export interface SceneBounds { readonly center: Vec3; readonly radius: number; }

/** Approximated starter bounds include the dimensions of meshes, not just their origins. */
const extentByKind: Record<SceneObjectDefinition['kind'], Vec3> = {
  ground: [6, 0.2, 5], ramp: [2.4, 0.85, 1.2], ball: [0.34, 0.34, 0.34], stopper: [0.225, 0.42, 1.05],
};

export function getStarterBounds(objects: readonly SceneObjectDefinition[] = STARTER_OBJECTS): SceneBounds {
  if (objects.length === 0) return { center: [0, 0, 0], radius: 1 };
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (const object of objects) {
    const extent = extentByKind[object.kind];
    for (let axis = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis], object.position[axis] - extent[axis]);
      high[axis] = Math.max(high[axis], object.position[axis] + extent[axis]);
    }
  }
  const center: Vec3 = [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
  const radius = Math.hypot((high[0] - low[0]) / 2, (high[1] - low[1]) / 2, (high[2] - low[2]) / 2);
  return { center, radius: Math.max(1, radius) };
}

export function distanceToFrame(radius: number, verticalFovDegrees: number, aspect: number): number {
  if (![radius, verticalFovDegrees, aspect].every(Number.isFinite) || radius <= 0 || verticalFovDegrees <= 0 || verticalFovDegrees >= 175 || aspect <= 0) {
    throw new Error('Invalid scene framing dimensions');
  }
  const halfVertical = (verticalFovDegrees * Math.PI) / 360;
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
  const distance = (radius * 1.15) / Math.sin(Math.min(halfVertical, halfHorizontal));
  return Math.min(CAMERA_MAX_DISTANCE, Math.max(CAMERA_MIN_DISTANCE, distance));
}

export function cameraPreset(view: CameraView, aspect: number, verticalFovDegrees = 42): CameraPose {
  const target: Vec3 = [0.3, 0.7, 0];
  if (view === 'home') return { target, position: [7.8, 5.3, 8.5] };
  if (view === 'top') return { target, position: [0.3, 16, 0.08] };
  if (view === 'front') return { target, position: [0.3, 4.3, 13.2] };
  if (view === 'side') return { target, position: [14, 4.3, 0] };
  const bounds = getStarterBounds();
  const distance = distanceToFrame(bounds.radius, verticalFovDegrees, aspect);
  const direction = [0.62, 0.39, 0.68];
  const length = Math.hypot(...direction);
  return {
    target: bounds.center,
    position: [
      bounds.center[0] + (direction[0] * distance) / length,
      bounds.center[1] + (direction[1] * distance) / length,
      bounds.center[2] + (direction[2] * distance) / length,
    ],
  };
}

export function nextZoomDistance(current: number, action: 'zoom-in' | 'zoom-out'): number {
  if (!Number.isFinite(current) || current <= 0) return CAMERA_MIN_DISTANCE;
  return Math.max(CAMERA_MIN_DISTANCE, Math.min(CAMERA_MAX_DISTANCE, current * (action === 'zoom-in' ? 0.78 : 1.28)));
}

export function gridDivisions(spacing: GridSpacing): number {
  return Math.round(GRID_SIZE / spacing);
}
