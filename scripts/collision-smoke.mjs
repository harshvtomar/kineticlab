/** Stage 9 real WASM test (requires npm ci): actual contact-filter + non-solid sensor checks.
 * Uses only local Rapier outcomes, not fabricated contact forces or cross-device guarantees.
 */
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
const group=(members,filters)=>((members.reduce((n,x)=>n|(1<<x),0)<<16) | filters.reduce((n,x)=>n|(1<<x),0))>>>0;

function ballPair(allowBallBall){
  const world=new RAPIER.World({x:0,y:0,z:0});
  world.timestep=1/60;
  const queue=new RAPIER.EventQueue(true);
  let begins=0;
  const filter=allowBallBall?[0,1,2]:[0,2];
  const pos=[-.3,.3];const bodies=[];
  for(const x of pos){
    const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,0,0));
    world.createCollider(RAPIER.ColliderDesc.ball(.4)
      .setCollisionGroups(group([1],filter))
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),body);
    bodies.push(body);
  }
  for(let i=0;i<90;i++){
    world.step(queue);
    queue.drainCollisionEvents((_a,_b,started)=>{if(started)begins++});
  }
  const distance=Math.abs(bodies[0].translation().x-bodies[1].translation().x);
  queue.free();world.free();
  return {begins,distance};
}

function sensorPass(withSensor){
  const world=new RAPIER.World({x:0,y:0,z:0});
  world.timestep=1/60;
  const queue=new RAPIER.EventQueue(true);
  const ball=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(-2,0,0).setLinvel(3,0,0).setLinearDamping(0));
  world.createCollider(RAPIER.ColliderDesc.ball(.2).setRestitution(0).setCollisionGroups(group([1],[0,1,2]))
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),ball);
  if(withSensor){
    const zone=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,0,0));
    world.createCollider(RAPIER.ColliderDesc.cuboid(.6,.6,.6).setSensor(true)
      .setCollisionGroups(group([2],[1])).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),zone);
  }
  let entered=0,exited=0;
  for(let i=0;i<120;i++){
    world.step(queue);
    queue.drainCollisionEvents((_a,_b,started)=>{if(started)entered++;else exited++});
  }
  const x=ball.translation().x;
  queue.free();world.free();
  return {entered,exited,x};
}
const connected=ballPair(true),isolated=ballPair(false);
assert.ok(connected.distance>isolated.distance+.05,`ball collision solver should separate balls: ${JSON.stringify({connected,isolated})}`);
assert.ok(connected.begins>=1,'standard group should produce a solid contact event');
assert.equal(isolated.begins,0,'filtered ball-ball pair must not contact');
console.log('PASS real Rapier WASM: ball-ball collisions filtered while standard collisions respond');
const sensed=sensorPass(true),without=sensorPass(false);
assert.ok(sensed.entered>=1 && sensed.exited>=1,'sensor must detect both entry and exit');
assert.equal(without.entered,0,'no sensor means no events in the fixture');
assert.ok(Math.abs(sensed.x-without.x)<1e-4,'non-solid sensor must not change ballistic translation');
console.log(`PASS real Rapier WASM: non-solid sensor enter=${sensed.entered}, exit=${sensed.exited}, x=${sensed.x.toFixed(4)}`);
