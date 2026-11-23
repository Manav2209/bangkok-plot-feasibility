import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
const server = await createServer({
  root: path.join(root, 'apps/web'),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const { calculate } = await server.ssrLoadModule(path.join(root, 'packages/engine/src/index.ts'));
  const { defaultScenario } = await server.ssrLoadModule(
    path.join(root, 'apps/web/src/scenario.ts'),
  );
  const { sources } = await server.ssrLoadModule(path.join(root, 'packages/rules/src/index.ts'));
  const { area, difference, intersection } = await server.ssrLoadModule(
    path.join(root, 'packages/geometry/src/index.ts'),
  );
  const z = JSON.parse(await readFile(path.join(root, 'apps/web/public/data/zone.geojson'), 'utf8'))
    .features[0].geometry.coordinates;
  const scenario = defaultScenario();
  const base = {
    revision: 1,
    geographicPlot: scenario.plot,
    use: scenario.use,
    assumptions: scenario.assumptions,
    roads: scenario.roads,
    frontage: scenario.frontage,
    researchConstraints: true,
    zone: {
      id: 'y7-21-2013',
      boundaryLonLat: [{ outer: z[0].slice(0, -1), holes: z.slice(1).map((r) => r.slice(0, -1)) }],
      evidence: 'verified',
      sourceUrl: 'https://cpudgiapp.bangkok.go.th',
      uncertaintyM: null,
      boundaryGuardM: 1,
    },
  };
  const declaredAccess = {
    ...structuredClone(base),
    revision: 2,
    assumptions: { ...base.assumptions, coreFraction: 0.2 },
    roads: base.roads.map((r) => ({ ...r, confirmed: true })),
    project: {
      residentialUnits: 50,
      residentialUnitsOver60M2: 0,
      parkingSpaces: 50,
      parkingLocation: 'within-building',
      accessRoadWidthM: 8,
      routeConnectedToPublicRoad: true,
      drivewayWidthM: 6,
      drivewayDirection: 'two-way',
      ramp: {
        kind: 'straight',
        horizontalRunM: 21.4,
        clearWidthM: 6,
        clearHeightM: 2.4,
        entranceOffsetM: 6,
      },
    },
  };
  const cases = [];
  for (const [name, input] of [
    ['illustrative-default', base],
    ['declared-access-study', declaredAccess],
  ]) {
    const result = calculate(input);
    assert.equal(result.zoneMembership, 'inside');
    if (name === 'illustrative-default')
      assert.equal(
        result.designs.length,
        2,
        'The illustrative baseline must retain two independently checked reference concepts.',
      );
    else {
      assert(
        result.designs.length >= 1,
        'The declared-access study must retain at least one model candidate.',
      );
      assert(
        result.designs.length + (result.rejectedCandidates?.length ?? 0) >= 2,
        'Both candidate approaches must be evaluated, including rejections.',
      );
    }
    const designs = [];
    for (const d of result.designs) {
      assert.equal(
        d.compliance,
        'unknown',
        'Missing parcel/legal evidence must prevent an overall legal pass.',
      );
      assert(
        Math.abs(d.grossFloorAreaM2 - d.floors.reduce((n, f) => n + area(f.polygons), 0)) < 0.001,
      );
      assert(d.checks.every((c) => c.scope !== 'assumption' || c.status !== 'fail'));
      for (const p of d.parking?.plans ?? []) {
        const floor = d.floors.find((f) => f.level === p.level);
        assert(floor);
        assert(
          area(difference([...p.stalls, ...p.aisles, ...p.serviceReserve], floor.polygons)) <= 0.01,
        );
        const ramp = d.parking?.ramp?.footprint ?? [];
        if (ramp.length) {
          assert(area(difference(ramp, p.serviceReserve)) <= 0.01);
          assert(area(intersection(ramp, [...p.stalls, ...p.aisles])) <= 0.01);
        }
      }
      designs.push({
        id: d.id,
        title: d.title,
        grossFloorAreaM2: d.grossFloorAreaM2,
        usableAreaM2: d.usableAreaM2,
        heightM: d.heightM,
        floors: d.floors.map((f) => ({ level: f.level, use: f.use, areaM2: f.areaM2 })),
        parking: {
          requiredSpaces: d.parking?.requiredSpaces,
          providedSpaces: d.parking?.providedSpaces,
          schematicSpaces: d.parking?.schematicSpaces,
          levels: d.parking?.plans?.map((p) => ({ level: p.level, stalls: p.stalls.length })),
          ramp: d.parking?.ramp,
        },
        legalCompliance: d.compliance,
        checks: d.checks,
      });
    }
    cases.push({
      name,
      input,
      result: {
        status: result.status,
        zoneMembership: result.zoneMembership,
        rulesetVersion: result.rulesetVersion,
        diagnostics: result.diagnostics,
        rejectedCandidates: result.rejectedCandidates ?? [],
        designs,
      },
    });
  }
  const report = {
    generatedAt: new Date().toISOString(),
    scope:
      'Illustrative geometry and declared design assumptions only. No vacancy, title, ROW, amendment completeness, vehicle swept path or legal feasibility certification.',
    verification:
      'Two candidate approaches independently re-evaluated in each case, including rejected alternatives. The baseline retains two reference concepts; the declared-access study may retain fewer. Polygon-derived floor totals, plan containment, ramp exclusion from stalls/aisles, no failed implemented assumption checks on accepted candidates and overall legal status remaining unknown are asserted.',
    sourceReferences: sources,
    cases,
  };
  const destination = path.join(root, 'docs/validation/design-review-05.json');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      valid: true,
      report: destination,
      cases: cases.map((c) => ({
        name: c.name,
        concepts: c.result.designs.map((d) => ({
          id: d.id,
          grossFloorAreaM2: d.grossFloorAreaM2,
          parking: d.parking.schematicSpaces,
          rampAreaM2: area(d.parking.ramp?.footprint ?? []),
          legalCompliance: d.legalCompliance,
        })),
      })),
    }),
  );
} finally {
  await server.close();
}
