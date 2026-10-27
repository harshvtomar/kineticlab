import { useEffect, useState } from 'react';
import { Grid2X2, Pause, Play, RotateCcw, Rotate3D, Sparkles, MousePointer2 } from 'lucide-react';
import { ComponentLibrary } from '../components/layout/ComponentLibrary';
import { CameraToolbar } from '../components/layout/CameraToolbar';
import { EditorToolbar } from '../components/layout/EditorToolbar';
import { HelpDialog } from '../components/layout/HelpDialog';
import { Inspector } from '../components/layout/Inspector';
import { MobileTopBar, TopBar } from '../components/layout/TopBar';
import { StatusBar } from '../components/layout/StatusBar';
import { StarterPhysicsWorld } from '../components/scene/StarterPhysicsWorld';
import { useRampExperimentStore } from '../features/simulation/ramp-store';
import { useDominoStore } from '../features/simulation/domino-store';
import { useLeverStore } from '../features/simulation/lever-store';
import { useSimulationStore } from '../features/simulation/store';
import { useWorkspaceStore } from '../features/workspace/store';
import { interpretEditorKey } from '../features/workspace/shortcuts';
import { useCameraStore } from '../features/camera/store';
import { ConfirmDeleteDialog } from '../components/layout/ConfirmDeleteDialog';
import { requestObjectDeletion } from '../features/scene/actions';
import { useSceneStore } from '../features/scene/store';
import { selectMechanicalObject } from '../domain/registry';
import { cancelObjectEdit, undoSceneEdit, redoSceneEdit, duplicateSelectedObject, beginObjectEdit } from '../features/scene/editing-actions';

function isInputActive(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  return !!element && (element.isContentEditable || !!element.closest('input, textarea, select, button, [contenteditable="true"]'));
}

/** Breakpoint synchronizes panel behavior; on smaller screens the editor keeps the canvas visible. */
function useCompactPanels() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1070px)');
    const change = () => {
      setCompact(media.matches);
      if (media.matches) useWorkspaceStore.getState().closePanels();
      else useWorkspaceStore.getState().openPanels();
    };
    change();
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return compact;
}

function useEditorShortcuts(compact: boolean) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInputActive(event.target)) return;
      if ((useRampExperimentStore.getState().enabled || useDominoStore.getState().enabled || useLeverStore.getState().enabled) && (event.metaKey || event.ctrlKey) && ['KeyZ','KeyY'].includes(event.code)) return;
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.code==='KeyZ') {
        event.preventDefault();
        if(event.shiftKey) redoSceneEdit(); else undoSceneEdit();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.code==='KeyY') {
        event.preventDefault();redoSceneEdit();return;
      }
      const command = interpretEditorKey(event);
      if (!command) return;
      const sim = useSimulationStore.getState();
      const ui = useWorkspaceStore.getState();
      const view = useCameraStore.getState();
      if ((useRampExperimentStore.getState().enabled || useDominoStore.getState().enabled || useLeverStore.getState().enabled) && ['delete-selection','edit-selection','duplicate-selection'].includes(command)) return;
      if (command === 'escape') {
        if (ui.pendingDeleteObjectId) ui.setPendingDeleteObjectId(null);
        else if (ui.helpOpen) ui.setHelpOpen(false);
        else if (ui.editSession) cancelObjectEdit();
        else if (ui.placementKind || ui.dragKind) ui.cancelPlacement();
        else if (ui.selectedObjectId) ui.setSelectedObjectId(null);
        else if (compact) ui.closePanels();
        return;
      }
      if (ui.helpOpen || ui.pendingDeleteObjectId) return;
      if (ui.editSession) return;
      switch (command) {
        case 'pause': event.preventDefault(); sim.togglePaused(); break;
        case 'restart': sim.restart(); break;
        case 'grid': sim.toggleGrid(); break;
        case 'library': ui.setLibraryOpen(!ui.libraryOpen); if (compact && !ui.libraryOpen) ui.setInspectorOpen(false); break;
        case 'inspector': ui.setInspectorOpen(!ui.inspectorOpen); if (compact && !ui.inspectorOpen) ui.setLibraryOpen(false); break;
        case 'help': ui.setHelpOpen(true); break;
        case 'camera-home': view.requestCamera('home'); break;
        case 'camera-frame': view.requestCamera('frame'); break;
        case 'camera-top': view.requestCamera('top'); break;
        case 'camera-front': view.requestCamera('front'); break;
        case 'camera-side': view.requestCamera('side'); break;
        case 'zoom-in': event.preventDefault(); view.requestCamera('zoom-in'); break;
        case 'zoom-out': event.preventDefault(); view.requestCamera('zoom-out'); break;
        case 'axes': view.toggleAxes(); break;
        case 'delete-selection': event.preventDefault(); requestObjectDeletion(ui.selectedObjectId); break;
        case 'edit-selection': beginObjectEdit(ui.selectedObjectId); break;
        case 'duplicate-selection': duplicateSelectedObject(); break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [compact]);
}

