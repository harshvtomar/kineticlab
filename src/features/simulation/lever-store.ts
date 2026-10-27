/** Independent Stage 12 physical seesaw laboratory state (not serialized in scene v1). */
import { create } from 'zustand';
import {DEFAULT_LEVER_PARAMETERS,LEVER,validateLeverParameters,validLeverSample,type LeverParameters} from '../../domain/lever-dynamics';
import {useSimulationStore} from './store';
import {useWorkspaceStore} from '../workspace/store';
import {useRampExperimentStore} from './ramp-store';
import {useDominoStore} from './domino-store';

export type LeverSample = Readonly<{elapsedS:number;angleDeg:number;angularSpeedRadS:number}>;
interface LeverState {
  enabled:boolean;parameters:LeverParameters;runId:number;samples:readonly LeverSample[];
  enable:(value:boolean)=>void;updateParameters:(parameters:LeverParameters)=>void;
  record:(sample:LeverSample,runId:number)=>void;clearSamples:()=>void;resetRun:()=>void;
}
export const useLeverStore=create<LeverState>((set)=>({
  enabled:false,parameters:DEFAULT_LEVER_PARAMETERS,runId:0,samples:[],
  enable(value){
    if(useLeverStore.getState().enabled===value)return;
    if(value){
      const ui=useWorkspaceStore.getState();
      if(ui.editSession||ui.pendingDeleteObjectId)return;
      useRampExperimentStore.getState().enable(false);
      useDominoStore.getState().enable(false);
      ui.cancelPlacement();ui.setSelectedObjectId(null);ui.setInspectorView('world');ui.setInspectorOpen(true);
    }
    set(s=>s.enabled===value?s:{enabled:value,runId:s.runId+1,samples:[]});
    useSimulationStore.getState().restart();
  },
  updateParameters(parameters){
    validateLeverParameters(parameters);
    set(s=>({...s,parameters:Object.freeze({...parameters}),runId:s.runId+1,samples:[]}));
    useSimulationStore.getState().restart();
  },
  record(sample,runId){
    set(s=>{
      if(!s.enabled||s.runId!==runId||!validLeverSample(sample.angleDeg,sample.angularSpeedRadS,sample.elapsedS))return s;
      if(s.samples.length&&sample.elapsedS<=s.samples[s.samples.length-1].elapsedS)return s;
      return {samples:Object.freeze([...s.samples.slice(-(LEVER.maxEvents-1)),Object.freeze({...sample})])};
    });
  },
  clearSamples(){set(s=>({...s,samples:[]}));},
  resetRun(){set(s=>({...s,runId:s.runId+1,samples:[]}));},
}));
