import {LEVER,LEVER_PRESETS,idealGravityTorques,leverDirection,predictedLeverOutcome,type LeverParameters} from '../../domain/lever-dynamics';
import {useLeverStore} from '../../features/simulation/lever-store';
import {useSimulationStore} from '../../features/simulation/store';

export function LeverExperimentPanel(){
  const enabled=useLeverStore(s=>s.enabled);
  const p=useLeverStore(s=>s.parameters);
  const samples=useLeverStore(s=>s.samples);
  const change=useLeverStore(s=>s.updateParameters);
  const enable=useLeverStore(s=>s.enable);
  const paused=useSimulationStore(s=>s.paused);
  const last=samples.at(-1);
  const initial=idealGravityTorques(p);
  const current=last?idealGravityTorques(p,last.angleDeg*Math.PI/180):initial;
  const field=(key:keyof LeverParameters,value:number)=>change({...p,[key]:value});
  const sliders:ReadonlyArray<readonly [keyof LeverParameters,string,number,number,number,string]>=[
    ['leftMassKg','Left mass',0.25,5,0.25,'kg'],
    ['rightMassKg','Right mass',0.25,5,0.25,'kg'],
    ['beamMassKg','Beam mass',0.5,3,0.1,'kg'],
    ['leftArmM','Left arm from beam centre',0.65,2.35,0.05,'m'],
    ['rightArmM','Right arm from beam centre',0.65,2.35,0.05,'m'],
    ['fulcrumOffsetM','Fulcrum offset (+ towards right)',-0.5,0.5,0.05,'m'],
    ['angularDamping','Angular damping',0,1.5,0.05,''],
  ];
  return <section className="physics-contact-panel ramp-bench-panel" aria-label="Stage 12 lever and seesaw experiment">
    <div className="physics-contact-heading"><strong>STAGE 12 · LEVER & SEESAW</strong></div>
    <p className="physics-contact-note">Real Rapier revolute joint between a fixed fulcrum and a dynamic beam. Each load is a mass-bearing collider rigidly attached to the beam; motion is driven by gravity.</p>
    <button type="button" className={`btn ${enabled?'btn-primary':'btn-secondary'}`} aria-pressed={enabled} onClick={()=>enable(!enabled)}>
      {enabled?'Return to editable scene':'Open lever laboratory'}
    </button>
    {enabled&&<>
      <div className="ramp-preset-grid" role="group" aria-label="Lever configurations">
        {(Object.keys(LEVER_PRESETS) as Array<keyof typeof LEVER_PRESETS>).map(name=><button type="button" key={name} className="btn btn-secondary" onClick={()=>change(LEVER_PRESETS[name])}>{({balanced:'Balanced',leftHeavy:'Left heavy',rightHeavy:'Right heavy',offsetPivot:'Offset pivot'} as const)[name]}</button>)}
      </div>
      {sliders.map(([key,label,min,max,step,unit])=><div key={key}>
        <label className="ramp-control-label" htmlFor={`lever-${key}`}>{label}: <strong>{p[key].toFixed(2)} {unit}</strong></label>
        <input id={`lever-${key}`} type="range" min={min} max={max} step={step} value={p[key]} onChange={e=>field(key,Number(e.target.value))}/>
      </div>)}
      <div className="ramp-preset-grid"><button type="button" className="btn btn-secondary" onClick={()=>useLeverStore.getState().resetRun()}>Reset lever</button>
        <button type="button" className="btn btn-secondary" disabled={!samples.length} onClick={()=>useLeverStore.getState().clearSamples()}>Clear measurements</button></div>
      <div className="property-list" aria-live="polite">
        <div><span>Initial left gravitational moment</span><strong>{initial.leftNm.toFixed(2)} N·m</strong></div>
        <div><span>Initial right gravitational moment</span><strong>{initial.rightNm.toFixed(2)} N·m</strong></div>
        <div><span>Beam moment about offset pivot</span><strong>{initial.beamNm.toFixed(2)} N·m</strong></div>
        <div><span>Ideal initial net torque (+ left)</span><strong>{initial.netNm.toFixed(2)} N·m</strong></div>
        <div><span>Ideal expected direction</span><strong>{predictedLeverOutcome(p)}</strong></div>
        <div><span>Measured lever angle</span><strong>{(last?.angleDeg??0).toFixed(2)}°</strong></div>
        <div><span>Measured angular velocity</span><strong>{(last?.angularSpeedRadS??0).toFixed(3)} rad/s</strong></div>
        <div><span>Current ideal gravity torque</span><strong>{current.netNm.toFixed(2)} N·m</strong></div>
        <div><span>Observed direction</span><strong>{last?leverDirection(last.angleDeg):'not yet measured'}</strong></div>
        <div><span>Elapsed renderer-sampled time</span><strong>{(last?.elapsedS??0).toFixed(2)} s</strong></div>
        <div><span>Simulation</span><strong>{paused?'Paused':'Running'}</strong></div>
      </div>
      <p className="physics-contact-note">A zero-angle beam balances ideally when net gravitational torque is within {LEVER.balanceToleranceNm.toFixed(2)} N·m. Theoretical moments omit joint friction, contact reactions and transient inertia. The beam and loads move as one rigid assembly around a true z-axis hinge. Results are an instructional model, not a certified force calculation.</p>
    </>}
  </section>;
}
