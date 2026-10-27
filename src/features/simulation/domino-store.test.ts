import {beforeEach,describe,expect,it} from 'vitest';
import {DEFAULT_DOMINO_PARAMETERS,DOMINO_PRESETS} from '../../domain/domino-dynamics';
import {useDominoStore} from './domino-store';
import {useSimulationStore} from './store';

beforeEach(()=>{
  useDominoStore.setState({enabled:false,parameters:DEFAULT_DOMINO_PARAMETERS,runId:0,launched:false,elapsedS:0,angles:[],events:[]});
  useSimulationStore.setState({paused:false,resetEpoch:0});
});
describe('Stage 11 transient experiment lifecycle',()=>{
  it('enables isolated experiment without editing scene',()=>{
    const prior=useDominoStore.getState().runId;
    useDominoStore.getState().enable(true);
    expect(useDominoStore.getState().enabled).toBe(true);
    expect(useDominoStore.getState().runId).toBeGreaterThan(prior);
  });
  it('resets on parameter update',()=>{
    useDominoStore.setState({enabled:true,launched:true,elapsedS:4,angles:[72],events:[{kind:'topple',index:0,elapsedS:2}]});
    useDominoStore.getState().updateParameters(DOMINO_PRESETS.tight);
    expect(useDominoStore.getState()).toMatchObject({launched:false,elapsedS:0,events:[],angles:[]});
    expect(useDominoStore.getState().parameters.count).toBe(11);
  });
  it('rejects invalid params without mutating current state',()=>{
    const before=useDominoStore.getState();
    expect(()=>before.updateParameters({...DEFAULT_DOMINO_PARAMETERS,count:999})).toThrow();
    expect(useDominoStore.getState().parameters).toBe(before.parameters);
  });
  it('ignores stale run reports',()=>{
    useDominoStore.setState({enabled:true,launched:true,runId:10});
    useDominoStore.getState().record(Array(9).fill(90),2,9);
    expect(useDominoStore.getState().events).toEqual([]);
  });
  it('records tipping threshold crossing once',()=>{
    useDominoStore.setState({enabled:true,launched:true,runId:2});
    useDominoStore.getState().record([55,...Array(8).fill(0)],.5,2);
    useDominoStore.getState().record([76,...Array(8).fill(0)],.7,2);
    expect(useDominoStore.getState().events.filter(x=>x.kind==='topple')).toHaveLength(1);
  });
  it('logs adjacent domino contacts only once',()=>{
    useDominoStore.setState({enabled:true,launched:true,runId:2});
    useDominoStore.getState().contact('domino-01','domino-02',.4,2);
    useDominoStore.getState().contact('domino-02','domino-01',.5,2);
    useDominoStore.getState().contact('domino-01','domino-04',.6,2);
    expect(useDominoStore.getState().events).toHaveLength(1);
  });
  it('reset prevents old run events from being recorded',()=>{
    useDominoStore.setState({enabled:true,launched:true,runId:4});
    useDominoStore.getState().resetRun();
    useDominoStore.getState().contact('domino-01','domino-02',.2,4);
    expect(useDominoStore.getState()).toMatchObject({launched:false,events:[]});
  });
});
