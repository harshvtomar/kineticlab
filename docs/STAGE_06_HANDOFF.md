# KineticLab — Stage 6 handoff (PLANNING ONLY)

## Prerequisite

Stage 5 v0.5.0 must pass on the user's Mac: `npm run check`, `npm run check:structure`, `npm run check:registry`, `npm run check:selection`, plus browser click-to-select, confirmation/cancellation, protected-ground deletion rejection and previous physics/camera/UI regression checks.

## Next isolated task

**Phase 1, Stage 6 of 32 — Drag-and-drop component placement**.

1. Inspect the actual verified `KineticLab_Stage_05.zip` rather than rebuilding.
2. Build a placement mode and viewport pointer-to-ground raycasting with a preview/ghost for supported basic bodies. Do not silently claim advanced gears/pulleys/springs are physically implemented before their dedicated stages.
3. Add a typed safe ID allocator and descriptor templates accepted by current schema v1; preserve strict validation and immutability.
4. Ensure placing a new object is physics-safe: validated world position, no accidental deletion, collider generation, protected ground behavior, reset/restart semantics, and robust cancel flow.
5. Retain click-to-select, selected emissive highlight, Inspector list synchronization, Delete/Backspace confirmation, ground protection, keyboard focus safety and existing camera controls.
6. Test placement + deletion interplay, duplicate ID prevention, invalid positions and cancel/reload. Keep scene updates immutable.
7. Run tests/build when environment permits, deliver complete Stage 6 ZIP, completion report and Stage 7 handoff; disclose unsupported checks honestly.

## Non-goals

Stage 6 should not implement Stage 7 freeform transforms and undo/redo or Stage 8+ extra physics mechanisms. Ground remains an unremovable reference plane.

## Important source modules

- `src/domain/registry.ts`: schema v1 and validation.
- `src/domain/scene-edit.ts`: Stage 5 immutable removal policy.
- `src/features/scene/store.ts`, `src/features/scene/actions.ts`: active scene and safe deletion boundary.
- `src/features/workspace/store.ts`: selected ID and confirmation dialog state.
- `src/components/scene/StarterPhysicsWorld.tsx`: actual Rapier scene.
- `src/components/layout/Inspector.tsx`: registry-driven selection, properties, removal UI.
- `src/components/layout/ConfirmDeleteDialog.tsx`: accessible confirmation.

Stage 6 has **not started**.
