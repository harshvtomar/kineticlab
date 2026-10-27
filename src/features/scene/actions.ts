import { selectMechanicalObject } from '../../domain/registry';
import { placementStatusMessage, placeMechanicalObject, type PlaceableKind, type PlacementStatus } from '../../domain/placement';
import { isRemovableObject } from '../../domain/scene-edit';
import { useSceneStore } from './store';
import { useWorkspaceStore } from '../workspace/store';
import { useSimulationStore } from '../simulation/store';
import { cancelObjectEdit } from './editing-actions';

/** Validates selection before arming a deletion; no changes to physics here. */
export function requestObjectDeletion(id: string | null): boolean {
  const object = selectMechanicalObject(useSceneStore.getState().scene, id);
  if (!object || !isRemovableObject(object)) return false;
  cancelObjectEdit();
  useWorkspaceStore.getState().cancelPlacement();
  useWorkspaceStore.getState().setPendingDeleteObjectId(object.id);
  return true;
}

/** Confirmation boundary for both toolbar and Inspector. Fails closed on stale IDs. */
export function confirmObjectDeletion(): boolean {
  const workspace = useWorkspaceStore.getState();
  const pending = workspace.pendingDeleteObjectId;
  if (!pending) return false;
  const outcome = useSceneStore.getState().removeById(pending);
  workspace.setPendingDeleteObjectId(null);
  if (outcome !== 'removed') return false;
  if (useWorkspaceStore.getState().selectedObjectId === pending) {
    useWorkspaceStore.getState().setSelectedObjectId(null);
  }
  // Only actual deletion remounts Rapier, avoiding ghost collisions.
  useSimulationStore.getState().restart();
  return true;
}

/** Single commit boundary for click-placement and HTML5 drag/drop. */
export function commitObjectPlacement(kind: PlaceableKind, x: number, z: number): PlacementStatus {
  const workspace = useWorkspaceStore.getState();
  if (workspace.pendingDeleteObjectId || workspace.helpOpen || workspace.editSession) return 'invalid-position';
  const result = useSceneStore.getState().placeAt(kind, x, z);
  workspace.setPlacementFeedback(placementStatusMessage(result.status));
  if (result.status !== 'placed') return result.status;
  workspace.cancelPlacement();
  workspace.setPlacementFeedback(`Placed ${kind} on the workbench. Select or delete it in the Inspector.`);
  workspace.setSelectedObjectId(result.placedId);
  workspace.setInspectorView('objects');
  // Remount Rapier only when a valid descriptor is committed; stale bodies cannot persist.
  useSimulationStore.getState().restart();
  return result.status;
}

/** Keyboard-friendly fallback for users who cannot drag or point into the WebGL canvas. */
export function quickPlaceAtFreePosition(kind: PlaceableKind): PlacementStatus {
  const scene = useSceneStore.getState().scene;
  for (let z = -4.5; z <= 4.5; z += 0.5) {
    for (let x = -5.5; x <= 5.5; x += 0.5) {
      if (useSceneStore.getState().scene !== scene) return 'invalid-position';
      // Dry-run has no side effects; commit occurs once after a valid location is found.
      if (placeMechanicalObject(scene, kind, x, z).status === 'placed') return commitObjectPlacement(kind, x, z);
    }
  }
  useWorkspaceStore.getState().setPlacementFeedback('No free spot found. Delete objects or use another position.');
  return 'outside-ground';
}
