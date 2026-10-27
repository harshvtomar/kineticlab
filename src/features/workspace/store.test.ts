import { beforeEach, describe, expect, it } from 'vitest';
import { initialWorkspaceView, useWorkspaceStore } from './store';
import { useSimulationStore, initialSimulationView } from '../simulation/store';

beforeEach(() => {
  useWorkspaceStore.setState(initialWorkspaceView);
  useSimulationStore.setState(initialSimulationView);
});

describe('workspace interface state', () => {
  it('defaults to visible desktop panels and a valid starter object', () => {
    const state = useWorkspaceStore.getState();
    expect(state.libraryOpen).toBe(true);
    expect(state.inspectorOpen).toBe(true);
    expect(state.selectedObjectId).toBe('ball-01');
  });
  it('supports independently collapsible desktop sidebars', () => {
    useWorkspaceStore.getState().toggleLibrary();
    expect(useWorkspaceStore.getState().libraryOpen).toBe(false);
    useWorkspaceStore.getState().toggleInspector();
    expect(useWorkspaceStore.getState().inspectorOpen).toBe(false);
    useWorkspaceStore.getState().toggleInspector();
    expect(useWorkspaceStore.getState().inspectorOpen).toBe(true);
    expect(useWorkspaceStore.getState().libraryOpen).toBe(false);
    useWorkspaceStore.getState().openPanels();
    expect(useWorkspaceStore.getState().libraryOpen && useWorkspaceStore.getState().inspectorOpen).toBe(true);
  });
  it('filters preview and switches inspector views', () => {
    useWorkspaceStore.getState().setLibraryQuery('ramp');
    useWorkspaceStore.getState().setCategory('bodies');
    useWorkspaceStore.getState().setActiveCatalogId('ramps');
    useWorkspaceStore.getState().setInspectorView('world');
    const state = useWorkspaceStore.getState();
    expect([state.libraryQuery, state.category, state.activeCatalogId, state.inspectorView]).toEqual(['ramp', 'bodies', 'ramps', 'world']);
  });
  it('rejects invalid starter-object selections', () => {
    useWorkspaceStore.getState().setSelectedObjectId('made-up-object');
    expect(useWorkspaceStore.getState().selectedObjectId).toBeNull();
    useWorkspaceStore.getState().setSelectedObjectId('ramp-01');
    expect(useWorkspaceStore.getState().selectedObjectId).toBe('ramp-01');
  });
  it('closes transient interface without disturbing simulation physics state', () => {
    useSimulationStore.getState().togglePaused();
    useWorkspaceStore.getState().closePanels();
    useWorkspaceStore.getState().setHelpOpen(true);
    expect(useWorkspaceStore.getState().libraryOpen).toBe(false);
    expect(useWorkspaceStore.getState().inspectorOpen).toBe(false);
    expect(useWorkspaceStore.getState().helpOpen).toBe(true);
    expect(useSimulationStore.getState().paused).toBe(true);
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
  });
});
