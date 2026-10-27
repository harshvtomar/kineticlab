import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { DOMINO, dominoId, dominoPositions, tiltDegrees } from '../../domain/domino-dynamics';
import { collisionOtherId } from '../../domain/contact-ledger';
import { useDominoStore } from '../../features/simulation/domino-store';
import { useSimulationStore } from '../../features/simulation/store';

/** Stage 11 opt-in physical domino bench. Nothing here is inserted into the editable scene registry. */
export function DominoExperimentRig({runId}:{readonly runId:number}) {
  const parameters=useDominoStore(s=>s.parameters);
  const launched=useDominoStore(s=>s.launched);
  const paused=useSimulationStore(s=>s.paused);
  const bodies=useRef<Array<RapierRigidBody|null>>([]);
  const applied=useRef(false);
  const elapsed=useRef(0);
  const sampleTimer=useRef(0);
  const positions=dominoPositions(parameters);
  useFrame((_state,delta)=>{
    if(paused || !launched || useDominoStore.getState().runId!==runId) return;
    if(!applied.current && bodies.current[0]){
      // Apply physical impulse near the top, creating rotation and transmission by contacts.
      const start=positions[0];
      bodies.current[0]!.applyImpulseAtPoint({x:parameters.kickImpulseNs,y:0,z:0},
        {x:start[0],y:DOMINO.heightM*0.9,z:start[2]},true);
      applied.current=true;
    }
    const dt=Math.min(Math.max(delta,0),DOMINO.sampleDeltaMaxS);
    elapsed.current+=dt;
    sampleTimer.current+=dt;
    if(sampleTimer.current<DOMINO.sampleIntervalS) return;
    sampleTimer.current=0;
    const angles=bodies.current.slice(0,parameters.count).map(body=>body?tiltDegrees(body.rotation()):0);
    useDominoStore.getState().record(angles,elapsed.current,runId);
  });
  return <>
    <ambientLight intensity={1.05}/><hemisphereLight args={['#c7e8ff','#102032',1.7]}/>
    <directionalLight position={[5,9,5]} intensity={2.3} castShadow shadow-mapSize={[2048,2048]}/>
    <RigidBody type="fixed" colliders={false} position={[0,-0.25,0]} userData={{kineticlabId:'domino-ground'}}>
      <CuboidCollider args={[DOMINO.groundWidthM/2,0.25,DOMINO.groundDepthM/2]} friction={parameters.friction}/>
      <mesh receiveShadow name="domino-ground"><boxGeometry args={[DOMINO.groundWidthM,0.5,DOMINO.groundDepthM]}/><meshStandardMaterial color="#28435a" roughness={0.95}/></mesh>
    </RigidBody>
    {positions.map((position,i)=><RigidBody key={dominoId(i)} ref={body=>{bodies.current[i]=body;}} type="dynamic"
      colliders={false} position={[...position]} ccd canSleep={false}
      userData={{kineticlabId:dominoId(i)}} linearDamping={0.02} angularDamping={0.02}
      onCollisionEnter={event=>{
        if(useDominoStore.getState().runId!==runId) return;
        const other=collisionOtherId(event.other);
        if(other) useDominoStore.getState().contact(dominoId(i),other,elapsed.current,runId);
      }}>
      <CuboidCollider args={[DOMINO.thicknessM/2,DOMINO.heightM/2,DOMINO.depthM/2]}
        friction={parameters.friction} restitution={0} mass={DOMINO.massKg}/>
      <mesh castShadow name={`domino-piece-${i+1}`}>
        <boxGeometry args={[DOMINO.thicknessM,DOMINO.heightM,DOMINO.depthM]}/>
        <meshStandardMaterial color={i===0?'#edaa55':i===parameters.count-1?'#7bd8c9':i%2?'#85bde5':'#c6a2e3'} metalness={0.08} roughness={0.7}/>
      </mesh>
    </RigidBody>)}
    <mesh position={[0,0.006,1.28]} rotation={[-Math.PI/2,0,0]}>
      <planeGeometry args={[(parameters.count-1)*parameters.spacingM+1,0.06]}/>
      <meshBasicMaterial color="#4e819c"/>
    </mesh>
  </>;
}
