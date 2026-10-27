# KineticLab Stage 12 — Mac Installation & Acceptance

## 1. Preserve and extract

Keep the Stage 11 ZIP unchanged. Download `KineticLab_Stage_12.zip` to Downloads and run:

```bash
cd ~/Downloads
unzip -o KineticLab_Stage_12_Fixed_v0.12.1.zip
cd kineticlab-stage-12
ls package.json
node --version
npm ci
```

Use Node 22.12 or newer; if `npm ci` fails, share the complete error message.

## 2. Run automated validation

Run each separately, stopping to capture errors:

```bash
npm run check
npm run check:structure
npm run check:lever
npm run check:lever-runtime
npm run check:domino
npm run check:domino-runtime
npm run check:ramp-runtime
npm run check:collision-runtime
npm run check:physics-runtime
```

`npm run check` runs the complete TypeScript, Vitest and Vite build pipeline. `check:lever` validates *formulas, bounds and geometry*, while `check:lever-runtime` runs actual Rapier WASM revolute-joint, gravity and fixed-step replay trials. The latter is not equivalent to a browser test.

Record exact test counts and results. Do **not** assume any Stage 11 results without running its smoke and browser checks on this Mac.

## 3. Run browser validation

```bash
npm run dev
```

Open the **exact** URL printed by Vite (older KineticLab servers may occupy other ports). In Chrome:

1. Confirm v0.12.0 loads and the original editable mechanical objects appear.
2. Open Inspector → World → **Open lever laboratory**; confirm beam, fulcrum and colored left/right loads are visible.
3. Set **Balanced**: beam should start approximately horizontal and stay near level (solver variation possible).
4. Set **Left heavy**: left end initially rotates downward; check measured angle increases toward positive values.
5. Set **Right heavy**: right end initially rotates downward; measured angle moves negative.
6. Change **Fulcrum offset** to positive: beam moves relative to the fixed pivot and torque prediction changes; verify no sudden explosion or NaN readings.
7. Adjust load masses and arm lengths; confirm torque and motion diagnostics update, preset changes reset measurements.
8. Verify Pause/Resume, Reset lever and Clear measurements work; reset restores starting pose.
9. Switch between Ramp, Domino and Lever labs and confirm they do not stay active simultaneously.
10. Return to editable scene and verify object placement, delete protection, transforms, Undo/Redo, camera views, collision modes/sensors and the original Ramp and Domino labs still function.

## 4. Completion criteria

Stage 12 is complete only when full npm checks, real hinge/WASM, inherited physics smoke checks, and browser acceptance are all recorded as passing. A failed step requires a code fix and rerun, not a success claim.

## Troubleshooting

- `ENOENT package.json`: `cd ~/Downloads/kineticlab-stage-12` first.
- `EADDRINUSE`: Vite may pick another port; use the URL it prints.
- `npm ci` networking failure: check connectivity and try again; do not delete `package-lock.json`.
- Browser seems to show Stage 11: confirm you are running `npm run dev` from the Stage 12 directory and Vite shows the latest package.
- Joint looks disconnected / beam does not move: save a browser screenshot, Terminal output, and the latest `check:lever-runtime` result.
