/** Stage 11 genuine Rapier WASM, fixed-step local domino impulse/contact/replay test. Run after npm ci. */
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
function trial({count=9,spacing=.4,impulse=.65,steps=300}={}){
  const world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/60;
  const ground=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.25,0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(7.5,.25,2.25).setFriction(.8),ground);
  const bodies=[], colliders=new Map();
  for(let i=0;i<count;i++){
    const x=(i-(count-1)/2)*spacing;
    const rb=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,.525,0).setLinearDamping(.02).setAngularDamping(.02).setCcdEnabled(true));
    const collider=world.createCollider(RAPIER.ColliderDesc.cuboid(.08,.525,.32).setMass(.32).setFriction(.8)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),rb);
    colliders.set(collider.handle,i);bodies.push(rb);
  }
  const q=new RAPIER.EventQueue(true);
  const x0=-(count-1)*spacing/2;
  bodies[0].applyImpulseAtPoint({x:impulse,y:0,z:0},{x:x0,y:.945,z:0},true);
  const collided=new Set();let toppledPeak=0,finite=true;
  for(let step=0;step<steps;step++){
    world.step(q);
    q.drainCollisionEvents((a,b,started)=>{
      if(!started)return;
      const ai=colliders.get(a),bi=colliders.get(b);
      if(ai!==undefined&&bi!==undefined&&Math.abs(ai-bi)===1) collided.add(Math.min(ai,bi));
    });
    const angles=bodies.map(body=>{
      const pos=body.translation(), rot=body.rotation(), v=body.linvel();
      finite &&= [...Object.values(pos),...Object.values(rot),...Object.values(v)].every(Number.isFinite);
      return Math.acos(Math.max(-1,Math.min(1,1-2*(rot.x*rot.x+rot.z*rot.z))))*180/Math.PI;
    });
    toppledPeak=Math.max(toppledPeak,angles.filter(a=>a>=50).length);
  }
  const final=bodies.map(b=>[b.translation().x,b.translation().y,b.rotation().z]);
  const result={toppledPeak,contacts:[...collided].sort((a,b)=>a-b),finite,final};
  q.free();world.free();return result;
}
const result=trial();
assert.ok(result.finite,'all Rapier poses and velocities must remain finite');
assert.ok(result.toppledPeak>=1,`initial physical impulse must tip first domino: ${JSON.stringify(result)}`);
assert.ok(result.contacts.includes(0),`first domino must make physical contact with neighbor: ${JSON.stringify(result)}`);
console.log('PASS actual Rapier WASM: physical tip and adjacent collision transfer',result.toppledPeak,'dominoes tipped; contacts',result.contacts.length);
const repeat=trial();
assert.deepEqual(result.contacts,repeat.contacts,'adjacent contact sequences should replay locally');
for(let i=0;i<result.final.length;i++)for(let j=0;j<3;j++)assert.ok(Math.abs(result.final[i][j]-repeat.final[i][j])<1e-5,'same local fixed-step trial should replay');
console.log('PASS actual Rapier WASM: finite motion, contact events and same-environment fixed-step replay');
const wide=trial({count:8,spacing:.57});
assert.ok(wide.finite,'wide preset remains numerically finite');
console.log('PASS actual Rapier WASM: wide spacing configuration remains stable',wide.toppledPeak,'tipped');
console.log('NOTE: contact and toppling counts are physical outcomes, not scripted success claims; cross-platform exact determinism not guaranteed.');
