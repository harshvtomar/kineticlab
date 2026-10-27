import { useEffect, useRef, type ComponentRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useCameraStore } from './store';
import {
  CAMERA_MAX_DISTANCE, CAMERA_MIN_DISTANCE, cameraPreset, nextZoomDistance,
} from './views';

interface Transition { position: Vector3; target: Vector3 }

/** Owns visual camera behavior only. The Rapier Physics subtree is untouched. */
export function CameraRig() {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const transition = useRef<Transition | null>(null);
  const camera = useThree(s => s.camera);
  const size = useThree(s => s.size);
  const requestedCommand = useCameraStore(s => s.requestedCommand);
  const requestId = useCameraStore(s => s.requestId);

  useEffect(() => {
    if (!requestId || !controls.current) return;
    const orbit = controls.current;
    if (requestedCommand === 'zoom-in' || requestedCommand === 'zoom-out') {
      const currentOffset = camera.position.clone().sub(orbit.target);
      const distance = nextZoomDistance(currentOffset.length(), requestedCommand);
      transition.current = {
        position: orbit.target.clone().add(currentOffset.normalize().multiplyScalar(distance)),
        target: orbit.target.clone(),
      };
      return;
    }
    const fov = 'fov' in camera && typeof camera.fov === 'number' ? camera.fov : 42;
    const pose = cameraPreset(requestedCommand, Math.max(0.1, size.width / Math.max(1, size.height)), fov);
    transition.current = {
      position: new Vector3(...pose.position), target: new Vector3(...pose.target),
    };
  }, [requestId, requestedCommand, camera, size.width, size.height]);

  useFrame((_, delta) => {
    const orbit = controls.current;
    const destination = transition.current;
    if (!orbit || !destination) return;
    const factor = 1 - Math.exp(-9 * Math.min(delta, 0.1));
    camera.position.lerp(destination.position, factor);
    orbit.target.lerp(destination.target, factor);
    if (camera.position.distanceToSquared(destination.position) < 0.0001 && orbit.target.distanceToSquared(destination.target) < 0.0001) {
      camera.position.copy(destination.position);
      orbit.target.copy(destination.target);
      transition.current = null;
    }
    orbit.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      enableRotate
      minDistance={CAMERA_MIN_DISTANCE}
      maxDistance={CAMERA_MAX_DISTANCE}
      minPolarAngle={0.015}
      maxPolarAngle={Math.PI / 2.03}
      target={[0.3, 0.7, 0]}
      onStart={() => { transition.current = null; }}
    />
  );
}
