import { beforeEach, describe, expect, it } from 'vitest';
import { STARTER_SCENE } from '../../domain/starter-scene';
import { useSceneStore } from './store';
import { useWorkspaceStore, initialWorkspaceView } from '../workspace/store';
import { useSimulationStore, initialSimulationView } from '../simulation/store';
import { commitObjectPlacement, quickPlaceAtFreePosition, requestObjectDeletion, confirmObjectDeletion } from './actions';

beforeEach(() => {
  useSceneStore.getState().restoreStarterScene();
  useWorkspaceStore.setState(initialWorkspaceView);
  useSimulationStore.setState(initialSimulationView);
});

describe('Stage 6 placement integration', () => {
  it('arms click placement without modifying scene or physics', () => {
    useWorkspaceStore.getState().startPlacement('ball');
    expect(useWorkspaceStore.getState().placementKind).toBe('ball');
    expect(useSceneStore.getState().scene).toBe(STARTER_SCENE);
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
  });
  it('cancels placement and does not create bodies', () => {
    useWorkspaceStore.getState().startPlacement('stopper');
    useWorkspaceStore.getState().cancelPlacement();
    expect(useWorkspaceStore.getState().placementKind).toBeNull();
    expect(useSceneStore.getState().scene.objects).toHaveLength(4);
  });
  it('sets drags independently of armed-click placement', () => {
    useWorkspaceStore.getState().startPlacement('ball');
    useWorkspaceStore.getState().startDrag('ramp');
    expect(useWorkspaceStore.getState().placementKind).toBeNull();
    expect(useWorkspaceStore.getState().dragKind).toBe('ramp');
    useWorkspaceStore.getState().endDrag();
    expect(useWorkspaceStore.getState().dragKind).toBeNull();
  });
  it('commits a body, selects it, and remounts physics once', () => {
    useWorkspaceStore.getState().startPlacement('ball');
    expect(commitObjectPlacement('ball',4,-3)).toBe('placed');
    expect(useSceneStore.getState().scene.objects).toHaveLength(5);
    expect(useWorkspaceStore.getState().selectedObjectId).toBe('ball-new-001');
    expect(useWorkspaceStore.getState().placementKind).toBeNull();
    expect(useSimulationStore.getState().resetEpoch).toBe(1);
  });
  it('rejects overlap without changing scene or physics', () => {
    useWorkspaceStore.getState().startPlacement('ball');
    expect(commitObjectPlacement('ball',0,0)).toBe('overlap');
    expect(useSceneStore.getState().scene).toBe(STARTER_SCENE);
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
    expect(useWorkspaceStore.getState().placementKind).toBe('ball');
  });
  it('rejects edits during delete confirmation', () => {
    expect(requestObjectDeletion('ball-01')).toBe(true);
    expect(commitObjectPlacement('ball',4,-3)).toBe('invalid-position');
    expect(useSceneStore.getState().scene).toBe(STARTER_SCENE);
  });
  it('new bodies participate in Stage 5 confirmed deletion safely', () => {
    commitObjectPlacement('ball',4,-3);
    expect(requestObjectDeletion('ball-new-001')).toBe(true);
    expect(confirmObjectDeletion()).toBe(true);
    expect(useSceneStore.getState().scene.objects).toHaveLength(4);
    expect(useSimulationStore.getState().resetEpoch).toBe(2);
  });
  it('does not modify the protected ground during placement', () => {
    commitObjectPlacement('stopper',4,3);
    expect(useSceneStore.getState().scene.objects[0]).toEqual(STARTER_SCENE.objects[0]);
  });
  it('restarts and resumes from paused state on placement', () => {
    useSimulationStore.getState().togglePaused();
    commitObjectPlacement('ball',4,-3);
    expect(useSimulationStore.getState().paused).toBe(false);
  });
  it('quick-add picks a valid location without mouse or drag', () => {
    expect(quickPlaceAtFreePosition('ball')).toBe('placed');
    expect(useSceneStore.getState().scene.objects).toHaveLength(5);
  });
  it('reload-style restoration returns to the four fixture objects', () => {
    commitObjectPlacement('ball',4,-3);
    useSceneStore.getState().restoreStarterScene();
    expect(useSceneStore.getState().scene).toBe(STARTER_SCENE);
  });
});
