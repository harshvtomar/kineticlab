import { create } from 'zustand';
import type { CatalogCategory } from './catalog';
import { STARTER_OBJECTS } from '../../domain/fixtures';
import { useSceneStore } from '../scene/store';
import type { PlaceableKind } from '../../domain/placement';
import type { Vec3, Transform, MechanicalScene } from '../../domain/registry';

export type EditAxisMode = 'translate' | 'rotate' | 'scale';
export interface EditSession {
  readonly id: string;
  readonly base: MechanicalScene;
  readonly draft: Transform;
  readonly mode: EditAxisMode;
}
export type InspectorView = 'objects' | 'world';
export interface WorkspaceState {
  libraryOpen: boolean;
  inspectorOpen: boolean;
  helpOpen: boolean;
  libraryQuery: string;
  category: CatalogCategory;
  activeCatalogId: string | null;
  inspectorView: InspectorView;
  selectedObjectId: string | null;
  pendingDeleteObjectId: string | null;
  placementKind: PlaceableKind | null;
  dragKind: PlaceableKind | null;
  previewPosition: Vec3 | null;
  placementFeedback: string;
  editSession: EditSession | null;
  editFeedback: string;
  startEdit: (session: EditSession) => void;
  updateEditDraft: (draft: Transform) => void;
  setEditMode: (mode: EditAxisMode) => void;
  setEditFeedback: (message: string) => void;
  cancelEdit: () => void;
  startPlacement: (kind: PlaceableKind) => void;
  startDrag: (kind: PlaceableKind) => void;
  endDrag: () => void;
  cancelPlacement: () => void;
  setPreviewPosition: (point: Vec3 | null) => void;
  setPlacementFeedback: (message: string) => void;
  setLibraryOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  toggleLibrary: () => void;
  toggleInspector: () => void;
  setHelpOpen: (open: boolean) => void;
  setLibraryQuery: (query: string) => void;
  setCategory: (category: CatalogCategory) => void;
  setActiveCatalogId: (id: string | null) => void;
  setInspectorView: (view: InspectorView) => void;
  setSelectedObjectId: (id: string | null) => void;
  setPendingDeleteObjectId: (id: string | null) => void;
  closePanels: () => void;
  openPanels: () => void;
}

export const initialWorkspaceView = {
  libraryOpen: true,
  inspectorOpen: true,
  helpOpen: false,
  libraryQuery: '',
  category: 'all' as CatalogCategory,
  activeCatalogId: null,
  inspectorView: 'objects' as InspectorView,
  selectedObjectId: STARTER_OBJECTS[2].id as string | null,
  pendingDeleteObjectId: null as string | null,
  placementKind: null as PlaceableKind | null,
  dragKind: null as PlaceableKind | null,
  previewPosition: null as Vec3 | null,
  placementFeedback: '', 
  editSession: null as EditSession | null,
  editFeedback: '',
};

/** Selection, panels and pending confirmation; physics remains owned by Rapier. */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ...initialWorkspaceView,
  startEdit: (editSession) => set({editSession,editFeedback:'Preview changes, then Apply. Physics remains paused.'}),
  updateEditDraft: draft => set(state => ({editSession:state.editSession ? {...state.editSession,draft}:null})),
  setEditMode: mode => set(state => ({editSession:state.editSession ? {...state.editSession,mode}:null})),
  setEditFeedback: editFeedback => set({editFeedback}),
  cancelEdit: () => set({editSession:null,editFeedback:''}),
  setLibraryOpen: (libraryOpen) => set({ libraryOpen }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  toggleLibrary: () => set(state => ({ libraryOpen: !state.libraryOpen })),
  toggleInspector: () => set(state => ({ inspectorOpen: !state.inspectorOpen })),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setLibraryQuery: (libraryQuery) => set({ libraryQuery }),
  setCategory: (category) => set({ category }),
  setActiveCatalogId: (activeCatalogId) => set({ activeCatalogId }),
  setInspectorView: (inspectorView) => set({ inspectorView }),
  setSelectedObjectId: (id) => set(state => { const selectedObjectId=id && useSceneStore.getState().scene.objects.some(object => object.id===id)?id:null; return {selectedObjectId, editSession: state.editSession?.id===selectedObjectId ? state.editSession : null}; }),
  setPendingDeleteObjectId: (id) => set({ pendingDeleteObjectId: id }),
  startPlacement: (kind) => set(state=>state.editSession ? {placementFeedback:'Apply or cancel your transform before placing another object.'} : { placementKind: kind, dragKind: null, previewPosition: null, placementFeedback: `Move the cursor over the 3D workbench and click to place ${kind}. Esc cancels.` }),
  startDrag: (kind) => set(state=>state.editSession ? {placementFeedback:'Apply or cancel your transform before dragging another object.'} : { dragKind: kind, placementKind: null, previewPosition: null, placementFeedback: `Drop ${kind} onto the 3D workbench.` }),
  endDrag: () => set({ dragKind: null, previewPosition: null, placementFeedback: '' }),
  cancelPlacement: () => set({ placementKind: null, dragKind: null, previewPosition: null, placementFeedback: '' }),
  setPreviewPosition: (point) => set({ previewPosition: point }),
  setPlacementFeedback: (message) => set({ placementFeedback: message }),
  closePanels: () => set({ libraryOpen: false, inspectorOpen: false }),
  openPanels: () => set({ libraryOpen: true, inspectorOpen: true }),
}));
