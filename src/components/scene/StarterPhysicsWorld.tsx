import { Suspense, useEffect } from 'react';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { PHYSICS_POLICY, physicsBlueprint } from '../../domain/physics-policy';
import { collisionOtherId } from '../../domain/contact-ledger';
import { collisionGroupsForObject, SENSOR_COLLISION_GROUPS, SENSOR_REGION, type CollisionMode } from '../../domain/collision-system';
import { type MechanicalObject } from '../../domain/registry';
import { useSceneStore } from '../../features/scene/store';
import { useWorkspaceStore } from '../../features/workspace/store';
import { useSimulationStore } from '../../features/simulation/store';
import { useCameraStore } from '../../features/camera/store';
import { gridDivisions, GRID_SIZE } from '../../features/camera/views';
import { CameraRig } from '../../features/camera/CameraRig';
import { PlacementController } from '../../features/scene/PlacementController';
import { TransformGizmo } from '../../features/scene/TransformGizmo';
import { RampExperimentRig } from './RampExperimentRig';
import { useRampExperimentStore } from '../../features/simulation/ramp-store';
import { useDominoStore } from '../../features/simulation/domino-store';
import { DominoExperimentRig } from './DominoExperimentRig';
import {useLeverStore} from '../../features/simulation/lever-store';
import {LeverExperimentRig} from './LeverExperimentRig';

/** Every body is now rendered from the validated immutable registry descriptor. */
function MechanicalRigidBody({ object, epoch, collisionMode }: { readonly object: MechanicalObject; readonly epoch: number; readonly collisionMode: CollisionMode }) {
  const { transform, visual, geometry, physics } = object;
  const blueprint = physicsBlueprint(object);
  const reportContact = (kind: 'begin' | 'end', event: unknown) => {
    const otherId = collisionOtherId(event);
    if (!otherId || useSimulationStore.getState().resetEpoch !== epoch) return;
    const sim = useSimulationStore.getState();
    if (kind === 'begin') sim.beginContact(object.id, otherId);
    else sim.endContact(object.id, otherId);
  };
  const selected = useWorkspaceStore(s => s.selectedObjectId === object.id);
  const collisionDebug = useSimulationStore(s => s.collisionDebug);
  const inContact = useSimulationStore(s => collisionDebug && s.contactLedger.activeKeys.some(key => key.split('|').includes(object.id)));
  const interactionFilter = collisionGroupsForObject(object, collisionMode);
  const setSelectedObjectId = useWorkspaceStore(s => s.setSelectedObjectId);
  const setInspectorView = useWorkspaceStore(s => s.setInspectorView);
  const choose = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (useWorkspaceStore.getState().placementKind || useWorkspaceStore.getState().dragKind || useWorkspaceStore.getState().editSession) return;
    setSelectedObjectId(object.id);
    setInspectorView('objects');
  };
  const mesh = (
    <mesh name={`selectable-${object.id}`} onClick={choose} castShadow={visual.castShadow} receiveShadow={visual.receiveShadow}>
      {geometry.shape === 'box' ? (
        <boxGeometry args={[...geometry.dimensions]} />
      ) : (
        <sphereGeometry args={[geometry.radius, geometry.widthSegments, geometry.heightSegments]} />
      )}
      <meshStandardMaterial color={visual.color} roughness={visual.roughness} metalness={visual.metalness}
        emissive={selected ? '#64d5e9' : inContact ? '#ffa548' : '#000000'} emissiveIntensity={selected ? 0.42 : inContact ? 0.52 : 0} />
    </mesh>
  );
  const pose = { position: [...transform.position] as [number, number, number],
    rotation: [...transform.rotation] as [number, number, number],
    scale: [...transform.scale] as [number, number, number] };
  return physics.bodyType === 'dynamic' ? (
    <RigidBody key={object.id} type="dynamic" colliders={physics.collider} {...pose}
      collisionGroups={interactionFilter} friction={blueprint.friction} restitution={blueprint.restitution}
      userData={{ kineticlabId: object.id }}
      onCollisionEnter={(event) => reportContact('begin', event.other)}
      onCollisionExit={(event) => reportContact('end', event.other)}
      linearDamping={physics.linearDamping} angularDamping={physics.angularDamping}
      canSleep={physics.canSleep} ccd={blueprint.ccd}>
      {mesh}
    </RigidBody>
  ) : (
    <RigidBody key={object.id} type="fixed" colliders={physics.collider} {...pose}
      collisionGroups={interactionFilter} friction={blueprint.friction} restitution={blueprint.restitution}
      userData={{ kineticlabId: object.id }}>
      {mesh}
    </RigidBody>
  );
}

