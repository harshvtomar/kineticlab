/** State for a temporary isolated ramp bench. Does not modify user-authored scene v1. */
import { create } from 'zustand';
import { DEFAULT_RAMP_PARAMETERS, RAMP_BENCH, validateRampParameters, type RampParameters } from '../../domain/ramp-dynamics';
import { useSimulationStore } from './store';
import { useWorkspaceStore } from '../workspace/store';

export type RampSample = Readonly<{ elapsedS:number; distanceM:number; speedMps:number; elevationM:number }>;
interface RampExperimentState {
  enabled: boolean;
  parameters: RampParameters;
  samples: readonly RampSample[];
  runId: number;
  enable: (enabled:boolean)=>void;
  updateParameters: (next:RampParameters)=>void;
  recordSample: (sample:RampSample, runId:number)=>void;
  clearSamples: ()=>void;
}
export const useRampExperimentStore = create<RampExperimentState>((set)=>({
  enabled:false,
  parameters: DEFAULT_RAMP_PARAMETERS,
  samples:[],
  runId:0,
  enable: enabled => {
    const w=useWorkspaceStore.getState();
    if (enabled && (w.editSession || w.pendingDeleteObjectId)) return;
    w.cancelPlacement();
    w.setSelectedObjectId(null);
    if(enabled) {w.setInspectorView('world');w.setInspectorOpen(true);}
    set(s=>s.enabled===enabled?s:{enabled,runId:s.runId+1,samples:[]});
    useSimulationStore.getState().restart();
  },
  updateParameters: parameters=>{
    validateRampParameters(parameters);
    set(s=>({parameters:Object.freeze({...parameters}),samples:[],runId:s.runId+1}));
    useSimulationStore.getState().restart();
  },
  recordSample: (sample,runId)=>set(s=>{
    if(!s.enabled || s.runId!==runId || !Object.values(sample).every(Number.isFinite)) return s;
    if(s.samples.length && sample.elapsedS<=s.samples[s.samples.length-1].elapsedS) return s;
    return {samples:[...s.samples.slice(-(RAMP_BENCH.sampleLimit-1)),Object.freeze({...sample})]};
  }),
  clearSamples:()=>set(s=>({samples:[],runId:s.runId+1})),
}));
