/** Dependency-free Stage 5 acceptance on the pure scene-edit policy (no mocked physics). */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const output = mkdtempSync(join(tmpdir(), 'kineticlab-stage5-'));
let passed = 0;
function check(title, callback) {
  callback();
  console.log('PASS', title);
  passed++;
}
try {
  execFileSync('tsc', ['--target', 'ES2022', '--module', 'commonjs', '--moduleResolution', 'node',
    '--strict', '--outDir', output, '--rootDir', join(root,'src','domain'),
    'src/domain/legacy-fixtures.ts', 'src/domain/starter-scene.ts',
    'src/domain/registry.ts', 'src/domain/scene-edit.ts'], { cwd: root, stdio: 'pipe' });
  const require = createRequire(join(output, 'checks.cjs'));
  const { STARTER_SCENE } = require(join(output, 'starter-scene.js'));
  const { selectMechanicalObject, deserializeMechanicalScene, serializeMechanicalScene } = require(join(output, 'registry.js'));
  const { isRemovableObject, removeMechanicalObject } = require(join(output, 'scene-edit.js'));
  const expected = ['ground-01','ramp-01','ball-01','stopper-01'];
  check('Original IDs preserved', () => assert.deepEqual(STARTER_SCENE.objects.map(x=>x.id), expected));
  check('Ground protection', () => assert.equal(isRemovableObject(selectMechanicalObject(STARTER_SCENE,'ground-01')),false));
  for (const id of expected.slice(1)) {
    check(`${id} removable`, () => assert.equal(isRemovableObject(selectMechanicalObject(STARTER_SCENE,id)),true));
    check(`${id} deletion success`, () => assert.equal(removeMechanicalObject(STARTER_SCENE,id).status,'removed'));
    check(`${id} actually absent`, () => assert.equal(selectMechanicalObject(removeMechanicalObject(STARTER_SCENE,id).scene,id),undefined));
  }
  check('Ground removal rejected',()=>assert.equal(removeMechanicalObject(STARTER_SCENE,'ground-01').status,'protected'));
  check('Original untouched by removal',()=>assert.equal(STARTER_SCENE.objects.length,4));
  check('Unknown ID is a no-op',()=>assert.equal(removeMechanicalObject(STARTER_SCENE,'missing').scene,STARTER_SCENE));
  check('Blank ID is a no-op',()=>assert.equal(removeMechanicalObject(STARTER_SCENE,'').status,'missing'));
  check('Removal retains schema',()=>assert.equal(removeMechanicalObject(STARTER_SCENE,'ramp-01').scene.schemaVersion,1));
  check('Removal retains canonical order',()=>assert.deepEqual(removeMechanicalObject(STARTER_SCENE,'ball-01').scene.objects.map(x=>x.id),['ground-01','ramp-01','stopper-01']));
  check('Removal result frozen',()=>assert.equal(Object.isFrozen(removeMechanicalObject(STARTER_SCENE,'ramp-01').scene.objects),true));
  check('Removal JSON stable',()=>{const s=removeMechanicalObject(STARTER_SCENE,'ball-01').scene;assert.deepEqual(deserializeMechanicalScene(serializeMechanicalScene(s)),s)});
  check('Double delete becomes no-op',()=>{const first=removeMechanicalObject(STARTER_SCENE,'ball-01');assert.equal(removeMechanicalObject(first.scene,'ball-01').status,'missing')});
  check('Two deletions retain ground',()=>{const x=removeMechanicalObject(removeMechanicalObject(STARTER_SCENE,'ball-01').scene,'ramp-01');assert.deepEqual(x.scene.objects.map(x=>x.id),['ground-01','stopper-01'])});
  const actions = readFileSync(join(root, 'src/features/scene/actions.ts'), 'utf8');
  check('Confirmation boundary present',()=>assert.match(actions,/export function confirmObjectDeletion\(/));
  check('Explicit pending ID required',()=>assert.match(actions,/if \(!pending\) return false/));
  check('Only successful deletion restarts physics',()=>assert.match(actions,/if \(outcome !== 'removed'\) return false;[\s\S]*?restart\(\)/));
  const scene = readFileSync(join(root, 'src/components/scene/StarterPhysicsWorld.tsx'), 'utf8');
  check('Stage 4 registry still drives body rendering',()=>assert.match(scene,/useSceneStore\(state => state\.scene\.objects\)/));
  check('3D meshes expose selection click events',()=>assert.match(scene,/onClick=\{choose\}/));
  check('Visual highlight adds no new collider mesh',()=>assert.match(scene,/emissiveIntensity=\{selected \? 0\.42 : inContact \? 0\.52 : 0\}/));
  console.log(`PASS: ${passed} independent Stage 5 checks and strict TypeScript domain compilation.`);
} catch(error) {
  console.error('FAIL Stage 5 selection verification:', error?.message || String(error));
  process.exitCode = 1;
} finally { rmSync(output,{recursive:true,force:true}); }
