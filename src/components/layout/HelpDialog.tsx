import { useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useWorkspaceStore } from '../../features/workspace/store';

const shortcuts: readonly [string, string][] = [
  ['Space', 'Pause / resume physics'],
  ['R', 'Restart current experiment'],
  ['G', 'Toggle workspace grid'],
  ['L', 'Toggle component library'],
  ['I', 'Toggle scene inspector'],
  ['C / F', 'Reset home camera / frame scene'],
  ['1 / 2 / 3', 'Top / front / side camera'],
  ['+ / -', 'Camera zoom in / out'],
  ['A', 'Toggle world axes and orientation gizmo'],
  ['?', 'Open shortcuts and help'],
  ['Delete / Backspace', 'Request deletion of selected object'],
  ['E / D', 'Edit selected object / Duplicate selected object'],
  ['Cmd/Ctrl+Z', 'Undo committed scene change'],
  ['Cmd/Ctrl+Shift+Z', 'Redo committed scene change'],
  ['Esc', 'Cancel transform preview, placement, deletion or selection'],
];

export function HelpDialog() {
  const open = useWorkspaceStore(s => s.helpOpen);
  const setOpen = useWorkspaceStore(s => s.setHelpOpen);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return (
    <dialog ref={dialog} className="help-dialog" onClose={() => setOpen(false)} aria-labelledby="help-title">
      <div className="help-dialog-heading"><div><Keyboard size={19}/><h2 id="help-title">KineticLab shortcuts</h2></div><button type="button" className="panel-close" aria-label="Close help" onClick={() => setOpen(false)}><X size={19}/></button></div>
      <p className="help-intro">Use these shortcuts when focus is outside an input field. Camera controls: drag to orbit, right-drag to pan, scroll to zoom.</p>
      <dl className="shortcut-list">{shortcuts.map(([key, action]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{action}</dd></div>)}</dl>
      <p className="help-disclaimer">Stage 9 adds runtime collision filters, a non-solid sensor region and separate intersection logs in Inspector → World. Changing collision filters resets the physics world; Restart clears event histories, not placed or transformed objects. Previous editing and protected-ground behavior remain. Gears and pulleys arrive in later stages.</p>
    </dialog>
  );
}
