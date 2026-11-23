# Milestone 02 — rule evidence, independent review and shared scenarios

Completed first implementation increment on 22 November 2026. The full remaining-work
definition is in `remaining-work-spec.md`. This milestone does not complete the feasibility tool.

## Implemented

- Detailed specification covering legal/site evidence, geometry, frontages, height slices,
  accounting, design search, real context, UI, sharing, performance, verification and delivery.
- Versioned JSON ledger with 16 separate statutory/evidence conditions and three source records.
  Zod validation rejects broken source/dependency references, cycles, missing parameter units,
  nonfinite numbers and unsupported promotion of unverified rules. The root build validates the
  actual ledger before compiling the app.
- Pure evidence and numeric evaluators with dependency gates and exact unrounded comparisons.
  Unknown prerequisites cannot produce numeric passes. Historical candidate values remain
  hypotheses; no statutory rule has been promoted to implemented/verified.
- Independent checks on each generated design. The geometric inset assumption now measures
  actual floor area outside the chosen inset, with the documented 0.01 m² clipping tolerance.
  All statutory checks and each design's overall legal compliance remain unknown.
- Selected-design floor table with levels, elevations, individual polygon areas and total.
  Regulated floor area and permeable allocation are explicitly unknown; Thai equivalent area
  units are shown separately from statutory interpretations.
- Validated v2 scenario saving and shareable URL fragments; v1 browser saves migrate on load.
  Shared inputs override local state. Invalid/unsupported/oversized links restore the example
  with feedback. Clipboard failure opens an accessible manual-copy dialog.
- Rule details expose individual evidence/implementation status, interpretation, candidate
  clause/version, Thai excerpt, exceptions and direct source links.
- Configurable browser-test port to avoid interfering with an occupied development port.

## Research performed

Inspected the official historical regulation and district-map PDF and a BMA 2026 draft
consultation notice. See `research/legal-baseline.md` for the sources and unresolved decisions.
No exact supported zone polygon, real vacant default parcel, legal road width, current applicable
instrument chain or complete building-control interpretation was verified in this increment.

## Verification actually completed

- `pnpm check`: typecheck, 75 unit tests and production build passed.
- Unit breakdown: 20 geometry, 14 engine, 27 rule integrity/evaluation, 14 scenario tests.
- Root build validates the 16-rule, three-source JSON ledger before the web build.
- `pnpm format:check`: passed.
- `git diff --check`: passed.
- Playwright: all 12 browser tests passed in 1.6 minutes with installed Chromium, software
  graphics and port 5183. Includes sharing into a fresh context, manual clipboard fallback,
  clipboard success, malformed share state, floor totals, sources, draw/edit/reset, rapid inputs,
  local save/reload, invalid input and a 390 px viewport.

Windows sandbox browser attempts initially could not locate the matching bundled browser and
left local-server cleanup pending. The successful final run used the installed Chrome executable
through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, with normal host local-server access. Earlier failed
assertions targeted exact notification text and several identical hidden rule-detail paragraphs;
the final tests use the status role and the selected open rule. They do not weaken the scenario,
area or unknown-evidence assertions.

The production build continues to report chunks over 500 kB. No documented network load-time,
integrated-GPU frame-rate or 100-vertex end-to-end performance target is claimed. Software browser
checks establish behavior, not those hardware/network targets.

## Next implementation gates

1. Complete current legal applicability and verified site/zone/road evidence.
2. Implement frontages, sourced per-edge exclusions, height slices and real bundled context.
3. Implement regulated accounting and budget-driven search for independently feasible concepts.
4. Research office differences and finish rule-driven interactions and complete result states.
5. Measure/cancel/stress-test, verify production, publish and complete applicant-owned submission.

Nothing was published or submitted. No remote repository was created. Applicant history,
personal answers, raw transcripts and submission receipts were not invented.
