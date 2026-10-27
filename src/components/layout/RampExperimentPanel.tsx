import {useLeverStore} from '../../features/simulation/lever-store';
import { RAMP_PRESETS, RAMP_BENCH, idealDownhillAcceleration, type RampParameters } from '../../domain/ramp-dynamics';
import { useRampExperimentStore } from '../../features/simulation/ramp-store';
import { useSimulationStore } from '../../features/simulation/store';
import { useDominoStore } from '../../features/simulation/domino-store';

export function RampExperimentPanel() {
  const enabled=useRampExperimentStore(s=>s.enabled);
  const toggle=useRampExperimentStore(s=>s.enable);
  const params=useRampExperimentStore(s=>s.parameters);
  const update=useRampExperimentStore(s=>s.updateParameters);
  const samples=useRampExperimentStore(s=>s.samples);
  const paused=useSimulationStore(s=>s.paused);
  const latest=samples[samples.length-1];
  const change=(field:keyof RampParameters,value:number|string)=>update({...params,[field]:value});
  return <section className="physics-contact-panel ramp-bench-panel" aria-label="Stage 10 balls and ramps experiment">
    <div className="physics-contact-heading"><strong>STAGE 10 · BALLS & RAMPS</strong></div>
    <p className="physics-contact-note">Opt-in independent Rapier ramp bench. Switching back restores the editable Stage 9 scene unchanged.</p>
    <button type="button" className={`btn ${enabled?'btn-primary':'btn-secondary'}`} aria-pressed={enabled} onClick={()=>{if(!enabled) {useDominoStore.getState().enable(false);useLeverStore.getState().enable(false);}toggle(!enabled);}}>
      {enabled?'Return to editable scene':'Open ramp laboratory'}
    </button>
    {enabled && <>
      <div className="ramp-preset-grid" role="group" aria-label="Ramp experiment presets">
        {(Object.keys(RAMP_PRESETS) as Array<keyof typeof RAMP_PRESETS>).map(name=><button key={name} className="btn btn-secondary" type="button" onClick={()=>update(RAMP_PRESETS[name])}>{name.charAt(0).toUpperCase()+name.slice(1)}</button>)}
      </div>
      <label className="ramp-control-label" htmlFor="ramp-slope">Slope: <strong>{params.angleDegrees}°</strong></label>
      <input id="ramp-slope" type="range" min="5" max="30" step="1" value={params.angleDegrees} onChange={e=>change('angleDegrees',Number(e.target.value))}/>
      <label className="ramp-control-label" htmlFor="ramp-friction">Collider friction: <strong>{params.friction.toFixed(2)}</strong></label>
      <input id="ramp-friction" type="range" min="0" max="1.2" step="0.05" value={params.friction} onChange={e=>change('friction',Number(e.target.value))}/>
      <label className="ramp-control-label" htmlFor="ramp-restitution">Restitution: <strong>{params.restitution.toFixed(2)}</strong></label>
      <input id="ramp-restitution" type="range" min="0" max="0.8" step="0.05" value={params.restitution} onChange={e=>change('restitution',Number(e.target.value))}/>
      <label className="ramp-control-label" htmlFor="ramp-motion">Motion model</label>
      <select id="ramp-motion" value={params.motion} onChange={e=>change('motion',e.target.value==='slide'?'slide':'roll')}>
        <option value="roll">Free rotation · rolling/slipping</option>
        <option value="slide">Rotation locked · sliding</option>
      </select>
      <p className="physics-contact-note">Changing a parameter restarts the ramp bench. Friction may produce a mix of rolling and slipping; locking rotation isolates sliding. Bounce after leaving the ramp depends on restitution and contact geometry.</p>
      <div className="property-list" aria-live="polite">
        <div><span>Ideal reference accel.</span><strong>{idealDownhillAcceleration(params).toFixed(2)} m/s²</strong></div>
        <div><span>Elapsed (render est.)</span><strong>{latest?latest.elapsedS.toFixed(2):'—'} s</strong></div>
        <div><span>Ball speed</span><strong>{latest?latest.speedMps.toFixed(2):'—'} m/s</strong></div>
        <div><span>Along ramp travel</span><strong>{latest?latest.distanceM.toFixed(2):'—'} m</strong></div>
        <div><span>Ball height</span><strong>{latest?latest.elevationM.toFixed(2):'—'} m</strong></div>
        <div><span>Motion samples</span><strong>{samples.length}/{RAMP_BENCH.sampleLimit}</strong></div>
        <div><span>Physics</span><strong>{paused?'Paused':'Running'}</strong></div>
      </div>
      <button type="button" className="btn btn-secondary" onClick={()=>{useRampExperimentStore.getState().clearSamples();useSimulationStore.getState().restart();}}>Restart experiment</button>
      <p className="physics-contact-note">Theoretical ideal acceleration assumes no dissipation or contact loss. Speed and elapsed time are renderer-sampled diagnostics; use the fixed-step Rapier smoke test for reproducibility checks. Not a certified engineering calculation.</p>
    </>}
  </section>;
}
