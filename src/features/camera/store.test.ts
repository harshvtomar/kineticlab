import { beforeEach, describe, expect, it } from 'vitest';
import { initialCameraView, useCameraStore } from './store';
import { initialSimulationView, useSimulationStore } from '../simulation/store';

beforeEach(() => {
  useCameraStore.setState(initialCameraView);
  useSimulationStore.setState(initialSimulationView);
});

describe('camera store isolation and commands', () => {
  it('defaults to home, 1m spacing and enabled axes', () => {
    const { activeView, gridSpacing, axesVisible, requestId } = useCameraStore.getState();
    expect([activeView, gridSpacing, axesVisible, requestId]).toEqual(['home', 1, true, 0]);
  });
  it('repeating home restarts the camera transition', () => {
    useCameraStore.getState().requestCamera('home');
    useCameraStore.getState().requestCamera('home');
    expect(useCameraStore.getState().requestId).toBe(2);
  });
  it('supports scene framing and all preset camera commands', () => {
    for (const view of ['frame','top','front','side','home'] as const) {
      useCameraStore.getState().requestCamera(view);
      expect(useCameraStore.getState().activeView).toBe(view);
    }
    expect(useCameraStore.getState().requestId).toBe(5);
  });
  it('marks manual zoom as a custom camera view', () => {
    useCameraStore.getState().requestCamera('zoom-out');
    expect(useCameraStore.getState().activeView).toBe('custom');
  });
  it('rejects invalid spacing without changing previous value', () => {
    useCameraStore.getState().setGridSpacing(0.5);
    useCameraStore.getState().setGridSpacing(1.2);
    expect(useCameraStore.getState().gridSpacing).toBe(0.5);
    useCameraStore.getState().setGridSpacing(2);
    expect(useCameraStore.getState().gridSpacing).toBe(2);
  });
  it('toggles axes independently of the simulation grid', () => {
    useCameraStore.getState().toggleAxes();
    expect(useCameraStore.getState().axesVisible).toBe(false);
    expect(useSimulationStore.getState().showGrid).toBe(true);
  });
  it('changing views does not restart or pause physics', () => {
    useSimulationStore.getState().togglePaused();
    const before = useSimulationStore.getState();
    useCameraStore.getState().requestCamera('frame');
    useCameraStore.getState().setGridSpacing(0.5);
    expect(useSimulationStore.getState().paused).toBe(before.paused);
    expect(useSimulationStore.getState().resetEpoch).toBe(before.resetEpoch);
  });
});
