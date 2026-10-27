import { create } from 'zustand';
import { STARTER_SCENE } from '../../domain/starter-scene';
import { removeMechanicalObject, type RemovalResult } from '../../domain/scene-edit';
import type { MechanicalScene } from '../../domain/registry';
import { placeMechanicalObject, type PlacementResult } from '../../domain/placement';
import { transformMechanicalObject, duplicateMechanicalObject, type EditResult } from '../../domain/transforms';
import type { Transform } from '../../domain/registry';

export interface SceneState {
  scene: MechanicalScene;
  past: readonly MechanicalScene[];
  future: readonly MechanicalScene[];
  editById: (id: string, transform: Transform) => EditResult;
  duplicateById: (id: string) => EditResult;
  undo: () => boolean;
  redo: () => boolean;
  removeById: (id: string) => RemovalResult['status'];
  placeAt: (kind: unknown, x: number, z: number) => PlacementResult;
  /** Local editor reset, separate from the simulation transport's Restart. */
  restoreStarterScene: () => void;
}

/** Source of truth for immutable scene descriptors, shared by Inspector and Rapier. */
export const useSceneStore = create<SceneState>((set, get) => ({
  scene: STARTER_SCENE,
  past: [],
  future: [],
  editById: (id, transform) => {
    const result = transformMechanicalObject(get().scene,id,transform);
    if(result.status==='updated') set(s=>({scene:result.scene,past:[...s.past.slice(-39),s.scene],future:[]}));
    return result;
  },
  duplicateById: id => {
    const result=duplicateMechanicalObject(get().scene,id);
    if(result.status==='duplicated') set(s=>({scene:result.scene,past:[...s.past.slice(-39),s.scene],future:[]}));
    return result;
  },
  undo:()=>{
    const s=get();if(!s.past.length)return false;
    set({scene:s.past[s.past.length-1],past:s.past.slice(0,-1),future:[s.scene,...s.future].slice(0,40)});
    return true;
  },
  redo:()=>{
    const s=get();if(!s.future.length)return false;
    set({scene:s.future[0],future:s.future.slice(1),past:[...s.past.slice(-39),s.scene]});
    return true;
  },
  removeById: id => {
    const result = removeMechanicalObject(get().scene, id);
    if (result.status === 'removed') set(s=>({scene:result.scene,past:[...s.past.slice(-39),s.scene],future:[]}));
    return result.status;
  },
  placeAt: (kind, x, z) => {
    const result = placeMechanicalObject(get().scene, kind, x, z);
    if (result.status === 'placed') set(s=>({scene:result.scene,past:[...s.past.slice(-39),s.scene],future:[]}));
    return result;
  },
  restoreStarterScene: () => set({ scene: STARTER_SCENE, past: [], future: [] }),
}));
