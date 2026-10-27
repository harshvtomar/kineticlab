# KineticLab Stage 8 — Physics Integration and Hardening

**Source lineage:** exact `KineticLab_Stage_07.zip`, version v0.7.0 (user-signed-off) → complete v0.8.0 working tree. **Stage 9 not started.**

## Implemented

1. Explicit gravity `[0,-9.81,0]` and fixed `1/60` simulation timestep on the existing Rapier `<Physics key={resetEpoch}>` boundary.
2. Immutable physics descriptors with preserved dynamic friction, restitution, CCD and damping and documented Rapier fixed-body defaults.
3. Two-way Rapier collision contact callbacks for dynamic rigid bodies, stable `userData` identifiers, deduplication, invalid-event protection, and stale-epoch event rejection.
4. Per-run bounded contact ledger (counts, active pairs, last 20 events); contact history can be cleared without changing physics, while Restart and edited-scene remount reset it.
5. Inspector World diagnostics, visible timestep and latest contact events.
6. Real Rapier 0.19.2 WASM gravity/collision/replay smoke script as separate Mac acceptance check.
7. Added automated tests for pure physics policy, collision ledger, and simulation-store life cycle; preserved all older tests and editing source.

## Executed in authoring environment

- `node scripts/verify-physics.mjs`: **29/29** domain and source integration assertions, with strict TypeScript compilation of dependency-free policy and ledger files.
- `node scripts/verify-registry.mjs`: **30/30**.
- `node scripts/verify-selection.mjs`: **27/27**.
- `node scripts/verify-placement.mjs`: **58/58**.
- `node scripts/verify-transform.mjs`: **39/39**.
- `node scripts/verify-structure.mjs`: **passed** (54 required files and 7 runtime dependencies checked by that script).
- TypeScript/TSX **syntax transpilation**: **51 files, zero syntactic diagnostics**.

These are standalone and syntactic checks. They do **not** substitute for the full React application typecheck, Vitest execution, physics WASM smoke test, or browser QA.

## Pending / NOT claimed as passed

- `npm install` could not finish in the authoring environment (npm registry access timed out).
- `npm run check`: full TypeScript, all Vitest tests, and production Vite build — **PENDING on Mac**.
- `npm run check:physics-runtime`: real Rapier WASM falling-ball, ground-collision and same-runtime replay — **PENDING on Mac**.
- Live browser: collisions, reset repeatability, World Inspector diagnostics, performance and all Stage 1–7 regression behavior — **PENDING on Mac**.

## Known limits and design choices

This is a deterministic-**step-size** simulation, **not** proof of bitwise deterministic outputs across hardware/browser builds. At 60 Hz, varying frame scheduling and engine versions can affect results. Contact telemetry tracks begin/end events but does not measure forces. The current mechanical system does not yet simulate advanced gear teeth or ropes. No scene-schema version change was necessary. Editing continues to commit only validated initial poses, rebuilding physics paused to avoid teleportation artifacts.

## Stage 8 acceptance gate

Mark Stage 8 complete only after full Mac commands pass and all steps in `MAC_SETUP.md` work in Chrome. Save that screenshot/result as a verification checkpoint before proceeding to Stage 9.
