import { useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import type { Group } from 'three';
import { useSceneStore } from './store';
import { useWorkspaceStore } from '../workspace/store';
import { selectMechanicalObject } from '../../domain/registry';
import { updateObjectEditDraft } from './editing-actions';

/** Visual-only transform proxy. Collider updates only on explicit Apply. */
export function TransformGizmo() {
  const session=useWorkspaceStore(s=>s.editSession);
  const object=useSceneStore(s=>selectMechanicalObject(s.scene,session?.id??null));
  const proxy=useRef<Group>(null);
  if(!session || !object || object.kind==='ground')return null;
  const draft=session.draft;
  const update=()=>{
    const g=proxy.current;if(!g)return;
    updateObjectEditDraft({position:[g.position.x,g.position.y,g.position.z],rotation:[g.rotation.x,g.rotation.y,g.rotation.z],scale:[g.scale.x,g.scale.y,g.scale.z]});
  };
  return <TransformControls key={`${session.id}-${session.mode}`} mode={session.mode} size={0.8} onMouseUp={update}>
    <group ref={proxy} position={[...draft.position]} rotation={[...draft.rotation]} scale={[...draft.scale]}>
      <mesh name="stage7-transform-preview" raycast={() => {}}>
        {object.geometry.shape==='box'?<boxGeometry args={[...object.geometry.dimensions]}/>:<sphereGeometry args={[object.geometry.radius,object.geometry.widthSegments,object.geometry.heightSegments]}/>}
        <meshStandardMaterial color="#6de9d8" transparent opacity={0.44} depthWrite={false} emissive="#226669" emissiveIntensity={0.28}/>
      </mesh>
    </group>
  </TransformControls>;
}
