import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const required = [
  'package.json', 'index.html', 'vite.config.ts', 'vitest.config.ts',
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'src/main.tsx', 'src/app/App.tsx', 'src/components/scene/StarterPhysicsWorld.tsx',
  'src/features/simulation/store.ts', 'src/domain/fixtures.ts',
  'src/domain/fixtures.test.ts', 'src/features/simulation/store.test.ts',
  'src/styles/global.css', 'public/favicon.svg',
  'README.md', 'MAC_SETUP.md', 'docs/STAGE_02_HANDOFF.md',
  'docs/STAGE_02_COMPLETION_REPORT.md', 'docs/STAGE_03_HANDOFF.md',
  'src/components/layout/EditorToolbar.tsx', 'src/components/layout/HelpDialog.tsx',
  'src/features/workspace/catalog.ts', 'src/features/workspace/catalog.test.ts',
  'src/features/workspace/store.ts', 'src/features/workspace/store.test.ts',
  'src/features/workspace/shortcuts.ts', 'src/features/workspace/shortcuts.test.ts',
  'src/components/layout/CameraToolbar.tsx',
  'src/features/camera/CameraRig.tsx', 'src/features/camera/store.ts',
  'src/features/camera/views.ts', 'src/features/camera/views.test.ts', 'src/features/camera/store.test.ts',
  'docs/STAGE_03_COMPLETION_REPORT.md', 'docs/STAGE_04_HANDOFF.md',
  'scripts/verify-registry.mjs', 'src/domain/registry.ts','src/domain/registry.test.ts',
  'src/domain/legacy-fixtures.ts', 'src/domain/starter-scene.ts', 'src/domain/starter-scene.test.ts',
  'docs/STAGE_04_COMPLETION_REPORT.md', 'docs/STAGE_05_HANDOFF.md',
  'docs/STAGE_05_COMPLETION_REPORT.md', 'docs/STAGE_06_HANDOFF.md',
  'src/domain/scene-edit.ts', 'src/domain/scene-edit.test.ts',
  'src/features/scene/store.ts', 'src/features/scene/store.test.ts',
  'src/features/scene/actions.ts','src/components/layout/ConfirmDeleteDialog.tsx',
  'scripts/verify-selection.mjs',
];

const missing = required.filter((path) => !existsSync(resolve(root, path)));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const registrySource = readFileSync(resolve(root, 'src/components/scene/StarterPhysicsWorld.tsx'), 'utf8');
const inspectorSource = readFileSync(resolve(root, 'src/components/layout/Inspector.tsx'), 'utf8');
const registryWiringErrors = [
  ...(!registrySource.includes('state.scene.objects') ? ['Stage 5 scene is not registry-driven'] : []),
  ...(!inspectorSource.includes('selectMechanicalObject(scene, selectedId)') ? ['Stage 5 Inspector is not registry-driven'] : []),
  ...(!registrySource.includes('onClick={choose}') ? ['3D scene selection wiring missing'] : []),
];
const expectedDeps = ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier', 'zustand'];
const missingDeps = expectedDeps.filter((dep) => !pkg.dependencies?.[dep]);
const errs = [...missing.map((p) => `Missing file: ${p}`), ...missingDeps.map((p) => `Missing package: ${p}`), ...registryWiringErrors];
if (errs.length) {
  for (const error of errs) console.error(`FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${required.length} project files found, ${expectedDeps.length} mandatory runtime dependencies declared.`);
}
