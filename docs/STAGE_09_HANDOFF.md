# KineticLab Stage 9 — Collision System (NOT STARTED)

## Mandatory source and evidence

Continue from **KineticLab_Stage_08.zip**, v0.8.0, **only after** the full Mac Vitest, build, Rapier WASM smoke and Chrome acceptance tests pass. Use the actual extracted ZIP/repo; do not reconstruct or overwrite verified earlier stages. Preserve schema v1 and all Stage 1–8 editor functionality.

## Stage 9 scoped goals

1. Rich collision handling: collision filters/layers, optional sensors, meaningful contact outcomes and debug overlays.
2. Grounded and independently measured collision experiments (e.g., ball vs ramp/block) with clear event semantics; no invented force data.
3. Design-safe interactions with editing, undo/redo, deletion, placement, pause and restart.
4. Automated numerical/unit tests plus real Rapier WASM and Chrome interaction checks.
5. Complete Stage 9 ZIP, report and Stage 10 handoff only. **Do not start Stage 10.**

## Key source files

- `src/components/scene/StarterPhysicsWorld.tsx`
- `src/domain/physics-policy.ts`, `src/domain/contact-ledger.ts`
- `src/features/simulation/store.ts`
- `src/domain/registry.ts`, `src/domain/starter-scene.ts`
- `src/features/scene/store.ts`, `src/components/layout/Inspector.tsx`
- `scripts/physics-smoke.mjs`, `src/domain/contact-ledger.test.ts`

## Known boundary

Do not claim cross-platform deterministic Rapier results without using the appropriate deterministic WASM build and controlled timestep scheduling. Stage 8 only guarantees a consistent authored initial pose and an explicit timestep policy; the collision ledger is observational.
