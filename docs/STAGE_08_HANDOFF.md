# KineticLab Stage 8 handoff — Physics Integration/Hardening (not started)

**Start only after Stage 7 v0.7.0 passes full `npm run check`, `npm run check:structure`, `npm run check:registry`, `npm run check:selection`, `npm run check:placement`, `npm run check:transform`, and browser acceptance on Mac.**

## Mandatory continuation

- Use the exact full `KineticLab_Stage_07.zip` source. Never restart or recreate the application.
- Preserve the scene schema-v1 registry, four original objects, 3D camera, Stage 6 placement and Stage 7 transform/edit/undo/redo workflows.
- Stage 8: focus on explicit Rapier physics behavior, gravity controls only if within spec, rigid body simulation reset/determinism, collision handling, and regression tests. Do not jump into Stage 9 or advanced gear and pulley simulation.
- Ensure any physics configuration does not break the existing initial-pose transform commit model and pause-on-edit safety contract.
- Deliver a complete source ZIP, completion report, next-stage handoff, honest test evidence and exact Mac instructions.

## Critical files

- `src/domain/transforms.ts`, `src/domain/registry.ts`, `src/domain/placement.ts`, `src/domain/scene-edit.ts`
- `src/features/scene/store.ts`, `src/features/scene/editing-actions.ts`, `src/features/scene/TransformGizmo.tsx`
- `src/features/scene/PlacementController.tsx`, `src/features/simulation/store.ts`
- `src/components/scene/StarterPhysicsWorld.tsx`, `src/components/layout/ObjectTransformEditor.tsx`
- `src/app/App.tsx`, `src/features/workspace/store.ts`

**Stage 8 is not included in the Stage 7 deliverable.**
