import { describe, expect, it } from 'vitest';
import { CAMERA_MAX_DISTANCE, CAMERA_MIN_DISTANCE, GRID_SIZE, cameraPreset, distanceToFrame, getStarterBounds, gridDivisions, nextZoomDistance } from './views';

describe('camera and workshop geometry', () => {
  it('includes all starter mesh dimensions in its bounds', () => {
    const bounds = getStarterBounds();
    expect(bounds.radius).toBeGreaterThan(7);
    expect(bounds.center).toHaveLength(3);
    expect(bounds.center.every(Number.isFinite)).toBe(true);
  });
  it('supports an empty workspace safely', () => expect(getStarterBounds([])).toEqual({ center: [0, 0, 0], radius: 1 }));
  it.each(['home','top','front','side','frame'] as const)('gives finite camera position for %s', (preset) => {
    const pose = cameraPreset(preset, 16 / 9);
    expect(pose.position.every(Number.isFinite)).toBe(true);
    expect(pose.target.every(Number.isFinite)).toBe(true);
    expect(Math.hypot(...pose.position)).toBeGreaterThan(0);
  });
  it('homes to the original Stage 1 orbit camera', () => {
    expect(cameraPreset('home', 16 / 9)).toEqual({ position: [7.8, 5.3, 8.5], target: [0.3, 0.7, 0] });
  });
  it('frames a narrow viewport farther away than a wide viewport', () => {
    expect(distanceToFrame(3, 42, 0.5)).toBeGreaterThan(distanceToFrame(3, 42, 2));
  });
  it('limits extreme frame distances', () => {
    expect(distanceToFrame(10000, 42, 2)).toBe(CAMERA_MAX_DISTANCE);
    expect(distanceToFrame(0.1, 42, 2)).toBe(CAMERA_MIN_DISTANCE);
  });
  it('rejects invalid framing parameters', () => {
    expect(() => distanceToFrame(0, 42, 1)).toThrow();
    expect(() => distanceToFrame(1, 180, 1)).toThrow();
    expect(() => distanceToFrame(1, 42, 0)).toThrow();
  });
  it('frames the actual starter scene using a valid angle', () => {
    const pose = cameraPreset('frame', 1);
    expect(pose.target).toEqual(getStarterBounds().center);
    expect(Math.hypot(...pose.position.map((v, i) => v - pose.target[i]))).toBeLessThanOrEqual(CAMERA_MAX_DISTANCE + 1e-9);
  });
  it.each([0.5,1,2] as const)('produces integral divisions for %sm grid', spacing => {
    expect(gridDivisions(spacing)).toBe(GRID_SIZE / spacing);
  });
  it('zooms but clamps to orbit-control boundaries', () => {
    expect(nextZoomDistance(10, 'zoom-in')).toBeCloseTo(7.8);
    expect(nextZoomDistance(10, 'zoom-out')).toBeCloseTo(12.8);
    expect(nextZoomDistance(1, 'zoom-in')).toBe(CAMERA_MIN_DISTANCE);
    expect(nextZoomDistance(100, 'zoom-out')).toBe(CAMERA_MAX_DISTANCE);
    expect(nextZoomDistance(NaN, 'zoom-in')).toBe(CAMERA_MIN_DISTANCE);
  });
});
