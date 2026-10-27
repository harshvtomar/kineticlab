import { beforeEach, describe, expect, it } from 'vitest';
import { initialSimulationView, useSimulationStore } from './store';

beforeEach(() => useSimulationStore.setState(initialSimulationView));

describe('simulation controls', () => {
  it('begins running with grid visible', () => {
    expect(useSimulationStore.getState().paused).toBe(false);
    expect(useSimulationStore.getState().showGrid).toBe(true);
  });

  it('toggles pause and resumes on a second click', () => {
    useSimulationStore.getState().togglePaused();
    expect(useSimulationStore.getState().paused).toBe(true);
    useSimulationStore.getState().togglePaused();
    expect(useSimulationStore.getState().paused).toBe(false);
  });

  it('toggles grid without changing the physics run state', () => {
    useSimulationStore.getState().toggleGrid();
    expect(useSimulationStore.getState().showGrid).toBe(false);
    expect(useSimulationStore.getState().paused).toBe(false);
  });

  it('restarts the world and unpauses a paused scene', () => {
    useSimulationStore.getState().togglePaused();
    useSimulationStore.getState().restart();
    expect(useSimulationStore.getState().paused).toBe(false);
    expect(useSimulationStore.getState().resetEpoch).toBe(1);
    useSimulationStore.getState().restart();
    expect(useSimulationStore.getState().resetEpoch).toBe(2);
  });
});
