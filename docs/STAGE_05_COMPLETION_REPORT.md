# KineticLab — Stage 5 implementation and verification report

Version: **v0.5.0**. Phase 1 · Stage 5 of 32. Source: exact `KineticLab_Stage_04.zip`, whose final Mac acceptance was explicitly confirmed: **146/146 tests**, 9/9 test files, **30/30 isolated registry checks**, successful TypeScript/Vite build and all previous UI/camera browser regressions.

## Stage boundary

This stage implements **object selection and deletion only**. It does not implement component placement, transform editing, drag-and-drop, undo/redo or new mechanical mechanisms. The core rigid-body geometry, gravity, camera, UI navigation, and schema v1 remain unchanged.

## Implemented

1. **3D selection**: clicking any existing rigid-body mesh selects it. Clicking a blank canvas region clears selection. Selection is also accessible in the Inspector list for keyboard users.
2. **Single source of truth**: scene descriptors are stored as immutable Stage 4 registry snapshots in `src/features/scene/store.ts`. Both the Rapier renderer and Inspector use that active scene; legacy snapshot and Stage 4 schema remain unchanged.
3. **Selection highlight**: selected meshes receive an emissive material tint (no added geometry or extra collider); Inspector and toolbar reflect the same object ID.
4. **Safe deletion workflow**: non-ground objects can be armed via Inspector, toolbar, or Delete/Backspace; a modal confirmation is required before removal. Cancel/Escape does not mutate the scene.
5. **Protected anchor**: ground plane cannot be deleted, even via the scene-store API. Missing/stale IDs are no-ops. A confirmed deletion revalidates/freeze-clones the scene, clears the selection if applicable, and restarts the Rapier physics world so no ghost collider remains.
6. **Help, version and UX**: instructions, toolbar status, top-bar version, message banner, accessible dialogs, mobile styling and Mac guide updated for Stage 5.
7. **Regression tests**: `scene-edit.test.ts` and `scene/store.test.ts` cover mutation policy, immutable snapshots, JSON roundtrip, physics reset on successful deletion only, stale IDs and cancellation. Two keyboard shortcut test cases added to the original suite.

## Checks actually executed in this authoring environment

| Check | Actual result |
| --- | --- |
| Original Stage 4 source extracted | Passed |
| Existing Stage 4 `npm run check:registry` | **30/30 passed** (strict domain TypeScript) |
| New `npm run check:selection` | **27/27 passed** (strict domain TypeScript and source-wire checks) |
| Project structure | **Passed**: 54 mandatory project files and 7 mandatory runtime dependencies |
| TypeScript/TSX syntactic scan | **Passed**: 36 files parsed with zero syntax errors |
| Full React TypeScript build (`tsc -b`) | **Pending on Mac**; npm dependencies unavailable in this runtime |
| Full Vitest suite (`npm run test`) | **Pending on Mac** |
| Vite production bundle (`npm run build`) | **Pending on Mac** |
| Real Chrome canvas click / deletion interaction | **Pending on Mac** |

Any Vitest case counts in `*.test.ts` are **authored cases, not executed Vitest cases** until Mac verification. Do not call Stage 5 fully runtime-verified yet.

## Expected Mac acceptance

Run `npm install` (if needed), `npm run check`, `npm run check:structure`, `npm run check:registry`, `npm run check:selection`, and `npm run dev`. All must exit successfully. Verify selected mesh changes color and Inspector selection updates; cancellation keeps objects; ground deletion is unavailable; confirmed removal decreases object count and removes collider; Restart, camera, grid, search, and panels still work. Reloading restores the canonical starter scene (no persistent save in Stage 5).

## Known limitations / warnings

- Physics scene editing is intentionally ephemeral; persistent save/load comes in Stage 25.
- This stage allows removing original ramp, ball or impact block. No manual scene restore button beyond reloading yet; reload refreshes from immutable startup data.
- Canvas selections can be more difficult while the dynamic ball is moving; the Inspector list is a reliable keyboard-accessible alternative.
- The Stage 4 >500 KB JS chunk warning may remain; later performance work will address it.
- No new 3D objects can be created until Stage 6.

## Handoff

Use **KineticLab_Stage_05.zip** as the source of truth; continue Stage 6 only after Mac verification. Read `docs/STAGE_06_HANDOFF.md`. Preserve all Stage 1–5 features and existing test contracts.
