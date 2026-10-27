import {beforeEach,describe,it,expect} from 'vitest';
import {useLeverStore} from './lever-store';
import {useDominoStore} from './domino-store';
import {useRampExperimentStore} from './ramp-store';
import {useSimulationStore} from './store';
import {useWorkspaceStore} from '../workspace/store';
import {DEFAULT_LEVER_PARAMETERS,LEVER,LEVER_PRESETS} from '../../domain/lever-dynamics';

beforeEach(()=>{
  useLeverStore.getState().enable(false);
  useDominoStore.getState().enable(false);
  useRampExperimentStore.getState().enable(false);
  useLeverStore.getState().updateParameters(DEFAULT_LEVER_PARAMETERS);
});

describe('Stage 12 isolated lever run lifecycle',()=>{
  it('does not touch saved scene registry when selecting a bench',()=>{
    useLeverStore.getState().enable(true);
    expect(useLeverStore.getState().enabled).toBe(true);
    expect(useWorkspaceStore.getState().inspectorView).toBe('world');
    expect(useLeverStore.getState().samples).toHaveLength(0);
  });
  it('activating the lever deactivates other experiments',()=>{
    useRampExperimentStore.getState().enable(true);
    useLeverStore.getState().enable(true);
    expect(useRampExperimentStore.getState().enabled).toBe(false);
    expect(useDominoStore.getState().enabled).toBe(false);
  });
  it('a new preset invalidates the old run and measurements',()=>{
    useLeverStore.getState().enable(true);
    const id=useLeverStore.getState().runId;
    useLeverStore.getState().record({elapsedS:1,angleDeg:11,angularSpeedRadS:0.3},id);
    expect(useLeverStore.getState().samples).toHaveLength(1);
    useLeverStore.getState().updateParameters(LEVER_PRESETS.leftHeavy);
    expect(useLeverStore.getState().runId).toBeGreaterThan(id);
    expect(useLeverStore.getState().samples).toHaveLength(0);
    useLeverStore.getState().record({elapsedS:2,angleDeg:100,angularSpeedRadS:3},id);
    expect(useLeverStore.getState().samples).toHaveLength(0);
  });
  it('rejects malformed, duplicate and reversed-time samples',()=>{
    useLeverStore.getState().enable(true);
    const id=useLeverStore.getState().runId;
    useLeverStore.getState().record({elapsedS:1,angleDeg:3,angularSpeedRadS:1},id);
    useLeverStore.getState().record({elapsedS:1,angleDeg:5,angularSpeedRadS:1},id);
    useLeverStore.getState().record({elapsedS:0.5,angleDeg:5,angularSpeedRadS:1},id);
    useLeverStore.getState().record({elapsedS:2,angleDeg:NaN,angularSpeedRadS:1},id);
    expect(useLeverStore.getState().samples).toHaveLength(1);
  });
  it('keeps diagnostic samples bounded',()=>{
    useLeverStore.getState().enable(true);
    const id=useLeverStore.getState().runId;
    for(let n=1;n<=LEVER.maxEvents+30;n++) useLeverStore.getState().record({elapsedS:n,angleDeg:n/10,angularSpeedRadS:0},id);
    expect(useLeverStore.getState().samples).toHaveLength(LEVER.maxEvents);
  });
  it('resetRun invalidates stale samples; no old readings survive',()=>{
    useLeverStore.getState().enable(true);
    const id=useLeverStore.getState().runId;
    useSimulationStore.getState().restart();
    useLeverStore.getState().resetRun();
    expect(useLeverStore.getState().runId).not.toBe(id);
    useLeverStore.getState().record({elapsedS:1,angleDeg:5,angularSpeedRadS:0},id);
    expect(useLeverStore.getState().samples).toHaveLength(0);
  });
});
