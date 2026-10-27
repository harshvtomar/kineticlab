# KineticLab — Stage 4 Completion Report

**Version:** 0.4.0  
**Date:** 2026-10-26  
**Status:** Implemented and packaged; full npm and Chrome verification **pending on user's Mac**.

## Source provenance

- Started from `/mnt/data/KineticLab_Stage_03_Fixed_v0.3.1.zip` (corrected original Stage 3 source; not a reconstructed scaffold).
- Retained existing React/R3F/Rapier/Zustand structure, camera rigs, toolbar, library, inspector, simulation store, original test files and all prior docs.
- Applied Stage 4 as additive domain modules and small scene/inspector wiring changes.
- Preserved the fixed Escape shortcut correction from v0.3.1.

## Delivered

1. `src/domain/registry.ts`: strict discriminated object types, versioned scene, transforms, kind-checked geometry and physics, pure validation, immutable snapshots, JSON roundtrip, and read-only selectors.
2. `src/domain/legacy-fixtures.ts` and `src/domain/starter-scene.ts`: mapping of original four starter objects into normalized registry descriptors.
3. `src/domain/fixtures.ts`: compatibility facade generated from the registry so camera/tests keep using their original API.
4. `StarterPhysicsWorld.tsx`: registry-driven Rapier rendering (fixed ground/ramp/stopper and dynamic sphere), including original mesh material, dimensions, 0.2-radian ramp angle, sphere restitution/friction/damping/CCD, gravity and restart behavior.
5. `Inspector.tsx`: registry-backed read-only selector/list with all four stable identifiers.
6. Additional Vitest coverage: `src/domain/registry.test.ts` and `src/domain/starter-scene.test.ts` for validation, migration, serialization, immutability, selectors and physics invariants.
7. Offline `scripts/verify-registry.mjs` compiling the domain with strict TypeScript and executing 30 independent assertions.
8. Extended `check:structure`, updated package version, Mac instructions and Stage 5 handoff.

## Expected canonical rigid bodies

| ID | Kind | Position (m) | Rotation (radians) | Rapier body/collider |
|---|---|---|---|---|
| ground-01 | ground | [0,-0.2,0] | [0,0,0] | fixed/cuboid |
| ramp-01 | ramp | [0,1.15,0] | [0,0,-0.2] | fixed/cuboid |
| ball-01 | ball | [-1.65,2.7,0] | [0,0,0] | dynamic/ball |
| stopper-01 | stopper | [3,0.42,0] | [0,0,0] | fixed/cuboid |

Sphere radius 0.34 m; friction 0.55; restitution 0.35; linear damping 0.06; angular damping 0.04; CCD on; sleep disabled. Gravity `[0,-9.81,0]` m/s². The Rapier Physics parent still remounts on reset epoch.

## Verification

| Check | Stage 4 outcome |
|---|---|
| Corrected Stage 3 source available and inspected | PASS |
| Isolated strict TypeScript compile (registry and fixtures) | PASS |
| Isolated registry/migration tests | PASS, 30/30 |
| Structure and wiring validation | PASS |
| TS/TSX syntax parsing | PASS, 32 TypeScript/TSX project files |
| Full Vitest suite (57 historic plus new Stage 4 cases) | PENDING Mac (`npm run check`) |
| Full TypeScript app compile + Vite production build | PENDING Mac (`npm run check`) |
| Rapier/WebGL visual regression in Chrome | PENDING Mac |
| Public deployment | NOT IN SCOPE |

An attempt to install npm packages in the authoring sandbox was blocked/time-limited by registry access, so no claim is made that the full Vite/Vitest suite ran here. The full sign-off must rely on your Mac's actual output. Prior Stage 3 tests passed on your Mac but are not automatically evidence of passing Stage 4 code.

**Scope exclusions:** no picking/deletion, drag-and-drop, geometry editing, user import interface, or new mechanical elements. Stage 5 may implement object selection/deletion after this checkpoint passes.
