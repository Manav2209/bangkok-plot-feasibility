# Plot — Bangkok feasibility lab

A pnpm + Turborepo workspace for the Bangkok plot feasibility tool in [PLAN.md](PLAN.md).
The first milestone is a working **geometry preview**, not a completed compliance product.

## Run locally

Requires Node.js 22.12+ and pnpm 10.28.2.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://127.0.0.1:5173>. The browser needs WebGL2. No API keys are required for the default
coordinate-grid view. Optionally copy `apps/web/.env.example` to `apps/web/.env.local` and set
`VITE_MAP_STYLE_URL` to a licensed MapLibre style. Any Vite environment variable is public client
configuration; never place private credentials there. Restart the dev server after changing it.

## Workspace

- `apps/web`: React, Vite, MapLibre, Terra Draw, Three.js, calculation worker and UI.
- `packages/domain`: shared input, floor-geometry, result, rule and evidence contracts.
- `packages/geometry`: WGS84 / UTM47N projection, validation, area, offsets and polygon difference.
- `packages/rules`: versioned source register, design assumption and unresolved prerequisites.
- `packages/engine`: deterministic compact/stepped massing and shared accounting.
- `packages/typescript-config`: shared strict TypeScript settings.

Internal packages export TypeScript directly and are compiled by the consuming application.
Turborepo schedules and caches checks and production builds; `dev` remains persistent and uncached.

## Checks

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

`pnpm check` runs type checks, calculation tests and the production build sequentially.

Browser checks use Playwright:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

The browser suite starts Vite when needed and reuses a running local server. An existing compatible
Chromium executable can be supplied through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Playwright traces
and screenshots go into ignored `test-results/`.

## Current behavior

Draw or edit an arbitrary simple polygon, adjust the assumed uniform inset, floor count and
floor height, and compare compact and stepped concepts. The same floor polygons drive the mesh
and displayed areas. Upper floors can differ; their individual areas are summed. If the two
concepts coincide, only the distinct option is enabled. Invalid boundaries, invalid assumptions,
empty inset geometry and unknown prerequisites have explicit states.

Calculation runs in a worker with a 70 ms input debounce. Revision IDs prevent stale results
from replacing a newer input. Saving stores a versioned scenario in this browser only.

## Scope still open

The default plot is an **illustrative 2,500 m² L shape**, not a verified vacant parcel. The default
map is an explicitly labelled metric grid. Real neighbourhood context, authoritative zone
boundaries, verified vacancy and frontage evidence have not been assembled. The geographic
research window is an implementation scope limit, not a zoning boundary.

The inset and floors are user assumptions. No current legal ruleset has been established;
FAR, open-space definitions, permitted uses, road conditions, height restrictions, overlays,
parking, fire access, classification and review triggers remain unresolved. The interface
therefore never declares legal feasibility. Gross modelled area is not regulated FAR area.
The stepped generator is an early geometric experiment; usability/core/access/parking constraints
are not yet implemented. No public deployment or remote repository has been created.

See [the milestone record](docs/milestone-01.md), [geometry decisions](docs/geometry.md),
and [the source register](docs/research/source-register.md) for evidence and next steps.
