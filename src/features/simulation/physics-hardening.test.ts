import {beforeEach, describe, expect, it} from 'vitest';
import {initialSimulationView, useSimulationStore} from './store';
import {EMPTY_CONTACT_LEDGER} from '../../domain/contact-ledger';
import {useSceneStore} from '../scene/store';
import {STARTER_SCENE} from '../../domain/starter-scene';

beforeEach(()=>{
 useSimulationStore.setState(initialSimulationView);
 useSceneStore.getState().restoreStarterScene();
});

describe('Stage 8 physics run lifecycle',()=>{
 it('accumulates collision events without affecting run or scene',()=>{
  const initial=useSceneStore.getState().scene;
  useSimulationStore.getState().beginContact('ball-01','ground-01');
  expect(useSimulationStore.getState().contactLedger.starts).toBe(1);
  expect(useSceneStore.getState().scene).toBe(initial);
  expect(useSimulationStore.getState().paused).toBe(false);
 });
 it('ignores duplicate enter/exit callbacks',()=>{
  const s=useSimulationStore.getState();
  s.beginContact('ball-01','ground-01');
  s.beginContact('ground-01','ball-01');
  s.endContact('ball-01','ground-01');
  s.endContact('ground-01','ball-01');
  expect(useSimulationStore.getState().contactLedger).toMatchObject({starts:1,ends:1,activeKeys:[]});
 });
 it('retains contact history when paused and resumed',()=>{
  useSimulationStore.getState().beginContact('ball-01','ground-01');
  useSimulationStore.getState().togglePaused();
  useSimulationStore.getState().togglePaused();
  expect(useSimulationStore.getState().contactLedger.starts).toBe(1);
 });
 it('Restart remounts a running world and resets episode contact diagnostics',()=>{
  useSimulationStore.getState().beginContact('ball-01','ground-01');
  useSimulationStore.getState().pause();
  useSimulationStore.getState().restart();
  const s=useSimulationStore.getState();
  expect(s.resetEpoch).toBe(1);
  expect(s.paused).toBe(false);
  expect(s.contactLedger).toBe(EMPTY_CONTACT_LEDGER);
  expect(useSceneStore.getState().scene).toBe(STARTER_SCENE);
 });
 it('edit commit remounts world paused and clears prior contact history',()=>{
  useSimulationStore.getState().beginContact('ball-01','ground-01');
  useSimulationStore.getState().remountPaused();
  expect(useSimulationStore.getState()).toMatchObject({paused:true,resetEpoch:1,contactLedger:EMPTY_CONTACT_LEDGER});
 });
 it('grid toggle and history clear never remount physics',()=>{
  const s=useSimulationStore.getState();
  s.beginContact('ball-01','ground-01');
  s.toggleGrid();
  s.clearContactHistory();
  expect(useSimulationStore.getState().resetEpoch).toBe(0);
  expect(useSimulationStore.getState().contactLedger.activeKeys).toHaveLength(1);
  expect(useSimulationStore.getState().contactLedger.records).toHaveLength(0);
 });
});
