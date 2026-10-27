import { Check, Copy, Move3d, X } from 'lucide-react';
import type { MechanicalObject, Transform, Vec3 } from '../../domain/registry';
import { useWorkspaceStore } from '../../features/workspace/store';
import { beginObjectEdit, cancelObjectEdit, commitObjectEdit, duplicateSelectedObject, setEditAxisMode, updateObjectEditDraft } from '../../features/scene/editing-actions';

const DEG=180/Math.PI;
const axs=['X','Y','Z'] as const;
function changeAxis(draft:Transform,field:keyof Transform,index:number,numberValue:number):Transform {
  const next = [...draft[field]] as [number,number,number];
  next[index]=field==='rotation'?numberValue/DEG:numberValue;
  return {...draft,[field]:next as Vec3};
}
export function ObjectTransformEditor({ object }:{readonly object:MechanicalObject}) {
  const session=useWorkspaceStore(s=>s.editSession);
  const feedback=useWorkspaceStore(s=>s.editFeedback);
  const edit=session?.id===object.id?session:null;
  const draft=edit?.draft;
  const historyBlocked=object.kind==='ground';
  return (
    <section className="transform-editor" aria-label="Object transform tools">
      <div className="detail-kicker">STAGE 7 · TRANSFORM EDITOR</div>
      {!edit ? <div className="transform-actions">
        <button type="button" disabled={historyBlocked || !!session} onClick={()=>beginObjectEdit(object.id)}><Move3d size={14}/> Edit pose</button>
        <button type="button" disabled={historyBlocked || !!session} onClick={duplicateSelectedObject}><Copy size={14}/> Duplicate</button>
        {historyBlocked && <p className="protected-object-note">Ground geometry is locked.</p>}
      </div> : <>
        <p className="transform-tip">Physics is paused. Adjust values or drag the 3D handles; Apply validates and commits the initial pose.</p>
        <div className="transform-modes" role="group" aria-label="3D transform handle mode">
          {(['translate','rotate','scale'] as const).map(mode=><button key={mode} type="button" aria-pressed={edit.mode===mode} className={edit.mode===mode?'is-active':''} onClick={()=>setEditAxisMode(mode)}>{mode==='translate'?'Move':mode==='rotate'?'Rotate':'Scale'}</button>)}
        </div>
        {(['position','rotation','scale'] as const).map(field=><fieldset className="transform-fieldset" key={field}>
          <legend>{field==='rotation'?'Rotation (degrees)':field==='position'?'Position (metres)':'Size multiplier'}</legend>
          <div className="transform-axis-grid">
            {axs.map((axis,i)=><label key={axis}>{axis}<input aria-label={`${field} ${axis}`} type="number" step={field==='rotation'?5:0.1} min={field==='scale'?0.25:undefined} max={field==='scale'?4:undefined} value={Number((field==='rotation'?draft!.rotation[i]*DEG:draft![field][i]).toFixed(3))} onChange={e=>{const value=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(value))updateObjectEditDraft(changeAxis(draft!,field,i,value));}} /></label>)}
          </div>
        </fieldset>)}
        <div className="transform-actions">
          <button type="button" className="transform-apply" onClick={commitObjectEdit}><Check size={14}/> Apply</button>
          <button type="button" onClick={cancelObjectEdit}><X size={14}/> Cancel</button>
        </div>
      </>}
      {feedback&&<p className="transform-feedback" role="status">{feedback}</p>}
    </section>
  );
}
