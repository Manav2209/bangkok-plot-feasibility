# Milestone 01 — Turborepo and geometry preview

Started 22 November 2026 from the agreed PLAN.md. The user requested Turborepo and a local Git
commit. There was no existing source code or repository. This is a foundation milestone, not
completion of Phase A or the complete Phase B exit gate.

## Implemented

- pnpm workspace, Turborepo task graph, pinned dependencies/lockfile and strict shared TypeScript.
- Domain, geometry, rules and engine packages, plus the React/Vite browser app.
- Metric polygon validation, concave inset, hole/split preservation and common area accounting.
- Compact/stepped geometric experiments and a revision-tagged calculation worker.
- Editable/drawable plot, 2D/3D views, measured metrics, assumption controls, local scenario save,
  source drawer and explicit unknown legal prerequisites.
- No invented neighbourhood context and no unsupported legal pass.

## Validation

The automated calculation suite contains 20 geometry fixtures and 14 engine checks. Browser
checks exercise the sample, concept switch, rapid edits, concave drawing, undo/reset, persistence,
invalid-input recovery, source dialog and mobile overflow. See the command outputs for the
actual final result; this note does not substitute for running the checks.

Browser QA uses local Chromium with software graphics, which validates behavior and visible
geometry but cannot establish the integrated-GPU frame-rate target. Browser timings are not
claimed as laptop GPU benchmarks. Built assets are still relatively large; initial-load
performance has not been measured under a documented network condition.

## Still required for the planned first complete slice

Verified vacant plot and zone; at least one sourced applicable setback; a bounded real
neighbourhood extract; independent map/mesh scale/alignment acceptance against those features;
and deployment access. The current grid preview deliberately leaves these research gates open.

The assignment one-pager and personal answers remain applicant-authored. No application was
submitted, no public deployment was made and no remote repository was created in this milestone.
