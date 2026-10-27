/** Offline Stage 9 collision policy checks, independent of npm/Vitest. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
const cwd = resolve(import.meta.dirname,'..');
const tmp = mkdtempSync(join(tmpdir(),'kl-collision-'));
let checks=0;
function pass(name, fn){ fn(); checks++; console.log(`PASS ${name}`); }
try {
  execFileSync('tsc', ['--strict','--skipLibCheck','--target','ES2022','--module','commonjs',
    '--moduleResolution','node','--outDir',tmp,'src/domain/collision-system.ts','src/domain/starter-scene.ts'], {cwd,stdio:'pipe'});
  const req = createRequire(join(tmp,'check.cjs'));
  const sys = req(join(tmp,'collision-system.js'));
  const {collisionMask:mask, groupsMayInteract:allows, COLLISION_LAYERS:layers} = sys;
  const scene = req(join(tmp,'starter-scene.js')).STARTER_SCENE;
  const objects = Object.fromEntries(scene.objects.map(obj=>[obj.kind,obj]));
  pass('exact Rapier 16-bit packed mask',()=>assert.equal(mask([0,2,3],[2]),0x000d0004));
  pass('empty group mask',()=>assert.equal(mask([],[]),0));
  pass('filter symmetry',()=>assert.equal(allows(mask([1],[0]),mask([0],[1])),true));
  pass('filter denies one-sided acceptance',()=>assert.equal(allows(mask([1],[0]),mask([0],[2])),false));
  pass('reject invalid indices',()=>{for(const x of [-1,16,NaN,Infinity,1.5])assert.throws(()=>mask([x],[1]));});
  pass('expected sensor groups',()=>assert.deepEqual(layers,{FIXED:0,BALL:1,SENSOR:2}));
  pass('sensor detects dynamic group',()=>assert.ok(allows(sys.SENSOR_COLLISION_GROUPS,mask([1],[0,1,2]))));
  pass('sensor ignores fixed group',()=>assert.ok(!allows(sys.SENSOR_COLLISION_GROUPS,mask([0],[1]))));
  pass('trigger region valid',()=>assert.equal(sys.SENSOR_REGION.halfExtents.length,3));
  pass('all canonical objects retained',()=>assert.deepEqual(scene.objects.map(o=>o.id),['ground-01','ramp-01','ball-01','stopper-01']));
  for(const mode of sys.COLLISION_MODES){
    pass(`${mode} keeps ground collision`,()=>assert.ok(allows(sys.collisionGroupsForObject(objects.ball,mode),sys.collisionGroupsForObject(objects.ground,mode))));
    pass(`${mode} keeps ramp collision`,()=>assert.ok(allows(sys.collisionGroupsForObject(objects.ball,mode),sys.collisionGroupsForObject(objects.ramp,mode))));
    pass(`${mode} detects moving balls`,()=>assert.ok(sys.sensorMayDetect(objects.ball,mode)));
    pass(`${mode} sensors ignore fixed objects`,()=>assert.ok(!sys.sensorMayDetect(objects.ramp,mode)));
  }
  pass('standard mode collides dynamic balls',()=>assert.ok(allows(sys.collisionGroupsForObject(objects.ball,'all'),sys.collisionGroupsForObject(objects.ball,'all'))));
  pass('separate-balls mode suppresses dynamic contacts',()=>assert.ok(!allows(sys.collisionGroupsForObject(objects.ball,'separate-balls'),sys.collisionGroupsForObject(objects.ball,'separate-balls'))));
  pass('invalid mode throws',()=>assert.throws(()=>sys.collisionGroupsForObject(objects.ball,'unknown')));
  console.log(`PASS ${checks} independent Stage 9 collision assertions and strict TypeScript domain compilation`);
} finally { rmSync(tmp,{recursive:true,force:true}); }
