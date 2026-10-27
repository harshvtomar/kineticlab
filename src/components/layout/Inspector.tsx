import { Activity, CheckCircle2, CircleGauge, FlaskConical, Layers3, LockKeyhole, Move3d, SlidersHorizontal, Trash2, ShieldCheck, X } from 'lucide-react';
import { PHYSICS_SETTINGS } from '../../domain/fixtures';
import { PHYSICS_POLICY } from '../../domain/physics-policy';
import { SENSOR_REGION } from '../../domain/collision-system';
import { useSceneStore } from '../../features/scene/store';
import { requestObjectDeletion } from '../../features/scene/actions';
import { isRemovableObject } from '../../domain/scene-edit';
import { selectMechanicalObject, selectMechanicalObjects } from '../../domain/registry';
import { useSimulationStore } from '../../features/simulation/store';
import { useWorkspaceStore } from '../../features/workspace/store';
import { ObjectTransformEditor } from './ObjectTransformEditor';
import { RampExperimentPanel } from './RampExperimentPanel';
import { useRampExperimentStore } from '../../features/simulation/ramp-store';
import { useDominoStore } from '../../features/simulation/domino-store';
import { DominoExperimentPanel } from './DominoExperimentPanel';
import {useLeverStore} from '../../features/simulation/lever-store';
import {LeverExperimentPanel} from './LeverExperimentPanel';

