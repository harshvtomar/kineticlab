/** Stage 10 real WASM physics experiment. Requires npm ci on Mac.
 * Fixed-step, same-machine checks only; never claims exact cross-platform determinism.
 */
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
const GRAVITY=9.81,DT=1/60,L=4.8,H=1.8,T=.24,R=.34;

function runIncline({angle=18,friction=.85,restitution=.05,locked=false,steps=160}={}){
  const w=new RAPIER.World({x:0,y:-GRAVITY,z:0});
  w.timestep=DT;
  const theta=angle*Math.PI/180;
  const ramp=w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,H,0)
    .setRotation({x:0,y:0,z:-Math.sin(theta/2),w:Math.cos(theta/2)}));
  w.createCollider(RAPIER.ColliderDesc.cuboid(L/2,T/2,1).setFriction(friction).setRestitution(restitution),ramp);
  const ground=w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.25,0));
  w.createCollider(RAPIER.ColliderDesc.cuboid(7,.25,6).setFriction(friction).setRestitution(restitution),ground);
  const distance=-L/2+.65,offset=T/2+R+.025;
  const start={x:distance*Math.cos(theta)+offset*Math.sin(theta),y:H-distance*Math.sin(theta)+offset*Math.cos(theta),z:0};
  const desc=RAPIER.RigidBodyDesc.dynamic().setTranslation(start.x,start.y,start.z)
    .setLinearDamping(.01).setAngularDamping(.01).setCcdEnabled(true);
  if(locked) desc.enabledRotations(false,false,false);
  const ball=w.createRigidBody(desc);
  w.createCollider(RAPIER.ColliderDesc.ball(R).setFriction(friction).setRestitution(restitution),ball);
  let maxSpeed=0, maxSpin=0;
  for(let i=0;i<steps;i++){
    w.step();
    const v=ball.linvel(),av=ball.angvel(),p=ball.translation();
    assert.ok([p.x,p.y,p.z,v.x,v.y,v.z].every(Number.isFinite),'non-finite Rapier body state');
    maxSpeed=Math.max(maxSpeed,Math.hypot(v.x,v.y,v.z));
    maxSpin=Math.max(maxSpin,Math.hypot(av.x,av.y,av.z));
  }
  const end=ball.translation(),velocity=ball.linvel();
  const travel=(end.x-start.x)*Math.cos(theta)-(end.y-start.y)*Math.sin(theta);
  const result={travel,y:end.y,x:end.x,speed:Math.hypot(velocity.x,velocity.y,velocity.z),maxSpeed,maxSpin};
  w.free();return result;
}
const rolling=runIncline();
assert.ok(rolling.travel>.4 && rolling.maxSpeed>.8,`ball must accelerate down incline: ${JSON.stringify(rolling)}`);
console.log('PASS real Rapier WASM: ball runs downhill on sloped, frictional ramp',rolling);
const noFriction=runIncline({friction:0});
assert.ok(rolling.maxSpin > noFriction.maxSpin+.1,`friction must generate sphere spin: ${JSON.stringify({rolling,noFriction})}`);
console.log('PASS real Rapier WASM: friction changes angular motion');
const locked=runIncline({locked:true});
assert.ok(locked.maxSpin<.001,`locked-rotation sliding must not spin: ${JSON.stringify(locked)}`);
console.log('PASS real Rapier WASM: sliding mode locks angular rotations');
const replay=runIncline();
assert.ok(Math.abs(replay.x-rolling.x)<1e-5 && Math.abs(replay.y-rolling.y)<1e-5 && Math.abs(replay.maxSpin-rolling.maxSpin)<1e-5,'identical local fixed-step trials must replay');
console.log('PASS real Rapier WASM: repeatable fixed-step local ramp replay');
function bounce(restitution){
  const w=new RAPIER.World({x:0,y:-9.81,z:0});w.timestep=DT;
  const ground=w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.25,0));
  w.createCollider(RAPIER.ColliderDesc.cuboid(4,.25,4).setRestitution(restitution),ground);
  const ball=w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,2,0).setCcdEnabled(true));
  w.createCollider(RAPIER.ColliderDesc.ball(.3).setRestitution(restitution),ball);
  let maxUpAfterContact=0, touched=false;
  for(let i=0;i<125;i++){
    w.step();const p=ball.translation(),v=ball.linvel();
    if(p.y<.36)touched=true;
    if(touched) maxUpAfterContact=Math.max(maxUpAfterContact,v.y);
  }
  w.free();return maxUpAfterContact;
}
const high=bounce(.8),low=bounce(0);
assert.ok(high>low+.7,`high restitution should yield more upward rebound: high=${high}, low=${low}`);
console.log(`PASS real Rapier WASM: restitution changes bounce upward speed (${low.toFixed(2)} vs ${high.toFixed(2)} m/s)`);
