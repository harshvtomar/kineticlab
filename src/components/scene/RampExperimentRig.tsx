/** An opt-in Rapier test rig. The Stage 1–9 editable scene is not modified. */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { RAMP_BENCH, initialRampBallPosition, rampDiagnostics } from '../../domain/ramp-dynamics';
import { useSimulationStore } from '../../features/simulation/store';
import { useRampExperimentStore } from '../../features/simulation/ramp-store';

function BallMotionTracker({ runId }: {readonly runId:number}) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const wallClock = useRef(0);
  const sampleClock = useRef(0);
  const parameters = useRampExperimentStore(s=>s.parameters);
  const paused = useSimulationStore(s=>s.paused);
  const start = initialRampBallPosition(parameters);
  useFrame((_state,delta)=>{
    if(paused || !bodyRef.current || useRampExperimentStore.getState().runId!==runId) return;
    // Diagnostics are renderer-sampled, not exact fixed-step solver timestamps.
    wallClock.current+=Math.min(delta,0.1);
    sampleClock.current+=Math.min(delta,0.1);
    if(sampleClock.current<RAMP_BENCH.samplePeriod) return;
    sampleClock.current=0;
    const pos=bodyRef.current.translation(),vel=bodyRef.current.linvel();
    const metrics=rampDiagnostics([pos.x,pos.y,pos.z],start,[vel.x,vel.y,vel.z],parameters);
    useRampExperimentStore.getState().recordSample({elapsedS:wallClock.current,distanceM:metrics.distanceM,speedMps:metrics.speedMps,elevationM:metrics.elevationM},runId);
  });
  return (
    <RigidBody ref={bodyRef} colliders={false} type="dynamic" position={[...start]}
      userData={{kineticlabId:'ramp-experiment-ball'}} canSleep={false} ccd
      enabledRotations={parameters.motion==='slide'?[false,false,false]:[true,true,true]}
      linearDamping={0.01} angularDamping={0.01}>
      <BallCollider args={[RAMP_BENCH.ballRadius]} friction={parameters.friction} restitution={parameters.restitution}/>
      <mesh castShadow name="ramp-experiment-ball-visual">
        <sphereGeometry args={[RAMP_BENCH.ballRadius,40,28]}/>
        <meshStandardMaterial color="#72e3df" roughness={0.22} metalness={0.38}/>
      </mesh>
    </RigidBody>
  );
}

export function RampExperimentRig({ runId }:{readonly runId:number}) {
  const parameters=useRampExperimentStore(s=>s.parameters);
  const angle=-parameters.angleDegrees*Math.PI/180;
  return <>
    <ambientLight intensity={1.05}/><hemisphereLight args={['#c7e8ff','#102032',1.7]}/>
    <directionalLight position={[5,9,5]} intensity={2.3} castShadow shadow-mapSize={[2048,2048]}/>
    <RigidBody type="fixed" colliders={false} position={[0,-0.25,0]} userData={{kineticlabId:'ramp-experiment-ground'}}>
      <CuboidCollider args={[7,0.25,6]} friction={parameters.friction} restitution={parameters.restitution}/>
      <mesh receiveShadow><boxGeometry args={[14,0.5,12]}/><meshStandardMaterial color="#28435a" roughness={0.9}/></mesh>
    </RigidBody>
    <RigidBody type="fixed" colliders={false} position={[0,RAMP_BENCH.rampCentreY,0]} rotation={[0,0,angle]} userData={{kineticlabId:'ramp-experiment-ramp'}}>
      <CuboidCollider args={[RAMP_BENCH.rampLength/2,RAMP_BENCH.rampThickness/2,RAMP_BENCH.rampWidth/2]} friction={parameters.friction} restitution={parameters.restitution}/>
      <mesh castShadow receiveShadow name="ramp-experiment-incline">
        <boxGeometry args={[RAMP_BENCH.rampLength,RAMP_BENCH.rampThickness,RAMP_BENCH.rampWidth]}/>
        <meshStandardMaterial color="#e6a256" roughness={0.63} metalness={0.12}/>
      </mesh>
    </RigidBody>
    <BallMotionTracker key={`${runId}-${parameters.angleDegrees}-${parameters.motion}`} runId={runId}/>
    <group position={[-4,0.1,-2.6]}>
      <mesh><boxGeometry args={[0.08,0.2,0.08]}/><meshStandardMaterial color="#6eb1cd"/></mesh>
    </group>
  </>;
}
