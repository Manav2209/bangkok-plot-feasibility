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
  const { referenceProfile } = await server.ssrLoadModule(
    path.join(root, 'packages/rules/src/index.ts'),
  );
  const { imageryStudy } = await server.ssrLoadModule(
    path.join(root, 'apps/web/src/imageryStudy.ts'),
  );
  const { area, difference, intersection, union, toMetric, toGeographic } =
    await server.ssrLoadModule(path.join(root, 'packages/geometry/src/index.ts'));
  const { demoRoad } = await server.ssrLoadModule(path.join(root, 'apps/web/src/demoSite.ts'));
  const { nearbyRoads } = await server.ssrLoadModule(path.join(root, 'apps/web/src/roads.ts'));
  const context = JSON.parse(
    await readFile(path.join(root, 'apps/web/public/data/context.geojson'), 'utf8'),
  );
  const mappedRoad = context.features.find((f) => f.properties.sourceId === demoRoad.sourceId);
  assert(mappedRoad);
  assert(
    mappedRoad.geometry.coordinates.some(
      (p, i, coordinates) =>
        JSON.stringify(p) === JSON.stringify(demoRoad.segment[0]) &&
        JSON.stringify(coordinates[i + 1]) === JSON.stringify(demoRoad.segment[1]),
    ),
  );
  const roadStart = toMetric(demoRoad.segment[0]),
    roadEnd = toMetric(demoRoad.segment[1]);
  const roadLength = Math.hypot(roadEnd[0] - roadStart[0], roadEnd[1] - roadStart[1]);
  const ux = (roadEnd[0] - roadStart[0]) / roadLength,
    uy = (roadEnd[1] - roadStart[1]) / roadLength;
  const roadDistance = (p) => -uy * (p[0] - roadStart[0]) + ux * (p[1] - roadStart[1]);
  const z = JSON.parse(await readFile(path.join(root, 'apps/web/public/data/zone.geojson'), 'utf8'))
    .features[0].geometry.coordinates;
  const scenario = defaultScenario();
  const demoMetric = [{ outer: scenario.plot.map(toMetric), holes: [] }];
  for (const feature of context.features) {
    if (feature.properties.kind !== 'building' || feature.geometry.type !== 'Polygon') continue;
    const coordinates = feature.geometry.coordinates;
    assert(
      area(
        intersection(demoMetric, [
          {
            outer: coordinates[0].map(toMetric),
            holes: coordinates.slice(1).map((ring) => ring.map(toMetric)),
          },
        ]),
      ) <= 0.01,
      'Keep the simple example clear of bundled building footprints.',
    );
  }
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
  const declaredCore = {
    ...structuredClone(base),
    roads: base.roads.map((r) => ({ ...r, confirmed: true })),
    project: {
      coreBasis: {
        wholeSiteAndBuildings: true,
        aggregationAccountedFor: true,
        allFloorsAndCoverCounted: true,
        publicRoadReferences: true,
        matchingHeightDatum: true,
      },
    },
  };
  for (const [name, input] of [
    ['illustrative-default', base],
    ['declared-core-rules', declaredCore],
    ['declared-access-study', declaredAccess],
    [
      'dated-unbuilt-ground-study',
      { ...base, revision: 3, geographicPlot: imageryStudy.plot, roads: [], frontage: [] },
    ],
  ]) {
    const result = calculate(input);
    assert.equal(result.zoneMembership, 'inside');
    if (
      name === 'illustrative-default' ||
      name === 'dated-unbuilt-ground-study' ||
      name === 'declared-core-rules'
    )
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
      for (const [index, floor] of d.floors.entries()) {
        assert.equal(floor.level, index + 1);
        assert(Math.abs(floor.baseM - index * input.assumptions.floorHeightM) < 1e-8);
        assert(Math.abs(floor.topM - (index + 1) * input.assumptions.floorHeightM) < 1e-8);
        assert(Math.abs(floor.areaM2 - area(floor.polygons)) < 1e-8);
        assert(area(difference(floor.polygons, result.plot)) <= 0.01);
        const overlapping = result.slices.filter(
          (slice) => slice.baseM < floor.topM && slice.topM > floor.baseM,
        );
        assert(overlapping.length > 0);
        for (const slice of overlapping)
          assert(area(difference(floor.polygons, slice.polygons)) <= 0.01);
      }
      const measuredArea = d.floors.reduce((sum, floor) => sum + area(floor.polygons), 0);
      const measuredCover = area(union(d.floors.flatMap((floor) => floor.polygons)));
      assert(Math.abs(d.footprintM2 - measuredCover) < 0.001);
      assert(Math.abs(d.uncoveredM2 - (result.plotAreaM2 - measuredCover)) < 0.001);
      assert(Math.abs(d.modelledFar - measuredArea / result.plotAreaM2) < 1e-8);
      assert.equal(d.heightM, Math.max(...d.floors.map((floor) => floor.topM)));
      const parkingArea = d.floors
        .filter((floor) => floor.use === 'parking')
        .reduce((sum, floor) => sum + area(floor.polygons), 0);
      const usable =
        (measuredArea - parkingArea) *
        (1 - (input.assumptions.coreFraction ?? referenceProfile.designDefaults.coreFraction));
      assert(Math.abs(d.usableAreaM2 - usable) < 0.001);
      let roadClearance;
      if (name === 'declared-core-rules') {
        assert.equal(d.coreAssessment.status, 'pass');
        assert.equal(d.coreAssessment.checks.length, 10);
        assert(d.coreAssessment.checks.every((c) => c.status === 'pass'));
        // Independent arithmetic: do not reuse the core evaluator's measurements.
        const total = d.floors.reduce((n, f) => n + area(f.polygons), 0);
        const uncovered = result.plotAreaM2 - area(union(d.floors.flatMap((f) => f.polygons)));
        assert(total <= 5 * result.plotAreaM2 + 0.01);
        assert(uncovered + 0.01 >= 0.06 * total);
        assert(uncovered + 0.01 >= 0.3 * result.plotAreaM2);
        assert(uncovered + 0.01 >= 0.3 * Math.max(...d.floors.map((f) => area(f.polygons))));
        assert.equal(d.coreAssessment.countedModelAreaM2, total);
        assert(Math.abs(d.coreAssessment.uncoveredModelAreaM2 - uncovered) < 0.01);
        const centrelineGapM = Math.min(
          ...d.floors.flatMap((f) => f.polygons.flatMap((p) => p.outer.map(roadDistance))),
        );
        const roadEdgeGapM = centrelineGapM - demoRoad.assumedWidthM / 2;
        assert(
          roadEdgeGapM >= input.assumptions.setbackM - 0.001,
          'Every floor must remain behind the chosen plot/road-edge buffer.',
        );
        assert(
          centrelineGapM >= 6 - 0.001,
          'The applicable reference 6 m centreline setback must also hold.',
        );
        for (const f of d.floors)
          for (const p of f.polygons)
            for (const point of p.outer) {
              const along = ux * (point[0] - roadStart[0]) + uy * (point[1] - roadStart[1]);
              assert(
                along >= 0 && along <= roadLength,
                'Do not extrapolate the frontage beyond the mapped straight segment.',
              );
              assert(f.topM <= 2 * (roadDistance(point) + demoRoad.assumedWidthM / 2) + 0.001);
            }
        const actualMapped = nearbyRoads(
          context,
          d.coveredGround[0].outer.map(toGeographic),
          6,
        ).find((road) => road.id === demoRoad.sourceId);
        assert(
          actualMapped &&
            actualMapped.distanceM >=
              input.assumptions.setbackM + demoRoad.assumedWidthM / 2 - 0.001,
        );
        roadClearance = {
          assumedRowWidthM: demoRoad.assumedWidthM,
          roadEdgeGapM,
          centrelineGapM,
          mappedCentrelineGapM: actualMapped.distanceM,
          surveyedRoadBoundary: false,
        };
      }
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
        coreAssessment: d.coreAssessment,
        roadClearance,
        checks: d.checks,
      });
    }
    cases.push({
      name,
      input,
      result: {
        status: result.status,
        plotAreaM2: result.plotAreaM2,
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
  const destination = path.join(root, 'test-results/design-review-07.json');
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
