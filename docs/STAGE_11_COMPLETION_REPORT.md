# KineticLab — Stage 11 Implementation Report

Version: v0.11.0  |  Stage: 11 of 32  |  Scope: Domino Physics

## Base and preservation

Started from the exact user-uploaded `KineticLab_Stage_10(1).zip`, rather than recreating the codebase. Existing registry schema v1, editor scene objects and Stage 1–10 core systems remain intact. This is an **opt-in, runtime-only** Rapier test bench, parallel to the Stage 10 ramp lab. Stage 12 has **not** been started.

## Implemented

- Stage 11 domino domain model: count (3–14), centre spacing (.22–.75 m), friction (.2–1.2), first impulse (.15–1.5 N·s), validated row geometry and IDs.
- Dedicated isolated Rapier rigid-body domino row, real gravity, ground contacts and cuboid colliders; no scripted neighbour tipping. A physical impulse near the first domino's top starts the sequence.
- Standard / Tight / Wide presets; Trigger, Reset, Pause and Resume. Parameter updates restart a clean row; returning to editor restores the original author-scene unchanged.
- Adjacent contact logging; 50° tilt threshold, per-domino toppling timeline, tipped count, run time, and a last-domino success indicator. Stalled sequences remain honestly classified as incomplete.
- Real Rapier WASM fixed-step smoke script (must be run on Mac after dependency installation), plus domain and Zustand state Vitest tests and independent strict-TS/offline verifier.

## Verification actually executed here

- `node scripts/verify-domino.mjs`: 26 checks, strict TypeScript compilation of domino domain, PASS.
- Original `verify-registry`, `verify-selection`, `verify-placement`, `verify-transform`, `verify-physics`, `verify-collision`, `verify-ramp`: PASS (30 + 27 + 58 + 39 + 29 + 21 + 29 = 233 inherited standalone checks).
- Original `verify-structure.mjs`: PASS (preexisting structure files present).
- All 66 TypeScript/TSX source files parsed with no syntax errors.
- Archive integrity and included file paths checked.

## Not verified here — must be run on Mac

- `npm ci` could not complete offline: local npm cache lacks a `zustand` package tarball.
- **Full project TypeScript compilation, Vitest regression suite, production Vite build, actual Rapier WASM domino smoke experiment, and Chrome interaction acceptance are PENDING.** Do not claim Stage 11 fully complete until they pass.
- Real chain propagation is sensitive to solver, geometry, initial impulse and spacing; baseline physics can fail even when the application runs. Tune and document if the actual trial shows unreliable propagation.

## Acceptance

1. Stage 11 page renders and Inspector > World > Open domino laboratory works.
2. Every preset can reset/rebuild the row, and the editor remains untouched when switching back.
3. Trigger first domino causes real motion; adjacent contact events and tip progress are visible.
4. Tight vs Wide produce potentially different real outcomes; do not fake successes.
5. Pause, Resume and Restart act safely; invalid parameters are rejected.
6. All earlier selection, placement, editing, collision, ramp, and camera controls remain functional.
7. All automated tests, build, standalone scripts and actual Rapier WASM tests pass on Mac.

## Known limitations

- This is a simplified cuboid rigid-body model, not a validated engineering prediction of domino waves.
- Elapsed time and tipping events are sampled from the rendering loop, not solver-fixed timestamps; the WASM smoke uses an exact simulation tick count.
- Same-machine fixed-step replay can be checked, but cross-device bitwise determinism is not guaranteed.
- Dominoes are a separate physics experiment, not yet selectable/serializable authored-scene primitives; those should not be claimed.
- Bundle-size optimization remains a later concern if Vite issues only a warning.
