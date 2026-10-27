# Stage 11 handoff — DOMINO PHYSICS (NOT STARTED)

## Verified prerequisite

Stage 10 v0.10.0 must first pass full Mac `npm run check`, standalone verifiers, real Rapier ramp WASM smoke, and Chrome acceptance. Use the **exact Mac-verified Stage 10 source**, preserving any applied fixes.

## Immutable contracts

- Versioned registry and validated schema v1 in `src/domain/registry.ts`; no unsanctioned schema changes.
- Stage 4–7 placement, selection, deletion, transforms, duplication, undo/redo.
- Stage 8 Rapier 1/60 time step and bounded collision ledgers; Stage 9 group filtering and non-solid sensor events.
- Stage 10 separate opt-in ramp lab; never mutate source scene on experiment entry/exit. Retain Stage 10 presets and diagnostic semantics.

## Stage 11 only

Add repeatable domino rigid-body rows and collision propagation with adjustable spacing, finite tipping/impact constraints, collision transfer, robust reset, a fixed-step WASM smoke experiment and tested browser demonstration. Provide implementation, test coverage, ZIP, docs and Stage 12 handoff. Do not start Stage 12.
