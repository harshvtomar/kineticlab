import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import { useSceneStore } from './store';
import { useWorkspaceStore } from '../workspace/store';
import { commitObjectPlacement } from './actions';
import { makePlacementObject, placeMechanicalObject, placementGroundHeight } from '../../domain/placement';

/** Native HTML5 drop events use the same active perspective camera as the visible 3D viewport. */
export function PlacementController() {
  const { camera, gl } = useThree();
  const armed = useWorkspaceStore(s => s.placementKind ?? s.dragKind);
  const preview = useWorkspaceStore(s => s.previewPosition);
  const scene = useSceneStore(s => s.scene);

  useEffect(() => {
    const viewport = gl.domElement.closest('.viewport');
    if (!viewport) return;
    const raycaster = new Raycaster();
    const hit = new Vector3();
    const origin = new Vector2();
    const ground = new Plane(new Vector3(0, 1, 0));
    const fromPointer = (clientX: number, clientY: number): readonly [number, number] | null => {
      const bounds = gl.domElement.getBoundingClientRect();
      if (!bounds.width || !bounds.height || clientX < bounds.left || clientX > bounds.right || clientY < bounds.top || clientY > bounds.bottom) return null;
      const y = placementGroundHeight(useSceneStore.getState().scene);
      if (y === null) return null;
      origin.set(((clientX - bounds.left) / bounds.width) * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(origin, camera);
      ground.constant = -y;
      return raycaster.ray.intersectPlane(ground, hit) ? [hit.x, hit.z] : null;
    };
    const updatePreview = (x: number, y: number) => {
      const workspace = useWorkspaceStore.getState();
      const kind = workspace.dragKind ?? workspace.placementKind;
      if (!kind) return;
      const point = fromPointer(x, y);
      const result = point && placeMechanicalObject(useSceneStore.getState().scene, kind, point[0], point[1]);
      if (point && result?.status === 'placed') {
        const candidate = makePlacementObject(useSceneStore.getState().scene, kind, point[0], point[1]);
        const previous = workspace.previewPosition;
        if (!previous || previous.some((v, i) => v !== candidate.transform.position[i])) workspace.setPreviewPosition(candidate.transform.position);
      } else if (workspace.previewPosition !== null) workspace.setPreviewPosition(null);
    };
    const move = (event: Event) => {
      const pointer = event as PointerEvent;
      updatePreview(pointer.clientX, pointer.clientY);
    };
    const dragOver = (event: Event) => {
      const drag = event as DragEvent;
      if (!useWorkspaceStore.getState().dragKind) return;
      drag.preventDefault();
      if (drag.dataTransfer) drag.dataTransfer.dropEffect = 'copy';
      updatePreview(drag.clientX, drag.clientY);
    };
    const place = (clientX: number, clientY: number, kind: NonNullable<ReturnType<typeof getArmedKind>>) => {
      const coords = fromPointer(clientX, clientY);
      if (!coords) {
        useWorkspaceStore.getState().setPlacementFeedback('Click a valid position inside the 3D ground plane.');
        return;
      }
      commitObjectPlacement(kind, coords[0], coords[1]);
    };
    const dropped = (event: Event) => {
      const drag = event as DragEvent;
      const kind = useWorkspaceStore.getState().dragKind;
      if (!kind) return;
      drag.preventDefault();
      place(drag.clientX, drag.clientY, kind);
      useWorkspaceStore.getState().endDrag();
    };
    const clicked = (event: Event) => {
      const click = event as MouseEvent;
      const workspace = useWorkspaceStore.getState();
      // Do not interpret clicks on labels or controls inside the viewport as placement.
      if (!workspace.placementKind || !(click.target instanceof HTMLCanvasElement)) return;
      place(click.clientX, click.clientY, workspace.placementKind);
    };
    const leave = (event: Event) => {
      const pointer = event as PointerEvent;
      const to = pointer.relatedTarget;
      if (to instanceof Node && viewport.contains(to)) return;
      useWorkspaceStore.getState().setPreviewPosition(null);
    };
    viewport.addEventListener('pointermove', move);
    viewport.addEventListener('dragover', dragOver);
    viewport.addEventListener('drop', dropped);
    viewport.addEventListener('click', clicked);
    viewport.addEventListener('pointerleave', leave);
    return () => {
      viewport.removeEventListener('pointermove', move);
      viewport.removeEventListener('dragover', dragOver);
      viewport.removeEventListener('drop', dropped);
      viewport.removeEventListener('click', clicked);
      viewport.removeEventListener('pointerleave', leave);
    };
  }, [camera, gl]);

  if (!armed || !preview) return null;
  const ghost = makePlacementObject(scene, armed, preview[0], preview[2]);
  return (
    <mesh raycast={() => undefined} position={[...ghost.transform.position]} rotation={[...ghost.transform.rotation]} scale={[...ghost.transform.scale]} renderOrder={12}>
      {ghost.geometry.shape === 'box' ? <boxGeometry args={[...ghost.geometry.dimensions]} /> :
        <sphereGeometry args={[ghost.geometry.radius, ghost.geometry.widthSegments, ghost.geometry.heightSegments]} />}
      <meshStandardMaterial color="#63dacc" emissive="#267d81" emissiveIntensity={0.4} transparent opacity={0.43} depthWrite={false} />
    </mesh>
  );
}

function getArmedKind() {
  const state = useWorkspaceStore.getState();
  return state.dragKind ?? state.placementKind;
}
