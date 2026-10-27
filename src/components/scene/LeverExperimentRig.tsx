import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CuboidCollider,RigidBody,useRevoluteJoint,type RapierRigidBody} from '@react-three/rapier';
import {LEVER,leverAngleDegrees,leverGeometry} from '../../domain/lever-dynamics';
import {useLeverStore} from '../../features/simulation/lever-store';
import {useSimulationStore} from '../../features/simulation/store';

/** Genuine physics: a dynamic beam with separate mass-bearing colliders, hinged to a fixed anchor.
 * No scripted rotation or applied angular velocity. Gravity alone drives motion. */
export function LeverExperimentRig({runId}:{readonly runId:number}){
  const parameters=useLeverStore(s=>s.parameters);
  const paused=useSimulationStore(s=>s.paused);
  // Rapier's joint hook expects RefObject<RapierRigidBody> (not a nullable type).
  // The runtime value is initially null until RigidBody mounts; null! only fixes
  // the React 19 / TypeScript ref type at compile time, not runtime behavior.
  const anchor=useRef<RapierRigidBody>(null!);
  const beam=useRef<RapierRigidBody>(null!);
  const geometry=leverGeometry(parameters);
  // The 3D z-axis is the hinge, with anchors expressed in each body's LOCAL space.
  useRevoluteJoint(anchor,beam,[[0,0,0],[...geometry.jointBeamAnchor],[0,0,1]]);
  const elapsed=useRef(0),accumulator=useRef(0);
  useFrame((_,delta)=>{
    if(paused||!beam.current||useLeverStore.getState().runId!==runId)return;
    const dt=Math.min(Math.max(delta,0),LEVER.maxFrameDeltaS);
    elapsed.current+=dt;accumulator.current+=dt;
    if(accumulator.current<LEVER.samplePeriodS)return;
    accumulator.current=0;
    const rotation=beam.current.rotation(),speed=beam.current.angvel();
    useLeverStore.getState().record({elapsedS:elapsed.current,angleDeg:leverAngleDegrees(rotation),angularSpeedRadS:speed.z},runId);
  });
  return <>
    <ambientLight intensity={1.05}/>
    <hemisphereLight args={['#c7e8ff','#102032',1.7]}/>
    <directionalLight position={[5,9,5]} intensity={2.3} castShadow shadow-mapSize={[2048,2048]}/>
    <RigidBody type="fixed" colliders={false} position={[0,-0.25,0]} userData={{kineticlabId:'lever-ground'}}>
      <CuboidCollider args={[7,0.25,5]} friction={0.85}/>
      <mesh receiveShadow name="lever-floor"><boxGeometry args={[14,0.5,10]}/><meshStandardMaterial color="#28435a" roughness={0.92}/></mesh>
    </RigidBody>
    <RigidBody ref={anchor} type="fixed" colliders={false} position={[0,LEVER.fulcrumHeightM,0]} userData={{kineticlabId:'lever-anchor'}}>
      <mesh name="lever-pivot-axis" rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[0.15,0.15,0.9,24]}/>
        <meshStandardMaterial color="#f8ba72" metalness={0.5} roughness={0.35}/>
      </mesh>
      <mesh name="lever-fulcrum" position={[0,-LEVER.fulcrumHeightM/2,0]}>
        <coneGeometry args={[0.48,LEVER.fulcrumHeightM,4]}/>
        <meshStandardMaterial color="#5e91af" roughness={0.7}/>
      </mesh>
    </RigidBody>
    <RigidBody ref={beam} type="dynamic" colliders={false} position={[...geometry.beamPosition]}
      userData={{kineticlabId:'lever-beam'}} canSleep={false} angularDamping={parameters.angularDamping} linearDamping={0.03}>
      <CuboidCollider args={[LEVER.beamLengthM/2,LEVER.beamThicknessM/2,LEVER.beamDepthM/2]}
        mass={parameters.beamMassKg} friction={0.75}/>
      <mesh castShadow receiveShadow name="lever-beam">
        <boxGeometry args={[LEVER.beamLengthM,LEVER.beamThicknessM,LEVER.beamDepthM]}/>
        <meshStandardMaterial color="#a2d0eb" metalness={0.22} roughness={0.53}/>
      </mesh>
      <CuboidCollider position={[...geometry.leftWeightPosition]} args={[LEVER.weightWidthM/2,LEVER.weightHeightM/2,LEVER.beamDepthM/2]}
        mass={parameters.leftMassKg} friction={0.7}/>
      <mesh castShadow position={[...geometry.leftWeightPosition]} name="lever-left-mass">
        <boxGeometry args={[LEVER.weightWidthM,LEVER.weightHeightM,LEVER.beamDepthM]}/>
        <meshStandardMaterial color="#efab66" roughness={0.6}/>
      </mesh>
      <CuboidCollider position={[...geometry.rightWeightPosition]} args={[LEVER.weightWidthM/2,LEVER.weightHeightM/2,LEVER.beamDepthM/2]}
        mass={parameters.rightMassKg} friction={0.7}/>
      <mesh castShadow position={[...geometry.rightWeightPosition]} name="lever-right-mass">
        <boxGeometry args={[LEVER.weightWidthM,LEVER.weightHeightM,LEVER.beamDepthM]}/>
        <meshStandardMaterial color="#80e0c2" roughness={0.6}/>
      </mesh>
    </RigidBody>
  </>;
}
