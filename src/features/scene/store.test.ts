import { beforeEach, describe, expect, it } from 'vitest';
import { STARTER_SCENE } from '../../domain/starter-scene';
import { initialWorkspaceView, useWorkspaceStore } from '../workspace/store';
import { initialSimulationView, useSimulationStore } from '../simulation/store';
import { useSceneStore } from './store';
import { confirmObjectDeletion, requestObjectDeletion } from './actions';

beforeEach(() => {
  useSceneStore.getState().restoreStarterScene();
  useWorkspaceStore.setState(initialWorkspaceView);
  useSimulationStore.setState(initialSimulationView);
});

describe('Stage 5 selection and deletion coordination', () => {
  it('starts from immutable Stage 4 data', () => {
    expect(useSceneStore.getState().scene).toBe(STARTER_SCENE);
    expect(useSceneStore.getState().scene.objects).toHaveLength(4);
  });
  it('selects any existing object and rejects missing IDs', () => {
    useWorkspaceStore.getState().setSelectedObjectId('ramp-01');
    expect(useWorkspaceStore.getState().selectedObjectId).toBe('ramp-01');
    useWorkspaceStore.getState().setSelectedObjectId('ghost');
    expect(useWorkspaceStore.getState().selectedObjectId).toBeNull();
  });
  it('arms valid removable object but changes neither scene nor physics', () => {
    expect(requestObjectDeletion('ball-01')).toBe(true);
    expect(useWorkspaceStore.getState().pendingDeleteObjectId).toBe('ball-01');
    expect(useSceneStore.getState().scene).toBe(STARTER_SCENE);
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
  });
  it('never arms ground deletion', () => {
    expect(requestObjectDeletion('ground-01')).toBe(false);
    expect(useWorkspaceStore.getState().pendingDeleteObjectId).toBeNull();
  });
  it('rejects missing and null identifiers', () => {
    expect(requestObjectDeletion('missing')).toBe(false);
    expect(requestObjectDeletion(null)).toBe(false);
  });
  it('does not delete anything without explicit confirmation', () => {
    requestObjectDeletion('ramp-01');
    useWorkspaceStore.getState().setPendingDeleteObjectId(null);
    expect(confirmObjectDeletion()).toBe(false);
    expect(useSceneStore.getState().scene.objects).toHaveLength(4);
  });
  it('removes confirmed object and clears its selection', () => {
    useWorkspaceStore.getState().setSelectedObjectId('ball-01');
    requestObjectDeletion('ball-01');
    expect(confirmObjectDeletion()).toBe(true);
    expect(useWorkspaceStore.getState().selectedObjectId).toBeNull();
    expect(useWorkspaceStore.getState().pendingDeleteObjectId).toBeNull();
    expect(useSceneStore.getState().scene.objects.map(o => o.id)).not.toContain('ball-01');
  });
  it('remounts physics only after successful removal', () => {
    requestObjectDeletion('stopper-01');
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
    expect(confirmObjectDeletion()).toBe(true);
    expect(useSimulationStore.getState().resetEpoch).toBe(1);
  });
  it('resumes paused simulation after actual deletion', () => {
    useSimulationStore.getState().togglePaused();
    requestObjectDeletion('ramp-01');
    expect(confirmObjectDeletion()).toBe(true);
    expect(useSimulationStore.getState().paused).toBe(false);
  });
  it('failed confirmation keeps physics state unchanged', () => {
    useWorkspaceStore.getState().setPendingDeleteObjectId('ground-01');
    useSimulationStore.getState().togglePaused();
    expect(confirmObjectDeletion()).toBe(false);
    expect(useSceneStore.getState().scene.objects).toHaveLength(4);
    expect(useSimulationStore.getState().paused).toBe(true);
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
  });
  it('rejects stale pending ID after external removal', () => {
    requestObjectDeletion('ball-01');
    useSceneStore.getState().removeById('ball-01');
    expect(confirmObjectDeletion()).toBe(false);
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
    expect(useWorkspaceStore.getState().pendingDeleteObjectId).toBeNull();
  });
  it('does not clear another selected object when deleting', () => {
    useWorkspaceStore.getState().setSelectedObjectId('ramp-01');
    requestObjectDeletion('stopper-01');
    confirmObjectDeletion();
    expect(useWorkspaceStore.getState().selectedObjectId).toBe('ramp-01');
  });
  it('invalidates selection of an object removed from the scene', () => {
    useSceneStore.getState().removeById('ball-01');
    useWorkspaceStore.getState().setSelectedObjectId('ball-01');
    expect(useWorkspaceStore.getState().selectedObjectId).toBeNull();
  });
  it('restoreStarterScene brings back all original registry objects', () => {
    requestObjectDeletion('ball-01'); confirmObjectDeletion();
    useSceneStore.getState().restoreStarterScene();
    expect(useSceneStore.getState().scene).toEqual(STARTER_SCENE);
  });
});
