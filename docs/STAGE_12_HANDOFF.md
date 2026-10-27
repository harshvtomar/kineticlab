# KineticLab — Stage 12 Handoff (NOT STARTED)

## Required prerequisite

Run complete Stage 11 Mac acceptance first. Use the **exact Stage 11 source that passed on the Mac**, including any applied fixes, as the Stage 12 baseline. Record the Vitest count and actual Rapier WASM domino smoke results; preserve previous feature behavior.

## Preserve intact

- Mechanical-object scene registry/schema version 1; Stage 1–9 editor, placement, safe deletion, transforms, duplication, undo/redo, camera, collision groups, sensors, contact ledgers.
- Stage 10 isolated ramp dynamics lab and its controls.
- Stage 11 isolated domino physics lab, parameter validators, dynamic row, contact and toppling diagnostics, reset and fixed-step smoke test.

## Stage 12 target — Levers and Seesaws

Add an opt-in physical lever/seesaw bench using a real Rapier revolute joint and weight/fulcrum configurations. Include safe parameter constraints, torque/rotation observations, stable reset, automated joint tests, a real WASM smoke test, and Mac browser acceptance. Be explicit about simplified mechanical assumptions. Do not implement Stages 13+.

## Guardrail

Do not replace physics with a CSS/Three animation, rewrite the repository, or claim passing Mac tests without evidence. Deliver a full Stage 12 source ZIP, completion report and Stage 13 handoff only after implementing that stage.
