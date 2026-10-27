# KineticLab Stage 10 — Balls and Ramps | Handoff, NOT STARTED

## Prerequisite
Complete Stage 9 Mac verification: full `npm run check`, `npm run check:collision`, `npm run check:collision-runtime`, existing `npm run check:physics-runtime`, structure and Chrome acceptance tests. Use the exact verified Stage 9 ZIP or published Git commit; do not reconstruct.

## Stage 9 contract to preserve
- Source of truth `src/domain/registry.ts`, scene schemaVersion 1, immutable scene snapshots.
- `src/domain/collision-system.ts`: group 0 static, group 1 balls, group 2 sensors; two-sided filters; standard vs separate-balls modes.
- `src/features/simulation/store.ts`: pause/restart, fixed timestep 1/60, bounded physical & sensor ledgers.
- `src/components/scene/StarterPhysicsWorld.tsx`: all real Rapier bodies; optional sensor fixture; no telemetry forces.
- All Stage 1–8 object/camera/selection/placement/edit/undo/redo behaviors.

## Scoped Stage 10 deliverable
Improve geometry/physics of spheres and inclined ramps; tunable slope within validated constraints, stable and measured roll/slide fixtures, physical friction/restitution checks, real WASM and Chrome demos. Add tests, full ZIP/report/Stage 11 handoff; DO NOT start dominoes or Stage 11.

## Risk items
Preserve body-ground collisions in every filter mode. Avoid assigning observed contact count to a force number. Runtime-only sensor fixture is not part of the user scene serialization. Do not claim all-platform deterministic rigid-body integration.