function TriggerSensor({ epoch }: { readonly epoch: number }) {
  const sensorHasBall = useSimulationStore(s => s.sensorLedger.activeKeys.length > 0);
  const debug = useSimulationStore(s => s.collisionDebug);
  const record = (kind: 'begin' | 'end', other: unknown) => {
    const id = collisionOtherId(other);
    if (!id || useSimulationStore.getState().resetEpoch !== epoch) return;
    const sim = useSimulationStore.getState();
    if (kind === 'begin') sim.beginSensor(SENSOR_REGION.id, id);
    else sim.endSensor(SENSOR_REGION.id, id);
  };
  return (
    <RigidBody type="fixed" colliders={false} position={[...SENSOR_REGION.center]}>
      <CuboidCollider sensor collisionGroups={SENSOR_COLLISION_GROUPS} args={[...SENSOR_REGION.halfExtents]}
        onIntersectionEnter={event => record('begin', event.other)}
        onIntersectionExit={event => record('end', event.other)} />
      <mesh name="non-solid-trigger-visual" raycast={() => null}>
        <boxGeometry args={SENSOR_REGION.halfExtents.map(x => 2*x) as [number, number, number]}/>
        <meshBasicMaterial color={sensorHasBall ? '#7ceac5' : '#50b6ee'} wireframe={debug} transparent opacity={debug ? 0.36 : 0.16} depthWrite={false}/>
      </mesh>
    </RigidBody>
  );
}

function WorkshopObjects({ epoch, collisionMode, sensorEnabled }: { readonly epoch: number; readonly collisionMode: CollisionMode; readonly sensorEnabled: boolean }) {
  const objects = useSceneStore(state => state.scene.objects);
  return (
    <>
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#c7e8ff', '#102032', 1.7]} />
      <directionalLight
        position={[5, 9, 5]}
        intensity={2.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {objects.map(object => (
        <MechanicalRigidBody key={object.id} object={object} epoch={epoch} collisionMode={collisionMode} />
      ))}
      {sensorEnabled && <TriggerSensor epoch={epoch} />}
    </>
  );
}

function StageOneWorld() {
  const paused = useSimulationStore((state) => state.paused);
  const showGrid = useSimulationStore((state) => state.showGrid);
  const resetEpoch = useSimulationStore((state) => state.resetEpoch);
  const gridSpacing = useCameraStore((state) => state.gridSpacing);
  const axesVisible = useCameraStore((state) => state.axesVisible);
  const collisionMode = useSimulationStore(s => s.collisionMode);
  const sensorEnabled = useSimulationStore(s => s.sensorEnabled);
  const rampBench = useRampExperimentStore(s=>s.enabled);
  const dominoBench = useDominoStore(s=>s.enabled);
  const leverBench = useLeverStore(s=>s.enabled);
  const leverRunId = useLeverStore(s=>s.runId);
  const dominoRunId = useDominoStore(s=>s.runId);
  const experimentRunId = useRampExperimentStore(s=>s.runId);
  useEffect(()=>{if(rampBench) useRampExperimentStore.getState().clearSamples();if(dominoBench) useDominoStore.getState().resetRun();if(leverBench) useLeverStore.getState().resetRun();},[resetEpoch]);

  return (
    <>
      <color attach="background" args={['#0a1624']} />
      <fog attach="fog" args={['#0a1624', 15, 30]} />
      {showGrid ? (
        <gridHelper args={[GRID_SIZE, gridDivisions(gridSpacing), '#3b6172', '#254051']} position={[0, 0.015, 0]} />
      ) : null}
      <Suspense fallback={null}>
        {/* Explicit fixed stepping and a keyed full-world remount restore descriptor poses.
            These choices improve local repeatability; do not guarantee cross-platform determinism. */}
        <Physics key={resetEpoch} paused={paused} gravity={[...PHYSICS_POLICY.gravity]}
          timeStep={PHYSICS_POLICY.timestep} updateLoop={PHYSICS_POLICY.updateLoop}>
          {leverBench ? <LeverExperimentRig key={leverRunId} runId={leverRunId}/> : dominoBench ? <DominoExperimentRig key={dominoRunId} runId={dominoRunId}/> : rampBench ? <RampExperimentRig key={experimentRunId} runId={experimentRunId}/> : <WorkshopObjects epoch={resetEpoch} collisionMode={collisionMode} sensorEnabled={sensorEnabled} />}
        </Physics>
      </Suspense>
      {axesVisible && <axesHelper args={[2.2]} position={[-5.6, 0.035, -4.6]} />}
      <CameraRig />
      {!rampBench && !dominoBench && !leverBench && <PlacementController />}
      {!rampBench && !dominoBench && !leverBench && <TransformGizmo />}
      {axesVisible && (
        <GizmoHelper alignment="bottom-right" margin={[63, 72]}>
          <GizmoViewport axisColors={['#e99893', '#96d9b2', '#83b6fb']} labelColor="#0b1828" />
        </GizmoHelper>
      )}
    </>
  );
}

/** Stage 1 physics smoke scene; not yet a CAD editor or validated gear simulator. */
export function StarterPhysicsWorld() {
  const clearSelection = useWorkspaceStore(s => s.setSelectedObjectId);
  return (
    <Canvas
      onPointerMissed={() => { if (!useWorkspaceStore.getState().placementKind && !useWorkspaceStore.getState().dragKind && !useWorkspaceStore.getState().editSession) clearSelection(null); }}
      aria-label="3D mechanical simulation: drag to orbit, right-drag to pan, wheel to zoom; use camera buttons for keyboard access"
      tabIndex={0}
      shadows
      camera={{ position: [7.8, 5.3, 8.5], fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      fallback={<div className="canvas-fallback" role="alert">This demo needs a WebGL-capable browser.</div>}
    >
      <StageOneWorld />
    </Canvas>
  );
}
