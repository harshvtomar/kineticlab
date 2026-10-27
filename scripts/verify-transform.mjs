/** Offline Stage 7 domain verification. Runs without npm packages; does not replace Vitest/browser QA. */
import { spawnSync } from 'node:child_process';
import { mkdtempSync,rmSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const tmp=mkdtempSync(join(tmpdir(),'kineticlab-stage7-'));let checks=0;
const check=(name,fn)=>{fn();checks++;console.log('PASS',name);};
try {
 const compile=spawnSync('tsc',['--strict','--target','ES2022','--module','commonjs','--moduleResolution','node','--skipLibCheck','--outDir',tmp,'src/domain/registry.ts','src/domain/legacy-fixtures.ts','src/domain/starter-scene.ts','src/domain/scene-edit.ts','src/domain/placement.ts','src/domain/transforms.ts'],{encoding:'utf8'});
 if(compile.status!==0)throw new Error(compile.stdout+compile.stderr);
 const require=createRequire(import.meta.url);
 const {STARTER_SCENE}=require(join(tmp,'starter-scene.js'));
 const {serializeMechanicalScene,deserializeMechanicalScene}=require(join(tmp,'registry.js'));
 const edit=require(join(tmp,'transforms.js'));
 const ball=STARTER_SCENE.objects.find(o=>o.kind==='ball');
 const pose=(x,y,z)=>({...ball.transform,position:[x,y,z]});
 check('Strict typechecked editing domain',()=>assert.equal(compile.status,0));
 for(const id of ['ground-01','missing','ball-01']) {
  check(`Edit ${id} validation`,()=>assert.equal(edit.transformMechanicalObject(STARTER_SCENE,id,id==='ball-01'?ball.transform:pose(4,2,-3)).status,id==='ground-01'?'protected':id==='missing'?'missing':'unchanged'));
 }
 for(const invalid of [NaN,Infinity,-Infinity,100,-100])check(`Invalid pose ${invalid}`,()=>assert.notEqual(edit.transformMechanicalObject(STARTER_SCENE,'ball-01',pose(invalid,2,-3)).status,'updated'));
 for(const factor of [0,-1,0.1,5,Infinity])check(`Invalid scale ${factor}`,()=>assert.equal(edit.isSafeTransform({...ball.transform,scale:[factor,1,1]}),false));
 for(const rotation of [-30,30,Infinity])check(`Invalid rotation ${rotation}`,()=>assert.equal(edit.isSafeTransform({...ball.transform,rotation:[rotation,0,0]}),false));
 for(const coordinates of [[4,2,-3],[4,2,3],[2,4,3]])check(`Valid edit at ${coordinates.join(',')}`,()=>{
  const result=edit.transformMechanicalObject(STARTER_SCENE,'ball-01',pose(...coordinates));assert.equal(result.status,'updated');
  assert.equal(result.scene.objects.length,4);assert.equal(Object.isFrozen(result.scene.objects),true);
  assert.deepEqual(deserializeMechanicalScene(serializeMechanicalScene(result.scene)),result.scene);
  assert.notEqual(result.scene,STARTER_SCENE);
 });
 for(const coordinates of [[20,2,0],[0,-3,0],[0,1.45,0],[0,0,25]])check(`Unsafe ${coordinates.join(',')} rejected`,()=>assert.notEqual(edit.transformMechanicalObject(STARTER_SCENE,'ball-01',pose(...coordinates)).status,'updated'));
 for(const id of ['ramp-01','ball-01','stopper-01'])check(`Duplicate ${id}`,()=>{
   const result=edit.duplicateMechanicalObject(STARTER_SCENE,id);
   assert.equal(result.status,'duplicated');assert.equal(new Set(result.scene.objects.map(o=>o.id)).size,5);
   assert.deepEqual(result.scene.objects.find(o=>o.id===id),STARTER_SCENE.objects.find(o=>o.id===id));
 });
 check('Ground duplicate blocked',()=>assert.equal(edit.duplicateMechanicalObject(STARTER_SCENE,'ground-01').status,'protected'));
 check('Missing duplicate blocked',()=>assert.equal(edit.duplicateMechanicalObject(STARTER_SCENE,'nonexistent').status,'missing'));
 const wiring=[
  ['Bounded undo history','src/features/scene/store.ts','s.past.slice(-39)'],
  ['Transform in scene store','src/features/scene/store.ts','editById:'],
  ['Duplicate in scene store','src/features/scene/store.ts','duplicateById:'],
  ['3D handles','src/features/scene/TransformGizmo.tsx','<TransformControls'],
  ['UI inspector','src/components/layout/Inspector.tsx','<ObjectTransformEditor'],
  ['Keyboard undo','src/app/App.tsx','undoSceneEdit()'],
  ['History toolbar','src/components/layout/EditorToolbar.tsx','redoSceneEdit'],
  ['Protected old deletion','src/features/scene/actions.ts','confirmObjectDeletion'],
  ['Old drag/drop preserved','src/features/scene/PlacementController.tsx',"addEventListener('drop'"],
  ['Rapier scene preserved','src/components/scene/StarterPhysicsWorld.tsx','<Physics key={resetEpoch}'],
 ];
 for(const [name,file,needle] of wiring)check(name,()=>assert.ok(readFileSync(file,'utf8').includes(needle)));
 console.log(`PASS: ${checks} independent Stage 7 checks and strict TypeScript domain compilation.`);
} finally {rmSync(tmp,{recursive:true,force:true});}
