/** Ephemeral Stage 11 experiment state. No writes to registry or saved scenes. */
import { create } from 'zustand';
import { DOMINO, DEFAULT_DOMINO_PARAMETERS, dominoIndex, validateDominoParameters, type DominoParameters } from '../../domain/domino-dynamics';
import { useSimulationStore } from './store';
import { useWorkspaceStore } from '../workspace/store';
import { useRampExperimentStore } from './ramp-store';

export type DominoEvent = Readonly<{kind:'topple'|'contact'; index:number; elapsedS:number; otherIndex?:number}>;
export interface DominoState {
  enabled:boolean;
  parameters:DominoParameters;
  runId:number;
  launched:boolean;
  elapsedS:number;
  angles:readonly number[];
  events:readonly DominoEvent[];
  enable:(value:boolean)=>void;
  updateParameters:(parameters:DominoParameters)=>void;
  trigger:()=>void;
  record:(angles:readonly number[], elapsedS:number, runId:number)=>void;
  contact:(firstId:string,secondId:string,elapsedS:number,runId:number)=>void;
  clearEvents:()=>void;
  resetRun:()=>void;
}
export const useDominoStore=create<DominoState>((set)=>({
  enabled:false,parameters:DEFAULT_DOMINO_PARAMETERS,runId:0,launched:false,elapsedS:0,angles:[],events:[],
  enable(value){
    if(value) {
      const workspace=useWorkspaceStore.getState();
      if(workspace.editSession || workspace.pendingDeleteObjectId) return;
      useRampExperimentStore.getState().enable(false);
      workspace.cancelPlacement();workspace.setSelectedObjectId(null);
      workspace.setInspectorView('world');workspace.setInspectorOpen(true);
    }
    set(s=>s.enabled===value?s:{enabled:value,runId:s.runId+1,launched:false,elapsedS:0,angles:[],events:[]});
    useSimulationStore.getState().restart();
  },
  updateParameters(parameters){
    validateDominoParameters(parameters);
    set(s=>({...s,parameters:Object.freeze({...parameters}),runId:s.runId+1,launched:false,elapsedS:0,angles:[],events:[]}));
    useSimulationStore.getState().restart();
  },
  trigger(){
    set(s=>s.enabled && !s.launched?{launched:true}:s);
    if(useDominoStore.getState().enabled) useSimulationStore.getState().paused && useSimulationStore.getState().togglePaused();
  },
  record(angles,elapsedS,runId){
    set(s=>{
      if(!s.enabled || s.runId!==runId || !s.launched || !Number.isFinite(elapsedS) || elapsedS<s.elapsedS || angles.length!==s.parameters.count || !angles.every(Number.isFinite)) return s;
      const events=[...s.events];
      for(let i=0;i<angles.length;i++) if(angles[i]>=DOMINO.tiltThresholdDegrees && (s.angles[i]??0)<DOMINO.tiltThresholdDegrees) events.push(Object.freeze({kind:'topple' as const,index:i,elapsedS}));
      return {angles:Object.freeze([...angles]),elapsedS,events:Object.freeze(events.slice(-DOMINO.maxEvents))};
    });
  },
  contact(firstId,secondId,elapsedS,runId){
    set(s=>{
      if(!s.enabled ||s.runId!==runId || !s.launched || !Number.isFinite(elapsedS)) return s;
      const a=dominoIndex(firstId),b=dominoIndex(secondId);
      if(a===null ||b===null||Math.abs(a-b)!==1) return s;
      const index=Math.min(a,b),otherIndex=Math.max(a,b);
      if(s.events.some(e=>e.kind==='contact'&&e.index===index&&e.otherIndex===otherIndex)) return s;
      return {events:Object.freeze([...s.events,{kind:'contact' as const,index,otherIndex,elapsedS}].slice(-DOMINO.maxEvents))};
    });
  },
  clearEvents(){set(s=>({...s,events:[]}));},
  resetRun(){set(s=>({...s,runId:s.runId+1,launched:false,elapsedS:0,angles:[],events:[]}));},
}));
