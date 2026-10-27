# KineticLab — Stage 7 handoff (PLANNING ONLY)

## Preconditions

Continue from the **actual full `KineticLab_Stage_06.zip` v0.6.0**, not the older Stage 5 archive. Stage 6 must first pass full Mac `npm run check`, `npm run check:structure`, `npm run check:registry`, `npm run check:selection`, `npm run check:placement`, and Chrome placement/camera/physics regression checks. If the Stage 6 source is missing, ask for its ZIP before coding.

## Next isolated task: Stage 7 — Object editing

- Integrate move/rotate/scale affordances with mouse and keyboard alternatives, keeping the ground protected.
- Validate transforms (finite, positive scale, sane range, collision integrity). Decide and document whether transforms are allowed while physics is running; prefer pause-and-commit at initial pose rather than editing live dynamic bodies unpredictably.
- Add duplicate, undo and redo over immutable schema-v1 scene snapshots with bounded history; preserve unique IDs and confirmed deletion rules.
- Recompute physics colliders safely after committed edits; undoing a deletion must restore the intended descriptor.
- Preserve Stage 6 placement, preview, raycast, IDs and quick-add, plus all stages 1–5 camera/selection/physics features.
- Add Vitest regression tests for all edit operations and 3D browser interaction checks.
- Deliver complete Stage 7 ZIP, completion report and Stage 8 handoff; do **not** start Stage 8.

## Relevant files

- `src/domain/registry.ts`: version-1 validated descriptors and serializer.
- `src/domain/placement.ts`: primitive placement policy.
- `src/domain/scene-edit.ts`: Stage 5 protected deletion policy.
- `src/features/scene/store.ts`, `src/features/scene/actions.ts`: scene mutation boundaries.
- `src/features/scene/PlacementController.tsx`: active Three.js ground-picking and ghost.
- `src/components/scene/StarterPhysicsWorld.tsx`: Rapier/visual scene.
- `src/features/workspace/store.ts`: selection, pending deletion, placement state.
- `src/components/layout/Inspector.tsx`: selected-object properties.

Stage 7 should not assume gear or pulley simulation is already available; those remain later stages.
