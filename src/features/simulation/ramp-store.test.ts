import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_RAMP_PARAMETERS, RAMP_PRESETS } from '../../domain/ramp-dynamics';
import { useSceneStore } from '../scene/store';
import { useWorkspaceStore,initialWorkspaceView } from '../workspace/store';
import { useSimulationStore, initialSimulationView } from './store';
import { useRampExperimentStore } from './ramp-store';

beforeEach(()=>{
  useRampExperimentStore.setState({enabled:false,parameters:DEFAULT_RAMP_PARAMETERS,samples:[],runId:0});
  useSimulationStore.setState(initialSimulationView);
  useWorkspaceStore.setState(initialWorkspaceView);
});

describe('Stage 10 separate ramp bench lifecycle',()=>{
  it('initial state keeps authored editor view as default',()=>{
    expect(useRampExperimentStore.getState().enabled).toBe(false);
    expect(useRampExperimentStore.getState().samples).toHaveLength(0);
  });
  it('bench switch is isolated from authored scene snapshot',()=>{
    const original=useSceneStore.getState().scene;
    useRampExperimentStore.getState().enable(true);
    expect(useSceneStore.getState().scene).toBe(original);
    expect(useWorkspaceStore.getState().inspectorView).toBe('world');
    expect(useSimulationStore.getState().resetEpoch).toBe(1);
    useRampExperimentStore.getState().enable(false);
    expect(useSceneStore.getState().scene).toBe(original);
  });
  it('changing slope remounts world and clears samples',()=>{
    useRampExperimentStore.getState().enable(true);
    const runId=useRampExperimentStore.getState().runId;
    useRampExperimentStore.getState().recordSample({elapsedS:1,distanceM:1,speedMps:1,elevationM:2},runId);
    expect(useRampExperimentStore.getState().samples).toHaveLength(1);
    useRampExperimentStore.getState().updateParameters(RAMP_PRESETS.bouncy);
    expect(useRampExperimentStore.getState().parameters.restitution).toBe(.75);
    expect(useRampExperimentStore.getState().samples).toHaveLength(0);
    expect(useSimulationStore.getState().resetEpoch).toBe(2);
  });
  it('stale sample cannot enter new run',()=>{
    useRampExperimentStore.getState().enable(true);
    const runId=useRampExperimentStore.getState().runId;
    useRampExperimentStore.getState().clearSamples();
    useRampExperimentStore.getState().recordSample({elapsedS:2,distanceM:1,speedMps:2,elevationM:1},runId);
    expect(useRampExperimentStore.getState().samples).toHaveLength(0);
  });
  it('monotonic sample times and non-finite values enforced',()=>{
    useRampExperimentStore.getState().enable(true);
    const runId=useRampExperimentStore.getState().runId;
    const record=useRampExperimentStore.getState().recordSample;
    record({elapsedS:1,distanceM:0,speedMps:0,elevationM:2},runId);
    record({elapsedS:1,distanceM:1,speedMps:1,elevationM:1},runId);
    record({elapsedS:2,distanceM:Infinity,speedMps:1,elevationM:1},runId);
    expect(useRampExperimentStore.getState().samples).toHaveLength(1);
  });
  it('cannot enter bench during an unfinished transform edit',()=>{
    const ws=useWorkspaceStore.getState();
    const base=useSceneStore.getState().scene;
    const object=base.objects.find(o=>o.kind==='ramp')!;
    ws.startEdit({id:object.id,base,draft:object.transform,mode:'translate'});
    useRampExperimentStore.getState().enable(true);
    expect(useRampExperimentStore.getState().enabled).toBe(false);
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
  });
  it('invalid parameters are rejected without changing physics epoch',()=>{
    expect(()=>useRampExperimentStore.getState().updateParameters({...DEFAULT_RAMP_PARAMETERS,angleDegrees:90})).toThrow();
    expect(useSimulationStore.getState().resetEpoch).toBe(0);
  });
});
