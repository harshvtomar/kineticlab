# KineticLab publication checkpoint — 27 October 2026

Repository: https://github.com/harshvtomar/kineticlab

Source: `KineticLab_Stage_12_Fixed_v0.12.1.zip`, 130 files, version 0.12.1. This source archive contains no `.git` directory, so repository history starts at publication. Existing source, tests, lockfile, stage reports and handoffs are included; dependencies and generated builds are excluded.

## Changes for publication

- Replaced the stage-specific landing README with a project overview and reproducible clone/install instructions. Preserved the previous README as `STAGE_12_SOURCE_README.md`.
- Updated one stale catalog test to search for the current description text `adjustable slope` instead of removed text `energy-transfer`. Its expected result and description-search behavior are unchanged. No application functionality or physics parameters were changed.
- Added this checkpoint and resume bullets.

## Actual execution results

Environment: Linux, Node 24.22.1, npm 11.9.0.

- `npm ci --ignore-scripts --fetch-retries=0 --fetch-timeout=20000`: installed 169 packages. Lifecycle scripts were disabled for installation; the subsequent toolchain executed successfully.
- Initial `npm run check`: TypeScript passed; 384 tests passed and one failed because the catalog description no longer contained the historical search term.
- After the test correction, `npm run check` passed: full TypeScript compilation, 385/385 Vitest tests in 26 files, production build.
- All 15 declared `check:*` commands passed: structure; registry; selection; placement; transform; physics; collision; ramp; domino; lever; and the five associated real-WASM runtime smoke commands.
- Structure check: 54 required files and seven mandatory runtime dependencies found.
- Lever runtime: four load/pivot configurations and repeatability over 90 fixed steps passed.
- Archive path safety checked. Common private-key/cloud-token patterns were not found in the source; no private user paths or email addresses were found in the included Markdown setup and stage documentation. These scans are not a comprehensive security audit.

## Build output and remaining warnings

Vite 7.3.7 transformed 2,186 modules. Reported output:

| Output | Size | Gzip |
| --- | ---: | ---: |
| HTML | 0.67 kB | 0.40 kB |
| CSS | 31.40 kB | 7.86 kB |
| JavaScript | 3,567.52 kB | 1,204.50 kB |

The Vite warning about chunks over 500 kB remains. Rapier smoke scripts emit a deprecated initialization-parameter warning. npm emits an environment `http-proxy` configuration warning. None was suppressed.

## Verification boundaries

Full Stage 12 browser interaction acceptance remains pending. Automated results above do not establish viewport usability or live browser performance. Historical Mac evidence applies only to the specific stages described in the original reports. Hosted GitHub Actions CI and a deployed public website are not configured or claimed in this publication.

Use the repository on a resume as an actively developed Stage 12 simulation project. Do not describe the full 32-stage roadmap, persistent scene storage, or unimplemented catalog entries as completed features.
