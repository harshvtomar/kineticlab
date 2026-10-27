import { describe, expect, it } from 'vitest';
import { STARTER_SCENE } from './starter-scene';
import { createMechanicalScene, deserializeMechanicalScene, serializeMechanicalScene, type Transform } from './registry';
import { checkEditablePose, duplicateMechanicalObject, isSafeTransform, rotatedHalfExtents, transformMechanicalObject } from './transforms';
const ball=STARTER_SCENE.objects.find(o=>o.kind==='ball')!;
const pose=(x:number,y:number,z:number):Transform=>({...ball.transform,position:[x,y,z]});

describe('Stage 7 transform safety and immutable scene editing',()=>{
 it('does not edit ground',()=>expect(transformMechanicalObject(STARTER_SCENE,'ground-01',pose(0,0,0)).status).toBe('protected'));
 it('rejects stale object IDs',()=>expect(transformMechanicalObject(STARTER_SCENE,'missing',pose(0,2,0)).status).toBe('missing'));
 it('preserves unchanged poses without history actions',()=>expect(transformMechanicalObject(STARTER_SCENE,ball.id,ball.transform).status).toBe('unchanged'));
 it.each([NaN,Infinity,-Infinity])('rejects nonfinite x=%s',x=>expect(transformMechanicalObject(STARTER_SCENE,ball.id,pose(x,2,0)).status).toBe('invalid-transform'));
 it.each([0,-1,0.01,10,Infinity])('rejects scale x=%s',x=>expect(transformMechanicalObject(STARTER_SCENE,ball.id,{...ball.transform,scale:[x,1,1]}).status).toBe('invalid-transform'));
 it('rejects oversized rotation',()=>expect(isSafeTransform({...ball.transform,rotation:[0,14,0]})).toBe(false));
 it('rejects invalid transforms passed as unknown',()=>expect(isSafeTransform({position:[0,1,0],scale:[1,1],rotation:[0,0,0]})).toBe(false));
 it('accepts valid rotation and scale',()=>expect(isSafeTransform({...ball.transform,rotation:[0,Math.PI/2,0],scale:[2,1,1]})).toBe(true));
 it('accepts empty-but-valid scene as a schema, not a pose',()=>expect(createMechanicalScene({schemaVersion:1,objects:[]}).objects.length).toBe(0));
 it('updates ball and retains physics and original immutable object',()=>{
  const result=transformMechanicalObject(STARTER_SCENE,ball.id,pose(4,2,-3));expect(result.status).toBe('updated');
  if(result.status!=='updated')return;
  expect(result.scene.objects.find(o=>o.id===ball.id)?.physics).toEqual(ball.physics);
  expect(ball.transform.position).not.toEqual([4,2,-3]);
  expect(Object.isFrozen(result.scene.objects)).toBe(true);
  expect(deserializeMechanicalScene(serializeMechanicalScene(result.scene))).toEqual(result.scene);
 });
 it('rejects positions outside the ground',()=>expect(transformMechanicalObject(STARTER_SCENE,ball.id,pose(20,2,2)).status).toBe('outside-ground'));
 it('rejects positions below ground',()=>expect(transformMechanicalObject(STARTER_SCENE,ball.id,pose(4,-3,2)).status).toBe('outside-ground'));
 it('rejects overlap in full 3D',()=>expect(transformMechanicalObject(STARTER_SCENE,ball.id,pose(0,1.45,0)).status).toBe('overlap'));
 it('permits non-overlap when object is above another',()=>expect(transformMechanicalObject(STARTER_SCENE,ball.id,pose(0,5,0)).status).toBe('updated'));
 it('extent honors sphere anisotropic scale',()=>expect(rotatedHalfExtents({...ball,transform:{...ball.transform,scale:[2,1,3]}})).toEqual([.68,.34,1.02]));
 it('rotation changes box extents conservatively',()=>{
  const ramp=STARTER_SCENE.objects.find(o=>o.kind==='ramp')!;
  const a=rotatedHalfExtents({...ramp,transform:{...ramp.transform,rotation:[0,0,0]}});
  const b=rotatedHalfExtents({...ramp,transform:{...ramp.transform,rotation:[0,Math.PI/2,0]}});
  expect(b[0]).toBeCloseTo(a[2]);expect(b[2]).toBeCloseTo(a[0]);
 });
 it('pose validation ignores original ID when transforming',()=>{
  expect(checkEditablePose(STARTER_SCENE,{...ball,transform:pose(4,2,-3)},ball.id)).toBeNull();
 });
});

describe('Stage 7 duplication policy',()=>{
 it('never duplicates ground',()=>expect(duplicateMechanicalObject(STARTER_SCENE,'ground-01').status).toBe('protected'));
 it('rejects missing IDs',()=>expect(duplicateMechanicalObject(STARTER_SCENE,'ghost').status).toBe('missing'));
 it.each(['ball-01','ramp-01','stopper-01'])('copies %s safely',id=>{
  const result=duplicateMechanicalObject(STARTER_SCENE,id);
  expect(result.status).toBe('duplicated');if(result.status!=='duplicated')return;
  expect(result.scene.objects).toHaveLength(5);
  expect(new Set(result.scene.objects.map(o=>o.id)).size).toBe(5);
  expect(result.scene.objects.find(o=>o.id===id)).toEqual(STARTER_SCENE.objects.find(o=>o.id===id));
  expect(result.scene.objects.find(o=>o.id===result.id)?.kind).toBe(STARTER_SCENE.objects.find(o=>o.id===id)?.kind);
 });
 it('duplicates have distinct immutable identities',()=>{
  const first=duplicateMechanicalObject(STARTER_SCENE,'ball-01');expect(first.status).toBe('duplicated');if(first.status!=='duplicated')return;
  const second=duplicateMechanicalObject(first.scene,'ball-01');expect(second.status).toBe('duplicated');if(second.status!=='duplicated')return;
  expect(second.id).not.toBe(first.id);expect(second.scene.objects).toHaveLength(6);
  expect(Object.isFrozen(second.scene.objects.at(-1))).toBe(true);
 });
});
