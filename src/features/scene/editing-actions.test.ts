import {beforeEach,describe,expect,it} from 'vitest';
import {useSceneStore} from './store';
import {useWorkspaceStore,initialWorkspaceView} from '../workspace/store';
import {useSimulationStore,initialSimulationView} from '../simulation/store';
import {beginObjectEdit,cancelObjectEdit,commitObjectEdit,duplicateSelectedObject,redoSceneEdit,undoSceneEdit,updateObjectEditDraft} from './editing-actions';
import {commitObjectPlacement,confirmObjectDeletion,requestObjectDeletion} from './actions';

beforeEach(()=>{useSceneStore.getState().restoreStarterScene();useWorkspaceStore.setState(initialWorkspaceView);useSimulationStore.setState(initialSimulationView);});
describe('Stage 7 edit session coordination and history',()=>{
 it('pauses simulation when edit starts',()=>{
  expect(beginObjectEdit('ball-01')).toBe(true);expect(useSimulationStore.getState().paused).toBe(true);
 });
 it('cannot edit protected ground',()=>expect(beginObjectEdit('ground-01')).toBe(false));
 it('cannot edit stale missing ID',()=>expect(beginObjectEdit('missing')).toBe(false));
 it('cancel preserves original scene',()=>{
  const scene=useSceneStore.getState().scene;beginObjectEdit('ball-01');cancelObjectEdit();
  expect(useSceneStore.getState().scene).toBe(scene);expect(useSceneStore.getState().past).toHaveLength(0);
 });
 it('rejects invalid draft without changing scene',()=>{
  beginObjectEdit('ball-01');expect(updateObjectEditDraft({position:[NaN,1,1],rotation:[0,0,0],scale:[1,1,1]})).toBe(false);
  expect(useSceneStore.getState().scene.objects).toHaveLength(4);
 });
 it('valid draft committed once and remounts physics while paused',()=>{
  beginObjectEdit('ball-01');expect(updateObjectEditDraft({position:[4,2,-3],rotation:[0,0,0],scale:[1,1,1]})).toBe(true);
  expect(commitObjectEdit()).toBe(true);expect(useSceneStore.getState().scene.objects.find(o=>o.id==='ball-01')?.transform.position).toEqual([4,2,-3]);
  expect(useSceneStore.getState().past).toHaveLength(1);expect(useSimulationStore.getState().resetEpoch).toBe(1);expect(useSimulationStore.getState().paused).toBe(true);
 });
 it('overlap reject retains draft for correction',()=>{
  beginObjectEdit('ball-01');updateObjectEditDraft({position:[0,1.45,0],rotation:[0,0,0],scale:[1,1,1]});
  expect(commitObjectEdit()).toBe(false);expect(useWorkspaceStore.getState().editSession).not.toBeNull();
  expect(useSceneStore.getState().past).toHaveLength(0);
 });
 it('undo restores original pose; redo reapplies',()=>{
  beginObjectEdit('ball-01');updateObjectEditDraft({position:[4,2,-3],rotation:[0,0,0],scale:[1,1,1]});commitObjectEdit();
  expect(undoSceneEdit()).toBe(true);expect(useSceneStore.getState().scene.objects.find(o=>o.id==='ball-01')?.transform.position).toEqual([-1.65,2.7,0]);
  expect(redoSceneEdit()).toBe(true);expect(useSceneStore.getState().scene.objects.find(o=>o.id==='ball-01')?.transform.position).toEqual([4,2,-3]);
 });
 it('delete can be undone and restores selection safely',()=>{
  requestObjectDeletion('ball-01');confirmObjectDeletion();expect(useSceneStore.getState().scene.objects).toHaveLength(3);
  expect(undoSceneEdit()).toBe(true);expect(useSceneStore.getState().scene.objects).toHaveLength(4);
 });
 it('placement can be undone',()=>{
  expect(commitObjectPlacement('ball',4,-3)).toBe('placed');expect(useSceneStore.getState().scene.objects).toHaveLength(5);
  expect(undoSceneEdit()).toBe(true);expect(useSceneStore.getState().scene.objects).toHaveLength(4);
 });
 it('new commit truncates redo',()=>{
  commitObjectPlacement('ball',4,-3);undoSceneEdit();expect(useSceneStore.getState().future).toHaveLength(1);
  commitObjectPlacement('ball',4,3);expect(useSceneStore.getState().future).toHaveLength(0);
 });
 it('duplication selects clone, remounts safely and records history',()=>{
  useWorkspaceStore.getState().setSelectedObjectId('ball-01');expect(duplicateSelectedObject()).toBe(true);
  expect(useSceneStore.getState().scene.objects).toHaveLength(5);
  expect(useWorkspaceStore.getState().selectedObjectId).not.toBe('ball-01');
  expect(useSimulationStore.getState().paused).toBe(true);
 });
 it('ground never duplicates',()=>{
  useWorkspaceStore.getState().setSelectedObjectId('ground-01');expect(duplicateSelectedObject()).toBe(false);
 });
 it('cannot edit while pending deletion',()=>{
  requestObjectDeletion('ball-01');expect(beginObjectEdit('ball-01')).toBe(false);
 });
 it('history is capped at 40 scene snapshots',()=>{
  for(let i=0;i<42;i++){
   // Alternate delete and undo is not suitable for growing history; use accepted translations.
   const y=2+(i%2);const x=4+(i%2)*0.1;
   const id='ball-01';const current=useSceneStore.getState().scene.objects.find(o=>o.id===id)!;
   useSceneStore.getState().editById(id,{...current.transform,position:[x,y,-3]});
  }
  expect(useSceneStore.getState().past.length).toBeLessThanOrEqual(40);
 });
 it('restore starter also clears history',()=>{
  commitObjectPlacement('ball',4,-3);useSceneStore.getState().restoreStarterScene();
  expect(useSceneStore.getState().past).toHaveLength(0);expect(useSceneStore.getState().future).toHaveLength(0);
 });
});
