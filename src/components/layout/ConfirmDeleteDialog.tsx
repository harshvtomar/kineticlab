import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useWorkspaceStore } from '../../features/workspace/store';
import { useSceneStore } from '../../features/scene/store';
import { selectMechanicalObject } from '../../domain/registry';
import { confirmObjectDeletion } from '../../features/scene/actions';

/** Explicit non-destructive confirmation flow, shared by keyboard and UI requests. */
export function ConfirmDeleteDialog() {
  const pendingId = useWorkspaceStore(s => s.pendingDeleteObjectId);
  const setPending = useWorkspaceStore(s => s.setPendingDeleteObjectId);
  const object = useSceneStore(s => selectMechanicalObject(s.scene, pendingId));
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (pendingId && object && !node.open) node.showModal();
    else if ((!pendingId || !object) && node.open) node.close();
  }, [pendingId, object]);
  return (
    <dialog ref={dialog} className="delete-confirm-dialog" aria-labelledby="delete-confirm-title" aria-describedby="delete-confirm-description" onClose={() => setPending(null)} onCancel={() => setPending(null)}>
      <div className="delete-confirm-title"><AlertTriangle size={20}/><h2 id="delete-confirm-title">Delete mechanical object?</h2><button type="button" className="panel-close" onClick={() => setPending(null)} aria-label="Cancel deletion"><X size={18}/></button></div>
      <p id="delete-confirm-description">{object ? `Remove “${object.label}” (${object.id}) from this scene?` : 'This object no longer exists.'} The physics world will restart with remaining bodies. You can reload the application to restore the initial starter scene.</p>
      <div className="delete-confirm-actions"><button type="button" className="btn btn-secondary" onClick={() => setPending(null)}>Cancel</button><button type="button" className="btn btn-danger" disabled={!object} onClick={confirmObjectDeletion}><Trash2 size={15}/> Delete object</button></div>
    </dialog>
  );
}