export function Inspector() {
  const paused = useSimulationStore(s => s.paused);
  const rampBench=useRampExperimentStore(s=>s.enabled);
  const dominoBench=useDominoStore(s=>s.enabled);
  const leverBench=useLeverStore(s=>s.enabled);
  const isolatedBench=rampBench || dominoBench || leverBench;
  const resetEpoch = useSimulationStore(s => s.resetEpoch);
  const contacts = useSimulationStore(s => s.contactLedger);
  const clearContactHistory = useSimulationStore(s => s.clearContactHistory);
  const sensors = useSimulationStore(s => s.sensorLedger);
  const collisionMode = useSimulationStore(s => s.collisionMode);
  const setCollisionMode = useSimulationStore(s => s.setCollisionMode);
  const sensorEnabled = useSimulationStore(s => s.sensorEnabled);
  const setSensorEnabled = useSimulationStore(s => s.setSensorEnabled);
  const collisionDebug = useSimulationStore(s => s.collisionDebug);
  const toggleCollisionDebug = useSimulationStore(s => s.toggleCollisionDebug);
  const editSession = useWorkspaceStore(s => s.editSession);
  const view = useWorkspaceStore(s => s.inspectorView);
  const setView = useWorkspaceStore(s => s.setInspectorView);
  const selectedId = useWorkspaceStore(s => s.selectedObjectId);
  const setSelected = useWorkspaceStore(s => s.setSelectedObjectId);
  const setInspectorOpen = useWorkspaceStore(s => s.setInspectorOpen);
  const scene = useSceneStore(s => s.scene);
  const objects = selectMechanicalObjects(scene);
  const selected = selectMechanicalObject(scene, selectedId);

  return (
    <aside className="inspector" id="inspector-panel" aria-label="Scene inspector">
      <div className="panel-topline"><div className="panel-eyebrow">INSPECTOR</div><button className="panel-close" type="button" aria-label="Close scene inspector" onClick={() => setInspectorOpen(false)}><X size={16}/></button></div>
      <div className="inspector-title"><SlidersHorizontal size={17}/> Scene Properties</div>
      <div className="inspector-card active-experiment">
        <div className="inspector-card-head"><FlaskConical size={17}/><span>ACTIVE EXPERIMENT</span></div>
        <h3>{leverBench?'Lever & seesaw laboratory':dominoBench?'Domino chain laboratory':rampBench?'Ramp dynamics laboratory':'Gravity test bench'}</h3>
        <p>{leverBench?'Real revolute-hinge lever experiment; original scene retained.':dominoBench?'Independent physical domino toppling experiment; original scene retained.':rampBench?'Independent rolling, sliding and restitution experiment; original scene retained.':'A rolling sphere, inclined plane and impact block in a Rapier world.'}</p>
        <div className="status-small"><span className={`pulse-dot ${paused ? 'pulse-dot--paused' : ''}`}/>{paused ? 'Physics paused' : 'Physics running'}</div>
      </div>
      <div className="inspector-switch" role="group" aria-label="Inspector view">
        <button type="button" aria-pressed={view === 'objects'} className={view === 'objects' ? 'inspector-switch--active' : ''} onClick={() => setView('objects')}>Objects</button>
        <button type="button" aria-pressed={view === 'world'} className={view === 'world' ? 'inspector-switch--active' : ''} onClick={() => setView('world')}>World</button>
      </div>
      {view === 'objects' ? (
        isolatedBench ? <div className="inspector-section"><p className="static-note">Experiment laboratories are isolated temporary physics scenes. Return to the editor from World to inspect and modify saved objects.</p><button className="btn btn-secondary" type="button" onClick={()=>setView('world')}>Open experiment controls</button></div> : <div className="inspector-section">
          <div className="section-title"><Layers3 size={15}/> RIGID BODIES <span className="count">{String(objects.length).padStart(2, '0')}</span></div>
          <div className="object-list">
            {objects.map((object, index) => (
              <button type="button" aria-pressed={selectedId === object.id} className={`object-row ${selectedId === object.id ? 'object-row--selected' : ''}`} key={object.id} onClick={() => setSelected(selectedId === object.id ? null : object.id)}>
                <span className={`object-mini object-mini--${object.kind}`}>{String(index + 1).padStart(2, '0')}</span>
                <span>{object.label}</span><span className="object-tag">{object.physics.bodyType}</span>
              </button>
            ))}
          </div>
          {selected ? <section className="object-details" aria-live="polite" aria-label="Selected object properties">
            <div className="detail-kicker">OBJECT DETAILS · SELECTED</div><h3>{selected.label}</h3>
            <div className="property-list"><div><span>Identifier</span><strong>{selected.id}</strong></div><div><span>Body type</span><strong>{selected.physics.bodyType === 'dynamic' ? 'Dynamic' : 'Fixed'}</strong></div><div><span>Start position (m)</span><strong>{selected.transform.position.map(x => x.toFixed(2)).join(', ')}</strong></div></div>
            <ObjectTransformEditor object={selected} />
            {isRemovableObject(selected) ? (
              <button type="button" className="delete-object-button" onClick={() => requestObjectDeletion(selected.id)}><Trash2 size={15}/> Delete {selected.label}…</button>
            ) : <p className="protected-object-note"><ShieldCheck size={14}/> Ground plane is protected and cannot be deleted.</p>}
            <p className="static-note">Click objects in the 3D scene or this list to select them. Use Edit pose to adjust the object safely; ground remains protected.</p>
          </section> : <p className="static-note">Click a 3D object or an item above to inspect it.</p>}
        </div>
      ) : (
        <div className="inspector-section">
          <div className="section-title"><CircleGauge size={15}/> PHYSICS SETTINGS</div>
          <div className="property-list">
            <div><span>Gravity (Y)</span><strong>{PHYSICS_SETTINGS.gravity[1].toFixed(2)} m/s²</strong></div>
            <div><span>Ball radius</span><strong>{PHYSICS_SETTINGS.ballRadius.toFixed(2)} m</strong></div>
            <div><span>Ball friction</span><strong>{PHYSICS_SETTINGS.ballFriction.toFixed(2)}</strong></div>
            <div><span>Restart count</span><strong>{resetEpoch}</strong></div>
            <div><span>Fixed timestep</span><strong>1/{Math.round(1 / PHYSICS_POLICY.timestep)} s</strong></div>
            <div><span>Simulation method</span><strong>Fixed step · follow render</strong></div>
            <div><span>Contact starts</span><strong>{contacts.starts}</strong></div>
            <div><span>Active contact pairs</span><strong>{contacts.activeKeys.length}</strong></div>
          </div>
          <RampExperimentPanel />
          <DominoExperimentPanel />
          <LeverExperimentPanel />
          <div className="physics-contact-panel collision-tools" aria-label="Stage 9 collision experiments">
            <div className="physics-contact-heading"><strong>STAGE 9 · COLLISION SYSTEM</strong></div>
            <label className="collision-control-label" htmlFor="collision-filter-mode">Collision filter</label>
            <select id="collision-filter-mode" aria-label="Collision filter mode" value={collisionMode}
              disabled={!!editSession || isolatedBench}
              onChange={event => setCollisionMode(event.target.value === 'separate-balls' ? 'separate-balls' : 'all')}>
              <option value="all">Standard contacts</option>
              <option value="separate-balls">Disable ball-to-ball contacts</option>
            </select>
            <label className="collision-check"><input type="checkbox" checked={sensorEnabled} disabled={!!editSession || isolatedBench} onChange={event => setSensorEnabled(event.target.checked)}/>
              Enable non-solid trigger zone</label>
            <label className="collision-check"><input type="checkbox" checked={collisionDebug} onChange={toggleCollisionDebug}/>
              Highlight active contacts and trigger outline</label>
            <p className="physics-contact-note">Changing the filter or trigger restarts bodies at their authored poses and clears both event ledgers. The ground always remains collidable. The trigger is runtime-only, centred at ({SENSOR_REGION.center.join(', ')} m), and never pushes objects.</p>
            <div className="property-list">
              <div><span>Trigger entries</span><strong>{sensors.starts}</strong></div>
              <div><span>Trigger exits</span><strong>{sensors.ends}</strong></div>
              <div><span>Inside trigger</span><strong>{sensors.activeKeys.length}</strong></div>
            </div>
          </div>
          <div className="physics-contact-panel" aria-label="Trigger intersection diagnostics">
            <div className="physics-contact-heading"><strong>SENSOR INTERSECTIONS</strong></div>
            {sensors.records.length ? (
              <ol className="physics-contact-list" aria-live="polite">{sensors.records.slice(-5).reverse().map(record => (
                <li key={`${resetEpoch}-sensor-${record.sequence}`}><span>#{record.sequence} {record.type === 'begin' ? 'Entered' : 'Left'} trigger</span><small>{record.first} / {record.second}</small></li>
              ))}</ol>
            ) : <p className="physics-contact-empty">No sensor intersections recorded. Enable the trigger and place a moving ball within its region.</p>}
          </div>
          <div className="physics-contact-panel" aria-label="Collision diagnostics">
            <div className="physics-contact-heading"><strong>CONTACT DIAGNOSTICS</strong>
              <button type="button" onClick={clearContactHistory} disabled={!contacts.records.length && !sensors.records.length}>Clear history</button></div>
            {contacts.records.length ? (
              <ol className="physics-contact-list" aria-live="polite">{contacts.records.slice(-5).reverse().map(record => (
                <li key={`${resetEpoch}-${record.sequence}`}><span>#{record.sequence} {record.type === 'begin' ? 'Contact' : 'Separated'}</span><small>{record.first} / {record.second}</small></li>
              ))}</ol>
            ) : <p className="physics-contact-empty">No contacts recorded in this run. Restart to begin a new run.</p>}
            <p className="physics-contact-note">Events reflect collider entry/exit, not measured impact forces. Clear History leaves active contact pairs intact; Restart clears both ledgers.</p>
          </div>
          <div className="locked-notice"><LockKeyhole size={13}/> Author-scene physics editing arrives in Stage 19; ramp experiment parameters are editable above</div>
        </div>
      )}
      <div className="inspector-footer"><CheckCircle2 size={15}/> <span>Stage 12 lever experiments enabled</span></div>
      <div className="inspector-minor"><Activity size={13}/><span>Controls: orbit · pan · zoom</span><Move3d size={13}/></div>
    </aside>
  );
}
