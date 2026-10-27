import { selectMechanicalObject, type Transform } from '../../domain/registry';
import { isSafeTransform, type EditFailure } from '../../domain/transforms';
import { useSceneStore } from './store';
import { useWorkspaceStore, type EditAxisMode } from '../workspace/store';
import { useSimulationStore } from '../simulation/store';

const messages: Record<EditFailure,string> = {
  missing:'Object was removed. Start editing again.',protected:'Ground plane is protected.',
  'invalid-transform':'Use finite positions, rotations within ±720°, and scale from 0.25 to 4.',
  'outside-ground':'Object must fit on the workbench above the ground.',
  overlap:'Transform overlaps another object. Move it to a free location.',
  unchanged:'No changes to apply.',limit:'Scene is at its object limit.',
  'no-space':'No collision-free area exists for a duplicate.',
};

export function beginObjectEdit(id:string | null): boolean {
  const ui=useWorkspaceStore.getState();
  const scene=useSceneStore.getState().scene;
  const obj=selectMechanicalObject(scene,id);
  if(!obj || obj.kind==='ground' || ui.pendingDeleteObjectId || ui.placementKind || ui.dragKind) return false;
  useSimulationStore.getState().pause();
  ui.startEdit({id:obj.id,base:scene,draft:obj.transform,mode:'translate'});
  return true;
}
export function setEditAxisMode(mode:EditAxisMode) { useWorkspaceStore.getState().setEditMode(mode); }
export function updateObjectEditDraft(draft:Transform): boolean {
  const ui=useWorkspaceStore.getState();
  if(!ui.editSession)return false;
  if(!isSafeTransform(draft)) {ui.setEditFeedback(messages['invalid-transform']);return false;}
  ui.updateEditDraft(draft);
  ui.setEditFeedback('Preview only. Choose Apply to commit your change.');
  return true;
}
export function cancelObjectEdit(){useWorkspaceStore.getState().cancelEdit();}
export function commitObjectEdit():boolean {
  const ui=useWorkspaceStore.getState();const session=ui.editSession;
  if(!session)return false;
  if(useSceneStore.getState().scene!==session.base) {ui.setEditFeedback('Scene changed during editing. Cancel and begin again.');return false;}
  const result=useSceneStore.getState().editById(session.id,session.draft);
  if(result.status!=='updated') {ui.setEditFeedback(result.status==='duplicated' ? 'Unexpected duplicate result.' : messages[result.status]);return false;}
  ui.cancelEdit();useSimulationStore.getState().remountPaused();
  return true;
}
export function duplicateSelectedObject():boolean {
  const ui=useWorkspaceStore.getState();
  if(ui.editSession || ui.placementKind || ui.dragKind || ui.pendingDeleteObjectId || ui.helpOpen) return false;
  const id=ui.selectedObjectId;if(!id)return false;
  const result=useSceneStore.getState().duplicateById(id);
  if(result.status!=='duplicated') {ui.setEditFeedback(result.status==='updated' ? 'Unexpected update result.' : messages[result.status]);return false;}
  ui.setSelectedObjectId(result.id);ui.setInspectorView('objects');
  ui.setEditFeedback('Duplicate created. Choose Edit to adjust its pose.');
  useSimulationStore.getState().remountPaused();return true;
}
export function undoSceneEdit():boolean {return traverseHistory('undo');}
export function redoSceneEdit():boolean {return traverseHistory('redo');}
function traverseHistory(direction:'undo'|'redo'):boolean {
  const ui=useWorkspaceStore.getState();
  if(ui.editSession || ui.pendingDeleteObjectId || ui.placementKind || ui.dragKind || ui.helpOpen) return false;
  if(!useSceneStore.getState()[direction]())return false;
  const id=useWorkspaceStore.getState().selectedObjectId;
  if(id && !selectMechanicalObject(useSceneStore.getState().scene,id))ui.setSelectedObjectId(null);
  ui.setEditFeedback(direction==='undo'?'Undid scene edit.':'Redid scene edit.');
  useSimulationStore.getState().remountPaused();
  return true;
}
