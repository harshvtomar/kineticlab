# Stage 02 Handoff — Professional Interface

**Input:** `KineticLab_Stage_01.zip`, extracted into `kineticlab-stage-01/` or the source repo created from it.

**Purpose:** Refine the Stage 1 shell into a polished, accessible engineering-editor interface (toolbar, library sidebar, properties panel, simulation controls). Stage 1 deliberately provides a head start so Stage 2 can focus on detail, usability and responsive behavior.

## Non-negotiable carry-forward requirements

- Do not restart or rebuild from scratch.
- Preserve starter Rapier physics demo and working pause/resume, restart, grid, orbit/zoom controls.
- Do not portray future-stage library items as functional drag-and-drop objects.
- Keep the TS domain model independent from React and Rapier.
- Before editing, run `npm install` (if needed), `npm run typecheck`, `npm run test`, `npm run build`, and record real results.
- If the Stage 1 runtime checks fail on Mac, fix those failures before adding Stage 2 UI polish. No version bump without green checks.

## Stage 2 requested work

1. Review existing UI against desktop, laptop and 375px mobile layouts.
2. Improve component grouping, tooltips, visual hierarchy, keyboard focus and reduced-motion accessibility.
3. Separate reusable UI primitives from the large stylesheet; keep behavior stable.
4. Add appropriate UI tests to existing Vitest suite, and optional accessible component tests with Testing Library if installed.
5. Record the actual browser/manual smoke results; do not assert tests not run.
6. Deliver `KineticLab_Stage_02.zip`, an updated architecture document and a Stage 03 handoff.

**Stage 3 preview:** Camera / grid enhancements, orbit/zoom constraints, clipping and viewport ergonomics.

## Starter prompt for the next chat

> Continue KineticLab from the attached `KineticLab_Stage_01.zip`. This is Phase 1, Stage 2: Professional Interface. Inspect the actual source and the Stage 1 completion report first. Run its available checks, repair any failing or unverified prerequisites, then refine the React engineering editor UI for desktop and mobile while preserving all real 3D and physics behavior. Build, test, and package `KineticLab_Stage_02.zip` with a verified change report and a Stage 3 handoff. Do not restart or falsely claim a live deployment.
