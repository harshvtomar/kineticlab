/** Real Rapier WASM gravity/contact/restart smoke test; run after npm install.
 * This is a deliberately isolated rigid-body fixture, not a hidden live browser test.
 */
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();

function createWorld(){
  const world=new RAPIER.World({x:0,y:-9.81,z:0});
  world.timestep=1/60;
  const ground=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.2,0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(6,.2,5).setFriction(.5).setRestitution(0),ground);
  const ball=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,2.7,0).setCcdEnabled(true));
  world.createCollider(RAPIER.ColliderDesc.ball(.34).setFriction(.55).setRestitution(.35).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),ball);
  return {world,ball};
}
function simulate(steps){
  const {world,ball}=createWorld();
  const initial=ball.translation().y;
  const events = new RAPIER.EventQueue(true);
  let contactBegins = 0;
  for(let i=0;i<steps;i++){
    world.step(events);
    events.drainCollisionEvents((_first, _second, started)=>{if(started)contactBegins++;});
  }
  const final=ball.translation().y;
  const velocity=ball.linvel().y;
  events.free();
  world.free();
  return {initial,final,velocity,contactBegins};
}
const first=simulate(180),second=simulate(180);
assert.ok(Math.abs(first.initial-2.7)<1e-5,'initial pose must match descriptor');
assert.ok(first.final<first.initial-1,'gravity must move the ball down');
assert.ok(first.final>0.25 && first.final<0.55,'ground collider must prevent falling through');
assert.ok(Number.isFinite(first.velocity),'velocity must remain finite');
assert.ok(first.contactBegins>=1,'collider entry events should be observed');
assert.deepEqual(first,second,'same local WASM build, initial pose and fixed steps must reproduce the result');
console.log('PASS actual Rapier WASM: gravity, ground collision, collision event, finite motion, fixed-step 180 tick replay');
console.log(`PASS baseline y=${first.initial.toFixed(3)}, y after 180 steps=${first.final.toFixed(3)}`);
