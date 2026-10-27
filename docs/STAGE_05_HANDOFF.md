# KineticLab — Stage 5 Handoff (not started)

## Current checkpoint

- **Version:** `0.4.0`, Phase 1 Stage 4 — Mechanical Object Architecture.
- **Required source:** `KineticLab_Stage_04.zip` (complete source, not an isolated patch).
- **Original upstream:** `KineticLab_Stage_03_Fixed_v0.3.1.zip` with Escape shortcut correction.
- **Validation:** 30/30 independent domain checks and structure checks passed in authoring environment; full Vitest/build and Chrome verification must be confirmed on Mac before Stage 4 sign-off.

## Stage 5 — Object Selection and Deletion

1. Inspect **actual** v0.4.0 project source and tests. Request the ZIP if unavailable. Never recreate the app or lose prior modules.
2. Add pointer-based 3D object selection and synchronized inspector selection, with hit testing that does not interfere with camera orbit/pan. Provide visible selection highlighting.
3. Add **deliberate** user-controlled deletion with safeguards protecting required scene infrastructure (e.g. ground) and robust cleanup of related selection state and physics objects. Decide whether deletion operates in design mode (preferably simulation paused) and document it.
4. Maintain type safety and registry invariants; introduce controlled editing state only where necessary, without direct mutation of frozen snapshots.
5. Preserve original four objects on initial load and after a full scene reset; preserve Rapier gravity/collisions and physics restart.
6. Preserve all Stage 2 library/search/inspector UI and Stage 3 camera controls/keyboard shortcuts.
7. Expand Vitest coverage (selection, deletion, protected infrastructure, deselection, consistency, regression); run typecheck, tests, build, structure and browser checks as possible.
8. Deliver complete `KineticLab_Stage_05.zip`, report and Stage 6 handoff.

**Out of Stage 5 scope:** drag-and-drop placement (Stage 6), transform editing and undo/redo (Stage 7), new advanced mechanical bodies.

## Ready-to-paste prompt

Start KineticLab Phase 1 Stage 5 — 3D Object Selection and Deletion. Continue exclusively from my actual `KineticLab_Stage_04.zip` v0.4.0 source; if it is unavailable, request it rather than recreating the project. Stage 4 introduces an immutable typed versioned scene registry, preserving all four starter Rapier bodies and the prior UI/camera. Verify Stage 4 acceptance results first. Add 3D click selection, selection highlight, synced Inspector, safe object deletion and cleanup, protected infrastructure, appropriate keyboard accessibility and comprehensive regression tests, without implementing Stage 6 placement or Stage 7 editing. Preserve all physics, camera, toolbar, inspector, component library and shortcuts. Run available tests/build checks and deliver complete Stage 5 ZIP, report and Stage 6 handoff. Clearly distinguish tests run locally from tests pending on my Mac.
