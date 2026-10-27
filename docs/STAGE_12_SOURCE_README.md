# KineticLab — Stage 12: Levers & Seesaws

**Version:** 0.12.1 | React 19 · TypeScript · Vite · Three.js/R3F · Rapier · Zustand

Stage 12 extends the **actual Stage 11 v0.11.0 project**. The mechanical workbench, editable scene schema v1, collision filters, sensors, ramp laboratory and domino laboratory are kept. Stage 13 is not implemented.

## What is new

An opt-in, independent lever laboratory, available under **Inspector → World → Stage 12 · Lever & Seesaw → Open lever laboratory**:

- **Real revolute joint:** a fixed fulcrum at 1.75 m joins a rigid dynamic beam at a z-axis hinge (not CSS or scripted rotation).
- **Physical loads:** left/right weights use attached, mass-bearing Rapier colliders. Beam mass and pivot offset contribute to torque and inertia.
- **Adjustable experiments:** left/right mass, moment-arm distances, beam mass, fulcrum offset and angular damping.
- **Presets:** Balanced, Left heavy, Right heavy and Offset pivot.
- **Live diagnostics:** measured hinge angle and angular velocity from Rapier, renderer-sampled elapsed time, approximate gravity moments calculated separately from physical motion.
- **Reset and controls:** parameter changes and Reset lever rebuild the physics world. Pause/Resume are shared with the simulator. Leaving the lab returns to the previous editor scene unchanged.
- **Safety:** bounds and finite-value validation; stale measurements discarded across experiment resets; bounded telemetry log.

## Physical assumptions

- Units are meters, kilograms, seconds, newtons and N·m. Gravity is 9.81 m/s²; simulation time step is 1/60 s.
- The beam and both loads are **one connected rigid assembly** with three collider masses. This is an introductory class-1 lever demonstration, not two hanging loads on ropes.
- The theoretical torque shown on screen is a gravity-only reference around the pivot. It is not a direct measurement of joint reaction torque. It omits hinge friction, impact forces and other disturbances. Results can deviate due to dynamics, solver behavior and inertia.
- The angle and angular-velocity readings come from the simulated Rapier beam, sampled at render intervals, not exact physics-tick measurements. Repeatability smoke tests use fixed-step WASM simulations. Cross-device determinism is not guaranteed.
- The beam may rotate beyond horizontal and may contact the floor for some settings. No certified stress, fatigue or manufacturing validation is provided.

## Run

Use **Node 22.12+** and an installed npm CLI:

```bash
cd ~/Downloads
unzip -o KineticLab_Stage_12_Fixed_v0.12.1.zip
cd kineticlab-stage-12
npm ci
npm run check
npm run check:lever
npm run check:lever-runtime
npm run check:domino-runtime
npm run check:structure
npm run dev
```

Open the exact localhost address printed by Vite. See `MAC_SETUP.md` for acceptance checks and troubleshooting.

## Project hygiene

Stage 11 tests and code are included. The Stage 11 complete npm build, real-WASM domino experiment and browser acceptance were **not confirmed in the current conversation** before Stage 12 development; do not claim the previous stage passed merely because its files are preserved. Run regression checks on your Mac.

No gear geometry, pulley simulation or Stage 13 features have been added.

## Stage 12 TypeScript hotfix (v0.12.1)

- Remove the unused `DEFAULT_RAMP_PARAMETERS` import in `RampExperimentRig.tsx` (TS6133).
- Give the two Rapier hinge refs non-null compile-time types using `useRef<RapierRigidBody>(null!)`, while preserving the same initial runtime `null` and joint behavior.
- Refresh the visible header to Stage 12 and synchronize the package and lockfile versions.
- No physics equations, colliders, joint configurations, geometry, test logic, saved scene formats or previously completed feature behavior are changed by this hotfix.

Run `npm run check` and `npm run check:lever-runtime` on your Mac before sign-off. Full Vitest/Vite/browser checks remain pending in this packaging environment.
