/** Dependency-free verification of TypeScript domain logic using the installed tsc.
 * Complements (does not replace) full Vitest + browser verification.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'kineticlab-domain-'));
let count = 0;
const test = (label, fn) => {
  try { fn(); count++; console.log(`PASS ${label}`); }
  catch (error) { console.error(`FAIL ${label}`, error); throw error; }
};
try {
  execFileSync('tsc', ['--target','ES2022','--module','commonjs','--moduleResolution','node',
    '--strict','--outDir',out, '--rootDir',join(root,'src','domain'),
    'src/domain/legacy-fixtures.ts','src/domain/starter-scene.ts','src/domain/fixtures.ts','src/domain/registry.ts'],
    { cwd:root, stdio:'pipe' });
  const require = createRequire(join(out,'verification.cjs'));
  const registry = require(join(out,'registry.js'));
  const { STARTER_SCENE, migrateLegacyStarterScene } = require(join(out,'starter-scene.js'));
  const { LEGACY_STARTER_OBJECTS, PHYSICS_SETTINGS } = require(join(out,'legacy-fixtures.js'));
  const { STARTER_OBJECTS, validateStarterScene } = require(join(out,'fixtures.js'));
  const fresh = () => JSON.parse(JSON.stringify(STARTER_SCENE));
  const invalid = (edit, pattern) => {
    const data = fresh(); edit(data);
    assert.match(registry.validateMechanicalScene(data).map(x=>x.message).join(' '), pattern);
    assert.throws(()=>registry.createMechanicalScene(data));
  };
  test('versioned starter registry validates',()=>assert.deepEqual(registry.validateMechanicalScene(STARTER_SCENE),[]));
  test('all four historical identifiers preserved',()=>assert.deepEqual(STARTER_SCENE.objects.map(x=>x.id),['ground-01','ramp-01','ball-01','stopper-01']));
  test('original positions preserved',()=>assert.deepEqual(STARTER_SCENE.objects.map(x=>x.transform.position),LEGACY_STARTER_OBJECTS.map(x=>x.position)));
  test('legacy facade unchanged',()=>assert.deepEqual(validateStarterScene(STARTER_OBJECTS),[]));
  test('gravity preserved',()=>assert.deepEqual(PHYSICS_SETTINGS.gravity,[0,-9.81,0]));
  test('ramp rotation preserved',()=>assert.deepEqual(registry.selectMechanicalObject(STARTER_SCENE,'ramp-01').transform.rotation,[0,0,-0.2]));
  test('sphere physics preserved',()=>assert.deepEqual(registry.selectMechanicalObject(STARTER_SCENE,'ball-01').physics,{bodyType:'dynamic',collider:'ball',friction:0.55,restitution:0.35,linearDamping:0.06,angularDamping:0.04,canSleep:false,ccd:true}));
  test('sphere radius preserved',()=>assert.equal(registry.selectMechanicalObject(STARTER_SCENE,'ball-01').geometry.radius,0.34));
  test('shape and visual colors preserved',()=>assert.deepEqual(STARTER_SCENE.objects.map(x=>x.visual.color),['#1b3041','#e6a256','#75dbe0','#748ca4']));
  test('JSON roundtrip stable',()=>assert.deepEqual(registry.deserializeMechanicalScene(registry.serializeMechanicalScene(STARTER_SCENE)),STARTER_SCENE));
  test('immutable snapshot',()=>assert.equal(Object.isFrozen(STARTER_SCENE.objects[0].geometry),true));
  test('copy breaks caller aliases',()=>{const input=fresh();const clone=registry.createMechanicalScene(input);input.objects[0].transform.position[0]=999;assert.equal(clone.objects[0].transform.position[0],0)});
  test('read-only kind selector',()=>assert.equal(Object.isFrozen(registry.selectByKind(STARTER_SCENE,'ball')),true));
  test('missing selector is undefined',()=>assert.equal(registry.selectMechanicalObject(STARTER_SCENE,'no-such-id'),undefined));
  test('explicit migration matches canonical scene',()=>assert.deepEqual(migrateLegacyStarterScene(LEGACY_STARTER_OBJECTS),STARTER_SCENE));
  test('duplicate id rejected',()=>invalid(d=>d.objects[1].id='ground-01',/Duplicate object ID/));
  test('blank id rejected',()=>invalid(d=>d.objects[0].id='  ',/ID must be nonblank/));
  test('unsupported kind rejected',()=>invalid(d=>d.objects[1].kind='motor',/Unknown component kind/));
  test('unsupported schema rejected',()=>invalid(d=>d.schemaVersion=2,/Unsupported schema version/));
  test('nonfinite coordinate rejected',()=>invalid(d=>d.objects[0].transform.position[0]=Infinity,/Position must contain/));
  test('zero scale rejected',()=>invalid(d=>d.objects[0].transform.scale[0]=0,/Scale must contain/));
  test('negative geometry rejected',()=>invalid(d=>d.objects[0].geometry.dimensions[0]=-1,/Box dimensions must/));
  test('invalid sphere radius rejected',()=>invalid(d=>d.objects[2].geometry.radius=NaN,/Radius must/));
  test('invalid material rejected',()=>invalid(d=>d.objects[0].visual.color='red',/six-digit hex/));
  test('physics body-kind mismatch rejected',()=>invalid(d=>d.objects[0].physics.bodyType='dynamic',/require fixed/));
  test('nonfinite damping rejected',()=>invalid(d=>d.objects[2].physics.linearDamping=NaN,/damping must/));
  test('invalid restitution rejected',()=>invalid(d=>d.objects[2].physics.restitution=2,/Restitution must/));
  test('unknown nested field rejected',()=>invalid(d=>d.objects[1].visual.unknown='xx',/Unknown field/));
  test('malformed JSON rejected',()=>assert.throws(()=>registry.deserializeMechanicalScene('{broken'),/Malformed/));
  test('empty scene is allowed',()=>assert.deepEqual(registry.createMechanicalScene({schemaVersion:1,objects:[]}).objects,[]));
  console.log(`PASS: ${count} isolated registry checks and strict TypeScript compilation.`);
} catch(error) {
  console.error('Registry verification FAILED:',error?.message||error);
  process.exitCode = 1;
} finally { rmSync(out,{recursive:true,force:true}); }
