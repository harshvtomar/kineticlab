import { BookOpen, PanelLeft, PanelRight, Keyboard, LayoutGrid, Trash2, MousePointer2, XCircle, Undo2, Redo2, Copy } from 'lucide-react';
import { useWorkspaceStore } from '../../features/workspace/store';
import { useSceneStore } from '../../features/scene/store';
import { isRemovableObject } from '../../domain/scene-edit';
import { requestObjectDeletion } from '../../features/scene/actions';
import { duplicateSelectedObject, undoSceneEdit, redoSceneEdit } from '../../features/scene/editing-actions';
import { selectMechanicalObject } from '../../domain/registry';

interface EditorToolbarProps {
  compact: boolean;
}

/** Toolbar owns only UI controls, never changes Rapier bodies or physics settings. */
export function EditorToolbar({ compact }: EditorToolbarProps) {
  const libraryOpen = useWorkspaceStore(s => s.libraryOpen);
  const inspectorOpen = useWorkspaceStore(s => s.inspectorOpen);
  const setLibraryOpen = useWorkspaceStore(s => s.setLibraryOpen);
  const setInspectorOpen = useWorkspaceStore(s => s.setInspectorOpen);
  const setHelpOpen = useWorkspaceStore(s => s.setHelpOpen);
  const selectedId = useWorkspaceStore(s => s.selectedObjectId);
  const armed = useWorkspaceStore(s => s.placementKind);
  const edit = useWorkspaceStore(s => s.editSession);
  const undoCount = useSceneStore(s => s.past.length);
  const redoCount = useSceneStore(s => s.future.length);
  const cancelPlacement = useWorkspaceStore(s => s.cancelPlacement);
  const clearSelected = useWorkspaceStore(s => s.setSelectedObjectId);
  const selected = useSceneStore(s => selectMechanicalObject(s.scene, selectedId));
  return (
    <div className="editor-toolbar" role="group" aria-label="Editor panels and help">
      <div className="toolbar-group">
        <button className={`tool-button ${libraryOpen ? 'tool-button--active' : ''}`} type="button" aria-controls="library-panel" aria-expanded={libraryOpen} onClick={() => {
          setLibraryOpen(!libraryOpen);
          if (compact && !libraryOpen) setInspectorOpen(false);
        }} title="Toggle component library (L)"><PanelLeft size={17}/><span>Library</span></button>
        <button className={`tool-button ${inspectorOpen ? 'tool-button--active' : ''}`} type="button" aria-controls="inspector-panel" aria-expanded={inspectorOpen} onClick={() => {
          setInspectorOpen(!inspectorOpen);
          if (compact && !inspectorOpen) setLibraryOpen(false);
        }} title="Toggle scene inspector (I)"><PanelRight size={17}/><span>Inspector</span></button>
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-status"><LayoutGrid size={14}/> Starter laboratory <span className="toolbar-readonly">Place · Select · Edit · History</span></div>
      {armed && <button type="button" className="tool-button placement-toolbar-cancel" onClick={cancelPlacement}>Cancel {armed} (Esc)</button>}
      <div className="toolbar-group" aria-label="Selection actions">
        <span className="selection-toolbar-label"><MousePointer2 size={13}/> {selected?.label ?? 'No object'}</span>
        <button type="button" className="tool-button" title="Clear selection (Escape)" disabled={!selected} onClick={() => clearSelected(null)}><XCircle size={15}/><span>Clear</span></button>
        <button type="button" className="tool-button tool-button--danger" title={selected && isRemovableObject(selected) ? 'Delete selected object (Delete / Backspace)' : 'Ground cannot be deleted'} disabled={!selected || !isRemovableObject(selected)} onClick={() => requestObjectDeletion(selectedId)}><Trash2 size={15}/><span>Delete</span></button>
      </div>
      <div className="toolbar-group" role="group" aria-label="Scene history and duplicate">
        <button type="button" className="tool-button" disabled={!undoCount || !!edit} onClick={undoSceneEdit} title="Undo last scene change (Cmd/Ctrl+Z)"><Undo2 size={15}/><span>Undo</span></button>
        <button type="button" className="tool-button" disabled={!redoCount || !!edit} onClick={redoSceneEdit} title="Redo (Cmd/Ctrl+Shift+Z)"><Redo2 size={15}/><span>Redo</span></button>
        <button type="button" className="tool-button" disabled={!selected || selected.kind==='ground' || !!edit} onClick={duplicateSelectedObject} title="Duplicate selected object"><Copy size={15}/><span>Copy</span></button>
      </div>
      <div className="toolbar-spacer" />
      <button className="tool-button tool-button--help" type="button" onClick={() => setHelpOpen(true)} title="Help & keyboard shortcuts (?)"><BookOpen size={17}/><span>Help</span><Keyboard size={13} className="toolbar-keyboard"/></button>
    </div>
  );
}
