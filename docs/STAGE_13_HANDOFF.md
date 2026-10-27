# KineticLab Stage 13 — Parametric Gear Geometry (NOT STARTED)

## Exact prerequisite

Proceed only after the user verifies Stage 12 on Mac: TypeScript, Vitest, Vite build, `check:lever-runtime`, prior domino/ramp/collision/physics WASM smoke tests and the Stage 12 Chrome browser checklist. Capture the **actual verified** Stage 12 Mac source (including any bug fixes) before starting Stage 13.

## Preserve without regression

- Scene schema v1, registry, authored editor, object placement and deletion protection, transforms, duplication, history, cameras.
- Collision modes, sensor diagnostics, fixed-step gravity/restarts.
- Stage 10 Ramp bench, Stage 11 Domino lab, Stage 12 true revolute-joint Lever/Seesaw laboratory.
- All tests and CLI verification scripts; do not remove older acceptance cases.

## Stage 13 intended scope

Introduce *parametric visual gear geometry* with adjustable radius, module/teeth count, width, axle placement and geometry validation; provide a preview and tests. Real gear-to-gear coupling dynamics are **Stage 14**, not Stage 13. Do not pretend decorative gear meshes enforce physical meshing.

## Required artifacts

Complete `KineticLab_Stage_13.zip`, completion report, macOS verification instructions, and Stage 14 handoff, with source and runtime checks clearly distinguished.
