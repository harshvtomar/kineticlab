/** Stage 6 dependency-light verification; full React/Vitest checks require npm install. */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const dir = mkdtempSync(join(tmpdir(), 'kineticlab-stage6-'));
let count = 0;
function check(label, fn) { fn(); console.log('PASS',label); count++; }
try {
  const compile = spawnSync('tsc', [
    '--target','ES2022','--module','commonjs','--moduleResolution','node','--strict','--skipLibCheck',
    '--outDir',dir,'src/domain/registry.ts','src/domain/legacy-fixtures.ts','src/domain/starter-scene.ts',
    'src/domain/scene-edit.ts','src/domain/placement.ts',
  ], { encoding: 'utf8' });
  if (compile.status !== 0) throw new Error(`${compile.stdout}\n${compile.stderr}`);
  const require = createRequire(import.meta.url);
  const { STARTER_SCENE } = require(join(dir, 'starter-scene.js'));
  const { createMechanicalScene, serializeMechanicalScene, deserializeMechanicalScene } = require(join(dir, 'registry.js'));
  const { removeMechanicalObject } = require(join(dir, 'scene-edit.js'));
  const p = require(join(dir, 'placement.js'));
  check('Strict TypeScript domain compilation',()=>assert.equal(compile.status,0));
  for (const k of p.PLACEABLE_KINDS) check(`Supported ${k}`,()=>assert.ok(p.isPlaceableKind(k)));
  for (const k of ['ground','spring','gear','lever','domino',undefined,7]) check(`Unsupported ${String(k)} rejected`,()=>assert.equal(p.isPlaceableKind(k),false));
  check('Ground at y = 0',()=>assert.equal(p.placementGroundHeight(STARTER_SCENE),0));
  check('Grid snap positive',()=>assert.equal(p.snapToPlacementGrid(1.26),1.5));
  check('Grid snap negative',()=>assert.equal(p.snapToPlacementGrid(-1.24),-1));
  for (const val of [NaN,Infinity,-Infinity]) check(`Nonfinite ${val} rejected`,()=>assert.equal(p.placeMechanicalObject(STARTER_SCENE,'ball',val,2).status,'invalid-position'));
  for (const [kind,x,z] of [['ball',4,-3],['stopper',4,3],['ramp',0,3.5]]) {
    const result=p.placeMechanicalObject(STARTER_SCENE,kind,x,z);
    check(`${kind} placement allowed`,()=>assert.equal(result.status,'placed'));
    check(`${kind} object count`,()=>assert.equal(result.scene.objects.length,5));
    check(`${kind} ID uniqueness`,()=>assert.equal(new Set(result.scene.objects.map(o=>o.id)).size,5));
    check(`${kind} JSON stable`,()=>assert.deepEqual(deserializeMechanicalScene(serializeMechanicalScene(result.scene)),result.scene));
    check(`${kind} immutable snapshot`,()=>assert.ok(Object.isFrozen(result.scene.objects)));
    check(`${kind} ground preserved`,()=>assert.deepEqual(result.scene.objects[0],STARTER_SCENE.objects[0]));
    check(`${kind} physics type`,()=>assert.equal(result.scene.objects.at(-1).physics.bodyType,kind==='ball'?'dynamic':'fixed'));
  }
  const placed=p.placeMechanicalObject(STARTER_SCENE,'ball',4,-3);
  check('Original unchanged',()=>assert.equal(STARTER_SCENE.objects.length,4));
  check('Duplicate location rejected',()=>assert.equal(p.placeMechanicalObject(placed.scene,'ball',4,-3).status,'overlap'));
  check('Starter ramp overlap rejected',()=>assert.equal(p.placeMechanicalObject(STARTER_SCENE,'ball',0,0).status,'overlap'));
  check('Outside ground rejected',()=>assert.equal(p.placeMechanicalObject(STARTER_SCENE,'ramp',5,4).status,'outside-ground'));
  check('New body removable',()=>assert.equal(removeMechanicalObject(placed.scene,placed.placedId).status,'removed'));
  check('Ground protected',()=>assert.equal(removeMechanicalObject(placed.scene,'ground-01').status,'protected'));
  check('Delete restores original scene values',()=>assert.deepEqual(removeMechanicalObject(placed.scene,placed.placedId).scene.objects,STARTER_SCENE.objects));
  check('No-ground placement rejected',()=>assert.equal(p.placeMechanicalObject(createMechanicalScene({schemaVersion:1,objects:STARTER_SCENE.objects.slice(1)}),'ball',4,-3).status,'outside-ground'));
  check('ID allocator determinism',()=>assert.equal(p.allocateMechanicalId(STARTER_SCENE,'ball'),'ball-new-001'));
  check('ID allocator increments',()=>assert.equal(p.allocateMechanicalId(placed.scene,'ball'),'ball-new-002'));
  const hooks=[
    ['Scene store add', 'src/features/scene/store.ts', 'placeAt:'],
    ['Single placement action', 'src/features/scene/actions.ts','commitObjectPlacement'],
    ['Drop from 3D viewport', 'src/features/scene/PlacementController.tsx', "addEventListener('drop'"],
    ['Camera ray to ground', 'src/features/scene/PlacementController.tsx','raycaster.setFromCamera'],
    ['3D ghost', 'src/features/scene/PlacementController.tsx', 'meshStandardMaterial'],
    ['Library dragging', 'src/components/layout/ComponentLibrary.tsx', 'onDragStart'],
    ['Library click arm', 'src/components/layout/ComponentLibrary.tsx', 'startPlacement(kind)'],
    ['Escape cancellation', 'src/app/App.tsx', 'ui.cancelPlacement()'],
    ['Stage 5 selection still present', 'src/components/scene/StarterPhysicsWorld.tsx','setSelectedObjectId(object.id)'],
    ['Stage 5 delete dialog still present', 'src/app/App.tsx','<ConfirmDeleteDialog />'],
  ];
  for (const [label,file,term] of hooks) check(label,()=>assert.ok(readFileSync(file,'utf8').includes(term)));
  console.log(`PASS: ${count} isolated Stage 6 placement checks and strict TypeScript domain compilation.`);
} finally { rmSync(dir, { recursive:true, force:true }); }
