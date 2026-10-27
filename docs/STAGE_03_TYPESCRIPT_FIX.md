# KineticLab Stage 3 — TypeScript shortcut fix

## Issue found on macOS (2026-10-26)

`npm run check` failed with `TS2363` in `src/features/workspace/shortcuts.ts` line 14. The Escape handler mistakenly used TypeScript union-type syntax (`|`) as an expression, attempting bitwise OR on strings.

## Fix

The Escape handler now correctly reads:

```ts
if (event.key === 'Escape') return 'escape';
```

The `EditorCommand` union type already enumerates all valid commands. No camera features or existing physics scene need to change.

The existing `src/features/workspace/shortcuts.test.ts` covers the Escape handler.

## Verify on Mac

```sh
cd ~/Downloads/kineticlab-stage-03
npm run check
npm run check:structure
```

The archive retains the complete Stage 3 source from the prior release plus the corrected line and this note. A standalone compiler syntax parse and isolated `shortcuts.ts` TypeScript typecheck passed in the packaging environment. **Full Vitest and Vite verification still require npm packages on your Mac**.
