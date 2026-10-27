# KineticLab Stage 4 — Mechanical Object Architecture Handoff

**Continue from `KineticLab_Stage_03.zip` (v0.3.0) and only that source**, preserving the existing Rapier scene, Stage 2 interface and Stage 3 camera/navigation.

## Stage 4 objective

Introduce a typed, serializable **mechanical object registry** and scene-object architecture. This is an architecture stage: do not prematurely implement Stage 5 selection/deletion, Stage 6 drag/drop or Stage 7 editing.

### Proposed deliverables

- Define a stable unique ID, discriminated type (`ground`, `sphere`, `ramp`, `block`), transform (position, rotation, scale), geometry parameters, material and physics-body configuration for each component.
- Create safe starter object migration from `STARTER_OBJECTS` to the new registry without moving or changing the existing physics demo.
- Implement pure schema validation of transforms and duplicate IDs; reject NaN, invalid dimensions, unknown types, and unsupported properties.
- Add a registry with read-only selectors for the library and inspector; plan a single source of truth for rendering.
- Connect the starter scene through typed config. Preserve fixed and dynamic Rapier body behavior and stable resets.
- Add tests for migration, serialization, validation, registries, read-only selectors, and original collision fixture invariants.
- Keep the current camera Frame logic functional; optionally derive bounds from the registry after migration.
- Update user-facing version, architecture notes, tests, handoff and complete-source ZIP.

### Acceptance criteria

1. Original Stage 1–3 test suite continues to pass on the Mac.
2. The same four starter shapes and their rigid-body parameters appear in the 3D workspace.
3. Camera controls, preset transitions, grid and axes still operate correctly.
4. Component library search/filter and inspector work without regressions.
5. No drag-and-drop or object transform editor is claimed before Stages 6–7.
6. `npm run check` and `npm run check:structure` pass; browser checks must be independently recorded.

## Continuation prompt

> Start KineticLab Phase 1 Stage 4 — Mechanical Object Architecture. Continue from my complete `KineticLab_Stage_03.zip` (v0.3.0), not from memory and not as a new project. Inspect actual source, preserve Rapier simulation, all Stage 1–3 UI/camera functions and tests. Implement typed serializable registry, geometry/body descriptors, transform validation, migrated starter scene and new regression tests. Deliver the complete `KineticLab_Stage_04.zip`, completion report and Stage 5 handoff. Do not start Stage 5.
