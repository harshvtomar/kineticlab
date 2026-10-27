# KineticLab Stage 3 Handoff — 3D Workspace, Camera & Viewport Ergonomics

## Continue, don't rebuild

Use the complete `KineticLab_Stage_02.zip` and inspect `src/components/scene/StarterPhysicsWorld.tsx`, `src/app/App.tsx`, `src/features/simulation/store.ts`, `src/features/workspace/store.ts` and the latest completion report.

## Verify prerequisites

1. `npm install` (if needed), `npm run check:structure`, `npm run check`.
2. Visit the exact Local URL printed by Vite (preferred `5180`, auto-fallback enabled).
3. Verify 3D sphere physics, Pause/Resume, Restart and Grid; search library; toggle drawers; inspect objects; open help.
4. Record what was and was not independently verified.

## Stage 3 scope

- Improve WebGL viewport presentation and framing without changing physical fixture positions or collider semantics.
- Add explicit, functional **Reset camera**, perspective view control and an appropriate lightweight axes/grid reference with clear units.
- Improve orbit/zoom constraints and touch-device camera interactions; avoid accidental scroll capture where practical.
- Account for narrow viewport, device-pixel-ratio and reduced-motion/performance needs.
- Verify camera operations do not restart the physics simulation or break Stage 2 keyboard shortcuts.
- Add relevant tests and real-browser smoke steps; preserve all current tests, and produce Stage 3 full-source ZIP, completion report and Stage 4 handoff.

## Out of scope

- No drag-and-drop placement before Stage 6, no live object selection before Stage 5, no physics feature expansion, no premature gear/rope modeling.
- Never replace Rapier simulation with visual-only animations.

## Suggested next-chat prompt

> Continue KineticLab Phase 1 Stage 3 from the attached Stage 2 ZIP. Inspect source and run existing checks first. Implement real camera reset/view controls, reliable viewport ergonomics, orbit/zoom constraints, grid/axes improvements and responsive WebGL performance tuning without altering the functioning Rapier smoke scene, Stage 1 physics controls or Stage 2 editor UI. Add regression tests, build and verify as much as tools allow. Produce KineticLab_Stage_03.zip, a truthful completion report and Stage 4 handoff. If dependencies or the source are unavailable, document rather than fabricate verification.