export function App() {
  const paused = useSimulationStore(s => s.paused);
  const rampBench = useRampExperimentStore(s=>s.enabled);
  const dominoBench = useDominoStore(s=>s.enabled);
  const leverBench = useLeverStore(s=>s.enabled);
  const isolatedBench = rampBench || dominoBench || leverBench;
  const showGrid = useSimulationStore(s => s.showGrid);
  const togglePaused = useSimulationStore(s => s.togglePaused);
  const toggleGrid = useSimulationStore(s => s.toggleGrid);
  const restart = useSimulationStore(s => s.restart);
  const libraryOpen = useWorkspaceStore(s => s.libraryOpen);
  const inspectorOpen = useWorkspaceStore(s => s.inspectorOpen);
  const closePanels = useWorkspaceStore(s => s.closePanels);
  const selectedId = useWorkspaceStore(s => s.selectedObjectId);
  const selected = useSceneStore(s => selectMechanicalObject(s.scene, selectedId));
  const armed = useWorkspaceStore(s => s.placementKind ?? s.dragKind);
  const edit = useWorkspaceStore(s => s.editSession);
  const feedback = useWorkspaceStore(s => s.placementFeedback);
  const cancelPlacement = useWorkspaceStore(s => s.cancelPlacement);
  const compact = useCompactPanels();
  useEditorShortcuts(compact);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-editor">Skip to 3D workspace</a>
      <TopBar />
      <MobileTopBar />
      <div className={`workspace ${libraryOpen ? '' : 'workspace--library-hidden'} ${inspectorOpen ? '' : 'workspace--inspector-hidden'}`}>
        {libraryOpen && (isolatedBench ? <aside className="left-panel ramp-bench-intro"><h3>{leverBench?"Lever & seesaw laboratory":dominoBench?"Domino chain laboratory":"Ramp dynamics laboratory"}</h3><p>Use Inspector → World to configure the isolated experiment. Return to the editable mechanical scene before placing components.</p></aside> : <ComponentLibrary key="library" />)}
        <main key="editor" className="editor" id="main-editor" aria-label="Mechanical simulation workspace">
          <div className="editor-header">
            <div><div className="eyebrow"><span className="eyebrow-line"/> DESIGN WORKSPACE / 12</div><h1>Mechanical workbench</h1><p>Explore motion in a live 3D physics environment.</p></div>
            <div className="editor-header-right"><Sparkles size={15}/> STARTER SCENE</div>
          </div>
          {!isolatedBench && <EditorToolbar compact={compact}/>}
          <CameraToolbar/>
          <section className="viewport" aria-label="3D physics viewport">
            <StarterPhysicsWorld />
            {isolatedBench && <div className="placement-hud" role="status">{leverBench?"Lever & seesaw physics experiment":dominoBench?"Domino chain physics experiment":"Ramp dynamics experiment"} · configure in Inspector → World · original scene preserved.</div>}
            {!isolatedBench && (armed || feedback) && <div className="placement-hud" role="status" aria-live="polite">
              <span>{feedback || 'Choose an empty location on the 3D workbench.'}</span>
              {armed && <button type="button" onClick={cancelPlacement} aria-label="Cancel component placement">Cancel (Esc)</button>}
            </div>}
            {!isolatedBench && <div className="viewport-selection-status" role="status" aria-live="polite"><MousePointer2 size={13}/>{selected ? `Selected: ${selected.label}` : 'Click an object to select'}</div>}
            <div className="viewport-meta"><div className="viewport-meta-kicker">LIVE 3D WORKSPACE</div><strong>{leverBench?'Lever & Seesaw Bench':dominoBench?'Domino Chain Bench':rampBench?'Ramp Dynamics Bench':'Gravity Test Bench'} <span>{leverBench?'12':dominoBench?'11':rampBench?'10':'01'}</span></strong></div>
            <div className="viewport-badge"><span className="green-indicator"/> REAL-TIME PHYSICS</div>
            <div className="viewport-help"><Rotate3D size={14}/> Drag to orbit · Right-drag to pan · Wheel to zoom</div>
            <div className="viewport-corner">KL / 012</div>
          </section>
          <div className="simulation-strip" aria-label="Simulation transport controls">
            <div className="transport-controls">
              <button type="button" className="btn btn-primary" onClick={togglePaused} disabled={!!edit} aria-label={paused ? 'Resume simulation' : 'Pause simulation'}>
                {paused ? <Play size={16} fill="currentColor"/> : <Pause size={16} fill="currentColor"/>}
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={restart} disabled={!!edit} title="Restart physics world at initial positions"><RotateCcw size={16}/> Restart</button>
            </div>
            <div className="transport-separator" />
            <div className="transport-state" role="status" aria-live="polite"><div className="micro-label">SIMULATION STATE</div><strong><span className={`dot ${paused ? 'dot--paused' : ''}`}/>{paused ? 'PAUSED' : 'RUNNING'}</strong></div>
            <div className="transport-spacer" />
            <button type="button" className={`btn btn-ghost ${showGrid ? 'btn-ghost--active' : ''}`} onClick={toggleGrid} aria-pressed={showGrid}><Grid2X2 size={16}/> Grid <span>{showGrid ? 'ON' : 'OFF'}</span></button>
          </div>
          <section className="bottom-info" id="about">
            <div className="info-mark"><Sparkles size={18}/></div>
            <div><b>Stage 12 · Levers and seesaws</b><p>Open the isolated lever laboratory in Inspector → World. Adjust real hinged-beam loads and pivot positions, compare theoretical moments with measured motion, and return to the unchanged ramp, domino or editable scenes.</p></div>
            <div className="info-badge">ROADMAP / 32 STAGES</div>
          </section>
        </main>
        {inspectorOpen && <Inspector key="inspector" />}
        {compact && (libraryOpen || inspectorOpen) ? <button type="button" className="panel-backdrop" aria-label="Close open side panel" onClick={closePanels}/> : null}
      </div>
      <StatusBar />
      <HelpDialog />
      <ConfirmDeleteDialog />
    </div>
  );
}
