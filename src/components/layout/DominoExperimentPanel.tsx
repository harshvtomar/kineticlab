import {useLeverStore} from '../../features/simulation/lever-store';
import { DOMINO, DOMINO_PRESETS, chainSucceeded, toppedCount, type DominoParameters } from '../../domain/domino-dynamics';
import { useDominoStore } from '../../features/simulation/domino-store';
import { useSimulationStore } from '../../features/simulation/store';

export function DominoExperimentPanel(){
  const enabled=useDominoStore(s=>s.enabled);
  const parameters=useDominoStore(s=>s.parameters);
  const angles=useDominoStore(s=>s.angles);
  const events=useDominoStore(s=>s.events);
  const elapsed=useDominoStore(s=>s.elapsedS);
  const launched=useDominoStore(s=>s.launched);
  const enable=useDominoStore(s=>s.enable);
  const update=useDominoStore(s=>s.updateParameters);
  const paused=useSimulationStore(s=>s.paused);
  const change=(field:keyof DominoParameters,value:number)=>update({...parameters,[field]:value});
  const finished=chainSucceeded(angles,parameters.count);
  const fallen=toppedCount(angles);
  const reachedEnd=launched && elapsed>8 && !finished;
  return <section className="physics-contact-panel ramp-bench-panel" aria-label="Stage 11 domino chain experiment">
    <div className="physics-contact-heading"><strong>STAGE 11 · DOMINO CHAIN REACTION</strong></div>
    <p className="physics-contact-note">Isolated Rapier rigid-body bench: each domino is independently simulated; motion transfers only through physical contact. Your editable scene remains intact.</p>
    <button className={`btn ${enabled?'btn-primary':'btn-secondary'}`} type="button" aria-pressed={enabled} onClick={()=>{if(!enabled) useLeverStore.getState().enable(false);enable(!enabled);}}>
      {enabled?'Return to editable scene':'Open domino laboratory'}
    </button>
    {enabled && <>
      <div className="ramp-preset-grid" role="group" aria-label="Domino experiment presets">
        {(Object.keys(DOMINO_PRESETS) as Array<keyof typeof DOMINO_PRESETS>).map(name=><button key={name} type="button" className="btn btn-secondary" onClick={()=>update(DOMINO_PRESETS[name])}>{name.charAt(0).toUpperCase()+name.slice(1)}</button>)}
      </div>
      <label className="ramp-control-label" htmlFor="domino-count">Domino count: <strong>{parameters.count}</strong></label>
      <input id="domino-count" type="range" min="3" max="14" step="1" value={parameters.count} onChange={e=>change('count',Number(e.target.value))}/>
      <label className="ramp-control-label" htmlFor="domino-spacing">Centre spacing: <strong>{parameters.spacingM.toFixed(2)} m</strong></label>
      <input id="domino-spacing" type="range" min="0.22" max="0.75" step="0.01" value={parameters.spacingM} onChange={e=>change('spacingM',Number(e.target.value))}/>
      <label className="ramp-control-label" htmlFor="domino-friction">Friction: <strong>{parameters.friction.toFixed(2)}</strong></label>
      <input id="domino-friction" type="range" min="0.2" max="1.2" step="0.05" value={parameters.friction} onChange={e=>change('friction',Number(e.target.value))}/>
      <label className="ramp-control-label" htmlFor="domino-impulse">Starter impulse: <strong>{parameters.kickImpulseNs.toFixed(2)} N·s</strong></label>
      <input id="domino-impulse" type="range" min="0.15" max="1.5" step="0.05" value={parameters.kickImpulseNs} onChange={e=>change('kickImpulseNs',Number(e.target.value))}/>
      <div className="ramp-preset-grid">
        <button type="button" className="btn btn-primary" disabled={launched} onClick={()=>useDominoStore.getState().trigger()}>Trigger first domino</button>
        <button type="button" className="btn btn-secondary" onClick={()=>useDominoStore.getState().updateParameters(useDominoStore.getState().parameters)}>Reset experiment</button>
      </div>
      <p className="physics-contact-note">Changing any setting resets the physical row. Trigger applies one impulse at the first domino; no other domino receives scripted forces.</p>
      <div className="property-list" aria-live="polite">
        <div><span>Dominoes tipped ≥{DOMINO.tiltThresholdDegrees}°</span><strong>{fallen}/{parameters.count}</strong></div>
        <div><span>Adjacent contacts</span><strong>{events.filter(e=>e.kind==='contact').length}</strong></div>
        <div><span>Time (render estimate)</span><strong>{elapsed.toFixed(2)} s</strong></div>
        <div><span>State</span><strong>{!launched?'Ready':paused?'Paused':finished?'Last domino tipped':reachedEnd?'Incomplete / stalled':'Running'}</strong></div>
      </div>
      <div className="physics-contact-heading"><strong>RECENT CHAIN EVENTS</strong><button type="button" disabled={!events.length} onClick={()=>useDominoStore.getState().clearEvents()}>Clear events</button></div>
      {events.length?<ol className="physics-contact-list" aria-live="polite">{events.slice(-6).reverse().map((event,i)=><li key={`${event.kind}-${event.index}-${i}-${event.elapsedS}`}><span>{event.kind==='topple'?`Domino ${event.index+1} tipped`:`Dominoes ${event.index+1} and ${(event.otherIndex??0)+1} contacted`}</span><small>{event.elapsedS.toFixed(2)} s</small></li>)}</ol>:<p className="physics-contact-empty">No events yet. Press Trigger first domino.</p>}
      <p className="physics-contact-note">A chain is marked successful when the last domino tips ≥50°. Friction, separation and numerical solver effects can stop propagation. Event times are renderer-sampled; fixed-step WASM tests provide the reproducibility baseline.</p>
    </>}
  </section>;
}
