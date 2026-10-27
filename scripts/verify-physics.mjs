/** Offline Stage 8 self-check. Distinct from real Rapier WASM and browser tests. */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const temp=mkdtempSync(join(tmpdir(),'kineticlab-stage8-'));let checks=0;
const test=(label,fn)=>{fn();checks++;console.log(`PASS ${label}`);};
try {
  const types=spawnSync('tsc',['--strict','--target','ES2022','--module','commonjs','--moduleResolution','node','--skipLibCheck','--outDir',temp,
    'src/domain/registry.ts','src/domain/legacy-fixtures.ts','src/domain/starter-scene.ts','src/domain/physics-policy.ts','src/domain/contact-ledger.ts'],{encoding:'utf8'});
  assert.equal(types.status,0,types.stdout+types.stderr);
  const req=createRequire(import.meta.url);
  const policy=req(join(temp,'physics-policy.js'));
  const ledger=req(join(temp,'contact-ledger.js'));
  const {STARTER_SCENE}=req(join(temp,'starter-scene.js'));
  test('strict TypeScript physics domain compilation',()=>assert.equal(types.status,0));
  test('fixed timestep is 1/60',()=>assert.equal(policy.PHYSICS_POLICY.timestep,1/60));
  test('SI gravity preserved',()=>assert.deepEqual(policy.PHYSICS_POLICY.gravity,[0,-9.81,0]));
  test('four legacy bodies preserved',()=>assert.equal(policy.physicsBlueprints(STARTER_SCENE).length,4));
  test('rigid-body types preserved',()=>assert.deepEqual(policy.physicsBlueprints(STARTER_SCENE).map(x=>x.bodyType),['fixed','fixed','dynamic','fixed']));
  test('dynamic CCD preserved',()=>assert.equal(policy.physicsBlueprint(STARTER_SCENE.objects[2]).ccd,true));
  test('fixed contact properties explicit',()=>assert.equal(policy.physicsBlueprint(STARTER_SCENE.objects[0]).restitution,0));
  test('blueprints immutable',()=>assert.equal(Object.isFrozen(policy.physicsBlueprints(STARTER_SCENE)),true));
  test('invalid pair rejected',()=>assert.equal(ledger.contactKey('ball 01','ground-01'),null));
  test('duplicate pair rejected',()=>assert.equal(ledger.contactKey('ball-01','ball-01'),null));
  let current=ledger.EMPTY_CONTACT_LEDGER;
  current=ledger.updateContacts(current,'begin','ground-01','ball-01');
  test('contact entry recorded',()=>assert.equal(current.starts,1));
  current=ledger.updateContacts(current,'begin','ball-01','ground-01');
  test('duplicate begin not counted',()=>assert.equal(current.starts,1));
  current=ledger.updateContacts(current,'end','ball-01','ground-01');
  test('exit tracked',()=>assert.equal(current.ends,1));
  test('pair cleared on exit',()=>assert.equal(current.activeKeys.length,0));
  test('unbalanced exit ignored',()=>assert.equal(ledger.updateContacts(current,'end','ball-01','ground-01'),current));
  test('userData ID resolves',()=>assert.equal(ledger.collisionOtherId({rigidBody:{userData:{kineticlabId:'ground-01'}}}),'ground-01'));
  test('malformed data rejected',()=>assert.equal(ledger.collisionOtherId({rigidBody:{userData:{kineticlabId:10}}}),null));
  let bounded=ledger.EMPTY_CONTACT_LEDGER;
  for(let i=0;i<50;i++){bounded=ledger.updateContacts(bounded,'begin','ball-01',`stopper-${i}`,5);bounded=ledger.updateContacts(bounded,'end','ball-01',`stopper-${i}`,5);}
  test('ledger history capped',()=>assert.equal(bounded.records.length,5));
  test('cumulative starts tracked',()=>assert.equal(bounded.starts,50));
  test('clear retains active contacts',()=>{const s=ledger.updateContacts(ledger.EMPTY_CONTACT_LEDGER,'begin','ball-01','ground-01');assert.equal(ledger.clearContactHistory(s).activeKeys.length,1);});
  const world=readFileSync('src/components/scene/StarterPhysicsWorld.tsx','utf8');
  const inspector=readFileSync('src/components/layout/Inspector.tsx','utf8');
  const sim=readFileSync('src/features/simulation/store.ts','utf8');
  for(const [name,source,needle] of [
    ['fixed-step Rapier policy wired',world,'timeStep={PHYSICS_POLICY.timestep}'],
    ['collider IDs supplied',world,'kineticlabId: object.id'],
    ['contact entries wired',world,'onCollisionEnter'],
    ['contact exits wired',world,'onCollisionExit'],
    ['world remount retained',world,'<Physics key={resetEpoch}'],
    ['contact diagnostics visible',inspector,'CONTACT DIAGNOSTICS'],
    ['restart resets telemetry',sim,'contactLedger: EMPTY_CONTACT_LEDGER'],
    ['scene editing preserved',readFileSync('src/features/scene/editing-actions.ts','utf8'),'commitObjectEdit()'],
    ['placement preserved',readFileSync('src/features/scene/PlacementController.tsx','utf8'),"addEventListener('drop'"],
  ])test(name,()=>assert.ok(source.includes(needle)));
  console.log(`PASS: ${checks} Stage 8 isolated checks and strict TypeScript domain compilation.`);
} finally {rmSync(temp,{recursive:true,force:true});}
