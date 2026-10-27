# KineticLab — Interactive 3D Mechanics Laboratory

Explore mechanics through a browser-based 3D workbench with editable scenes, rigid-body physics and interactive experiments in ramps, dominoes, levers and seesaws.

**Author:** Harsh Vardhan Tomar · **Version:** 0.12.1 · **Development checkpoint:** Stage 12 of 32

Construct and edit a scene, run a Rapier physics simulation, adjust experiment parameters and inspect motion. KineticLab is an educational simulation project under active development, not a certified engineering analysis tool.

## Implemented features

- **3D workbench:** orbit and preset cameras, grid, axes, searchable component catalog and object inspection.
- **Scene editing:** placement of supported objects, selection, confirmed deletion, translation, rotation, scaling, duplication and bounded undo/redo.
- **Rigid-body physics:** gravity, colliders, pause/resume/reset, collision filters, non-solid sensor zones and contact event histories.
- **Ramp experiments:** adjustable slope, friction and restitution with motion diagnostics.
- **Domino experiments:** physical impulse-driven chains, adjustable spacing and count, contact logging and toppling progress.
- **Levers and seesaws:** a real Rapier revolute joint, adjustable loads and moment arms, pivot offset, damping, measured angle and angular velocity, and idealized gravity-torque calculations.
- **Validation:** immutable scene data, bounds and finite-value checks, ground protection and rejection of invalid initial placements/transforms.

Catalog previews include future components. Gears, springs and later planned stages are not implemented as working experiments in this version.

## Technology

React 19 · TypeScript · Vite · Three.js · React Three Fiber · Drei · Rapier/WebAssembly · Zustand · Vitest

## Run locally

Requires Node.js **22.12 or later** and npm.

```bash
git clone https://github.com/harshvtomar/kineticlab.git
cd kineticlab
npm ci
npm run check
npm run dev
```

Open the local address printed by Vite. Experiment controls are available through **Inspector → World**. See [Mac setup and browser checklist](MAC_SETUP.md).

## Verification

Publication checks executed on 27 October 2026 with Node 24.22.1:

| Check | Result |
| --- | --- |
| TypeScript project compilation | Passed |
| Vitest | 385 tests passed across 26 files |
| Vite production build | Passed; large bundle warning remains |
| Standalone domain and structure checks | All 10 commands passed |
| Real Rapier WASM smoke checks | All 5 commands passed: physics, collisions, ramps, dominoes and levers |
| Full Stage 12 interactive browser acceptance | Pending |
| Hosted CI and public application deployment | Not configured in this publication |

Run the runtime checks with `npm run check:physics-runtime`, `npm run check:collision-runtime`, `npm run check:ramp-runtime`, `npm run check:domino-runtime` and `npm run check:lever-runtime`.

See [publication evidence and limitations](docs/PUBLICATION_STATUS.md). Earlier stage reports are historical records; the publication report supplies the latest automated verification.

## Architecture

- `src/domain/`: scene schema, validation and pure mechanics calculations.
- `src/features/`: scene, camera, workspace and simulation state/actions.
- `src/components/scene/`: rendered geometry and Rapier experiment rigs.
- `src/components/layout/`: workbench controls, inspectors and experiment panels.
- `scripts/`: standalone checks and actual WASM physics smoke tests.

Rapier owns simulated body motion. Zustand coordinates editor state, parameters and telemetry. Experiment laboratories run separately from the authored editor scene.

## Scope and limitations

Stage 12 is implemented, while subsequent roadmap stages remain future work. Persistent user scene saving/loading is not delivered. Simulations use simplified rigid bodies and are not validated predictions of real machinery. Lever torque is an idealized gravity reference, not a measured joint reaction torque. Render-sampled telemetry and fixed-step smoke tests have different timing; cross-device bitwise determinism is not guaranteed.

The current JavaScript production chunk is approximately 3.57 MB before gzip; code splitting and performance optimization remain future work. No physical machinery is controlled.

## Portfolio

This project demonstrates mechanical modelling, interactive 3D development, typed state management and automated verification. See [resume bullets](docs/RESUME_BULLETS.md) and the [preserved Stage 12 technical notes](docs/STAGE_12_SOURCE_README.md).

