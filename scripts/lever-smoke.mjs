/** Real Rapier WASM validation. Distinguishes actual hinge motion from idealized torque predictions.
 * Requires npm ci and runs against the same @dimforge/rapier3d-compat version as the project. */
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
const G=9.81,STEP=1/60;
function trial({left=2,right=2,offset=0,beamMass=1.2,steps=90}={}){
  const w=new RAPIER.World({x:0,y:-G,z:0});w.timestep=STEP;
  const ground=w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.25,0));
  w.createCollider(RAPIER.ColliderDesc.cuboid(7,.25,5),ground);
  const anchor=w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,1.75,0));
  const beam=w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(-offset,1.75,0).setAngularDamping(.15));
  w.createCollider(RAPIER.ColliderDesc.cuboid(2.8,.09,.22).setMass(beamMass),beam);
  w.createCollider(RAPIER.ColliderDesc.cuboid(.24,.19,.22).setTranslation(-1.65,.28,0).setMass(left),beam);
  w.createCollider(RAPIER.ColliderDesc.cuboid(.24,.19,.22).setTranslation(1.65,.28,0).setMass(right),beam);
  const j=w.createImpulseJoint(RAPIER.JointData.revolute({x:0,y:0,z:0},{x:offset,y:0,z:0},{x:0,y:0,z:1}),anchor,beam,true);
  assert.ok(j,'joint created');
  const states=[];let finite=true,maxPivotDrift=0;
  for(let n=0;n<steps;n++){
    w.step();
    const rot=beam.rotation(),pos=beam.translation(),omega=beam.angvel();
    const angle=2*Math.atan2(rot.z,rot.w)*180/Math.PI;
    states.push({angle,omega:omega.z});
    finite&&=[...Object.values(rot),...Object.values(pos),...Object.values(omega)].every(Number.isFinite);
    const pivotX=pos.x+offset*(1-2*(rot.y*rot.y+rot.z*rot.z));
    const pivotY=pos.y+offset*(2*(rot.w*rot.z+rot.x*rot.y));
    maxPivotDrift=Math.max(maxPivotDrift,Math.hypot(pivotX,pivotY-1.75));
  }
  const result={finite,maxPivotDrift,states,finalPos:beam.translation()};
  w.free();return result;
}
const balanced=trial(),left=trial({left:3.4,right:1.5}),right=trial({left:1.2,right:3.2}),offset=trial({offset:.4});
for(const [name,r] of Object.entries({balanced,left,right,offset})){
  assert.ok(r.finite,`${name}: pose/velocity must stay finite`);
  assert.ok(r.maxPivotDrift<.1,`${name}: revolute joint must constrain world-space pivot (drift=${r.maxPivotDrift})`);
}
const early=25;
assert.ok(Math.abs(balanced.states[early].angle)<.3,'symmetrically loaded lever remains near-horizontal initially');
assert.ok(left.states[early].angle>0.3,'left-heavy case must rotate in positive hinge direction');
assert.ok(right.states[early].angle<-.3,'right-heavy case must rotate in negative hinge direction');
assert.ok(offset.states[early].angle>0.3,'offset fulcrum must influence motion with equal masses');
console.log('PASS real Rapier WASM revolute hinge and four load/pivot configurations');
const replay=trial({left:3.4,right:1.5});
for(let n=0;n<left.states.length;n++)assert.ok(Math.abs(left.states[n].angle-replay.states[n].angle)<1e-5,'local fixed-step replay stable');
console.log('PASS real Rapier WASM repeatable joint behavior over',left.states.length,'fixed steps');
console.log('NOTE: exact cross-platform determinism is not promised. Diagnostics use physical body orientation, not animation.');
