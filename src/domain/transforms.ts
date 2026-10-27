/** Stage 7 pure geometry editing: no renderer, browser or physics dependency. */
import { createMechanicalScene, selectMechanicalObject, type MechanicalObject, type MechanicalScene, type Transform, type Vec3 } from './registry';
import { allocateMechanicalId } from './placement';

export type EditFailure = 'missing' | 'protected' | 'invalid-transform' | 'outside-ground' | 'overlap' | 'unchanged' | 'limit' | 'no-space';
export type EditResult = { readonly status: 'updated' | 'duplicated'; readonly scene: MechanicalScene; readonly id: string } |
  { readonly status: EditFailure; readonly scene: MechanicalScene };

const finite3 = (input: unknown): input is Vec3 => Array.isArray(input) && input.length === 3 && input.every(v => typeof v === 'number' && Number.isFinite(v));
export function isSafeTransform(input: unknown): input is Transform {
  if (!input || typeof input !== 'object') return false;
  const t = input as Partial<Transform>;
  return finite3(t.position) && finite3(t.rotation) && finite3(t.scale) &&
    t.position.every(n => Math.abs(n) <= 50) && t.rotation.every(n => Math.abs(n) <= 4 * Math.PI) &&
    t.scale.every(n => n >= 0.25 && n <= 4);
}

/** Conservative axis-aligned half-extents for Three.js Euler XYZ rotations. */
export function rotatedHalfExtents(object: MechanicalObject): Vec3 {
  const t = object.transform;
  if (object.geometry.shape === 'sphere') {
    return [0, 1, 2].map(i => object.geometry.shape === 'sphere' ? object.geometry.radius * t.scale[i] : 0) as unknown as Vec3;
  }
  const [hx,hy,hz] = object.geometry.dimensions.map((n,i) => n*t.scale[i]/2);
  const [x,y,z] = t.rotation;
  const a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z);
  const matrix = [[c*e,-c*f,d],[a*f+b*e*d,a*e-b*f*c,-b*c],[b*f-a*e*d,b*e+a*f*d,a*c]];
  return matrix.map(row => Math.abs(row[0])*hx+Math.abs(row[1])*hy+Math.abs(row[2])*hz) as unknown as Vec3;
}

/** Initial-pose volume check; intentionally conservative (AABB), not a runtime collision solver. */
export function checkEditablePose(scene: MechanicalScene, candidate: MechanicalObject, excludeId: string): EditFailure | null {
  if (!isSafeTransform(candidate.transform)) return 'invalid-transform';
  const floor = scene.objects.find(o=>o.kind === 'ground');
  if (!floor || floor.geometry.shape !== 'box') return 'outside-ground';
  const groundTop = floor.transform.position[1] + floor.geometry.dimensions[1]*floor.transform.scale[1]/2;
  const fx = floor.geometry.dimensions[0]*floor.transform.scale[0]/2;
  const fz = floor.geometry.dimensions[2]*floor.transform.scale[2]/2;
  const [hx,hy,hz] = rotatedHalfExtents(candidate);
  const [px,py,pz] = candidate.transform.position;
  if (Math.abs(px-floor.transform.position[0])+hx+0.05>fx || Math.abs(pz-floor.transform.position[2])+hz+0.05>fz || py-hy < groundTop-0.02 || py-hy > 20) return 'outside-ground';
  for(const other of scene.objects) {
    if(other.id === excludeId || other.kind === 'ground') continue;
    const [ox,oy,oz] = other.transform.position;
    const [ex,ey,ez] = rotatedHalfExtents(other);
    if(Math.abs(px-ox)<hx+ex+0.04 && Math.abs(py-oy)<hy+ey+0.04 && Math.abs(pz-oz)<hz+ez+0.04) return 'overlap';
  }
  return null;
}

/** Replaces exactly one descriptor; all original identities/physics config are retained. */
export function transformMechanicalObject(scene: MechanicalScene, id: string, transform: Transform): EditResult {
  const previous = selectMechanicalObject(scene,id);
  if(!previous) return {status:'missing',scene};
  if(previous.kind==='ground') return {status:'protected',scene};
  if(!isSafeTransform(transform)) return {status:'invalid-transform',scene};
  if(JSON.stringify(previous.transform)===JSON.stringify(transform)) return {status:'unchanged',scene};
  const next = {...previous,transform};
  const failure = checkEditablePose(scene,next,id);
  if(failure) return {status:failure,scene};
  return {status:'updated',id,scene:createMechanicalScene({schemaVersion:1,objects:scene.objects.map(o=>o.id===id?next:o)})};
}

/** Generate a collision-safe neighbouring copy without editing the original. */
export function duplicateMechanicalObject(scene: MechanicalScene, id: string): EditResult {
  const source=selectMechanicalObject(scene,id);
  if(!source) return {status:'missing',scene};
  if(source.kind==='ground') return {status:'protected',scene};
  if(scene.objects.length>=1000) return {status:'limit',scene};
  const kind=source.kind;
  const nextId=allocateMechanicalId(scene,kind);
  const deltas: number[]=[-4,-3.5,-3,-2.5,-2,-1.5,-1,-0.5,0,0.5,1,1.5,2,2.5,3,3.5,4];
  for(const dz of deltas) for(const dx of deltas) {
    if(!dx&&!dz) continue;
    const t:Transform={...source.transform,position:[source.transform.position[0]+dx,source.transform.position[1],source.transform.position[2]+dz]};
    const next:MechanicalObject={...source,id:nextId,label:`${source.label} copy`,transform:t};
    if(checkEditablePose(scene,next,'')===null) return {status:'duplicated',id:nextId,scene:createMechanicalScene({schemaVersion:1,objects:[...scene.objects,next]})};
  }
  return {status:'no-space',scene};
}
