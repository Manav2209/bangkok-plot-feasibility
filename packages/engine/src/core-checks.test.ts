import { describe, expect, it } from 'vitest';
import type { FloorGeometry, Point, SiteInput } from '@bangkok/domain';
import { area, toGeographic } from '@bangkok/geometry';
import { assessCoreModel } from './core-checks';

// Synthetic metric fixtures test arithmetic independently of the government zone dataset.
const rectangle = (x: number, y: number, width: number, depth: number): Point[] => [
  [x, y],
  [x + width, y],
  [x + width, y + depth],
  [x, y + depth],
];
function site(width = 50, depth = 50): SiteInput {
  const plot = rectangle(0, 0, width, depth).map(toGeographic);
  return {
    revision: 1,
    geographicPlot: plot,
    use: 'condominium',
    assumptions: { floors: 6, floorHeightM: 3.2, setbackM: 3 },
    zone: {
      id: 'y7-21-2013',
      evidence: 'verified',
      boundaryLonLat: [],
      sourceUrl: 'https://example.com/test-fixture',
      uncertaintyM: null,
    },
    roads: [
      {
        id: 'road',
        name: 'Synthetic public ROW',
        geometry: [plot[0], plot[1]],
        widthM: 8,
        widthProvenance: 'user',
        confirmed: true,
      },
    ],
    frontage: [{ edgeIndex: 0, roadId: 'road' }],
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
}
function floor(ring = rectangle(3, 3, 20, 20), level = 1, topM = 3.2): FloorGeometry {
  const polygons = [{ outer: ring, holes: [] }];
  return { level, topM, baseM: topM - 3.2, polygons, areaM2: area(polygons) };
}
const check = (input: SiteInput, floors: FloorGeometry[], id: string, parking = 0) =>
  assessCoreModel(input, floors, 'inside', parking).checks.find((c) => c.id === id)!;

describe('clause-backed conditional core assessment', () => {
  it('passes ten independent checks for a completely declared model without title or vacancy evidence', () => {
    const assessment = assessCoreModel(
      site(),
      Array.from({ length: 6 }, (_, i) => floor(undefined, i + 1, (i + 1) * 3.2)),
      'inside',
    );
    expect(assessment.status).toBe('pass');
    expect(assessment.checks).toHaveLength(10);
    expect(assessment.countedModelAreaM2).toBe(2400);
    expect(assessment.uncoveredModelAreaM2).toBeCloseTo(2100, 2);
    expect(assessment.checks.every((c) => c.scope === 'core-model' && c.sourceIds.length > 0)).toBe(
      true,
    );
  });
  it('requires all three counting/site declarations and sourced zone membership', () => {
    for (const key of [
      'wholeSiteAndBuildings',
      'aggregationAccountedFor',
      'allFloorsAndCoverCounted',
    ] as const) {
      const input = site();
      input.project!.coreBasis![key] = false;
      expect(
        assessCoreModel(input, [floor()], 'inside').checks.every((c) => c.status === 'unknown'),
      ).toBe(true);
    }
    const input = site();
    delete input.project;
    expect(assessCoreModel(input, [floor()], 'inside').status).toBe('unknown');
    for (const membership of ['outside', 'crossing', undefined])
      expect(assessCoreModel(site(), [floor()], membership).status).toBe('unknown');
    const wrongZone = site();
    wrongZone.zone!.evidence = 'illustrative';
    expect(assessCoreModel(wrongZone, [floor()], 'inside').status).toBe('unknown');
  });
  it.each([
    [4.999, 'pass'],
    [5, 'pass'],
    [5.001, 'fail'],
  ])('checks FAR %s without trusting cached floor area', (ratio, expected) => {
    const input = site(10, 10);
    const floors = Array.from({ length: 6 }, (_, i) =>
      floor(rectangle(0, 0, 10, (Number(ratio) * 10) / 6), i + 1, (i + 1) * 3.2),
    );
    floors[0].areaM2 = 0;
    expect(check(input, floors, 'core-far').status).toBe(expected);
    expect(check(input, floors, 'core-far').actual).toBeCloseTo(Number(ratio) * 100, 2);
  });
  it.each([
    [700, 'fail', 'pass'],
    [750, 'pass', 'pass'],
  ])(
    'keeps plot and largest-floor open-space denominators distinct at %s m²',
    (open, bma, national) => {
      const f = floor(rectangle(0, 0, 50, (2500 - Number(open)) / 50));
      expect(check(site(), [f], 'core-uncovered-bma').status).toBe(bma);
      expect(check(site(), [f], 'core-uncovered-national').status).toBe(national);
      expect(check(site(), [f], 'core-uncovered-national').required).toBeCloseTo(
        (2500 - Number(open)) * 0.3,
      );
    },
  );
  it.each([
    [0.0599, 'fail'],
    [0.06, 'pass'],
    [0.0601, 'pass'],
  ])('checks OSR at %s using union cover and every counted floor', (osr, expected) => {
    const covered = 1000 / (1 + Number(osr) * 6);
    const floors = Array.from({ length: 6 }, (_, i) =>
      floor(rectangle(0, 0, 20, covered / 20), i + 1, 3 * (i + 1)),
    );
    expect(check(site(20, 50), floors, 'core-osr').status).toBe(expected);
  });
  it('does not allocate the same uncovered space to planting and ground parking', () => {
    const input = site();
    input.assumptions.permeableFraction = 0.5;
    expect(check(input, [floor()], 'core-planting', 1050).status).toBe('pass');
    expect(check(input, [floor()], 'core-planting', 1051).status).toBe('fail');
    input.assumptions.permeableFraction = 0.49;
    expect(check(input, [floor()], 'core-planting').status).toBe('fail');
  });
  it('applies the whole-building height tier to lower floors and the Bangkok third-floor tier', () => {
    const low = floor(rectangle(2, 2, 20, 20), 1, 3);
    expect(check(site(), [low], 'core-boundary').status).toBe('pass');
    expect(check(site(), [low, floor(undefined, 2, 12)], 'core-boundary').status).toBe('fail');
    expect(check(site(), [floor(rectangle(2, 2, 20, 20), 3, 9)], 'core-boundary').status).toBe(
      'fail',
    );
    expect(check(site(), [floor(undefined, 3, 9)], 'core-boundary').status).toBe('pass');
    expect(check(site(), [floor(rectangle(-1, 3, 10, 10))], 'core-boundary').status).toBe('fail');
  });
  it('checks the independent 15 m all-around tier', () => {
    expect(check(site(), [floor(rectangle(1, 1, 20, 20), 1, 15)], 'core-around').status).toBe(
      'pass',
    );
    expect(check(site(), [floor(rectangle(1, 1, 20, 20), 1, 15.01)], 'core-around').status).toBe(
      'fail',
    );
    expect(check(site(), [floor(rectangle(2, 2, 20, 20), 1, 15.01)], 'core-around').status).toBe(
      'pass',
    );
  });
  it.each([
    [5.9, 3.05],
    [6, 3],
    [9.9, 1.05],
    [10, 1],
    [20, 2],
    [20.1, 2],
  ])('checks specified-building ROW %s at its correct setback %s', (width, setback) => {
    const input = site();
    input.roads![0].widthM = width;
    expect(
      check(input, [floor(rectangle(3, setback, 20, 20), 3, 9)], 'core-road-setback').status,
    ).toBe('pass');
    expect(
      check(input, [floor(rectangle(3, setback - 0.02, 20, 20), 3, 9)], 'core-road-setback').status,
    ).toBe('fail');
  });
  it('uses the 3 m centreline rule only for small ordinary buildings on ROW under 6 m', () => {
    const input = site();
    input.roads![0].widthM = 4;
    expect(check(input, [floor(rectangle(3, 1, 20, 20), 1, 3)], 'core-road-setback').status).toBe(
      'pass',
    );
    input.roads![0].widthM = 6;
    expect(check(input, [floor(rectangle(3, 0, 20, 20), 1, 3)], 'core-road-setback').status).toBe(
      'pass',
    );
  });
  it('checks H=2(s+ROW) at every floor, with unknown datum and ROW kept unknown', () => {
    const input = site();
    expect(check(input, [floor(undefined, 6, 22)], 'core-road-height').status).toBe('pass');
    expect(check(input, [floor(undefined, 6, 22.02)], 'core-road-height').status).toBe('fail');
    input.project!.coreBasis!.matchingHeightDatum = false;
    expect(check(input, [floor()], 'core-road-height').status).toBe('unknown');
    expect(check(input, [floor()], 'core-boundary').status).toBe('unknown');
    expect(check(input, [floor()], 'core-around').status).toBe('unknown');
    expect(check(input, [floor()], 'core-road-setback').status).toBe('unknown');
    input.project!.coreBasis!.publicRoadReferences = false;
    expect(check(input, [floor()], 'core-road-setback').status).toBe('unknown');
    input.project!.coreBasis!.publicRoadReferences = true;
    input.roads![0].confirmed = false;
    expect(check(input, [floor()], 'core-road-height').status).toBe('unknown');
    expect(check(input, [floor()], 'core-far').status).toBe('pass');
  });
  it('uses every declared frontage and is independent of polygon winding', () => {
    const input = site();
    const forward = check(input, [floor()], 'core-road-height');
    input.geographicPlot.reverse();
    input.frontage![0].edgeIndex = 2;
    expect(check(input, [floor()], 'core-road-height').actual).toBeCloseTo(forward.actual!);
    input.roads!.push({ ...input.roads![0], id: 'second', widthM: 2 });
    input.frontage!.push({ edgeIndex: 3, roadId: 'second' });
    expect(check(input, [floor(rectangle(3, 3, 44, 20), 6, 22)], 'core-road-height').status).toBe(
      'fail',
    );
  });
  it('applies the large-building road condition even to a short building', () => {
    const input = site(60, 60);
    input.roads![0].widthM = 4;
    const f = floor(rectangle(5, 3, 45, 50), 1, 3.2);
    expect(check(input, [f], 'core-road-setback').status).toBe('fail');
    expect(check(input, [floor(rectangle(5, 4, 45, 50))], 'core-road-setback').status).toBe('pass');
  });
  it('does not substitute working-room area or an unverified station exception for office operation area', () => {
    const input = site();
    input.use = 'office';
    input.project!.officeWorkingAreaM2 = 100;
    expect(check(input, [floor()], 'core-use').status).toBe('unknown');
    input.project!.coreBasis!.officeOperationAreaM2 = 1000;
    expect(check(input, [floor()], 'core-use').status).toBe('pass');
    input.project!.coreBasis!.officeOperationAreaM2 = 100;
    expect(check(input, [floor()], 'core-use').status).toBe('fail');
    input.project!.coreBasis!.officeOperationAreaM2 = 1001;
    input.transitDistanceM = 0;
    expect(check(input, [floor()], 'core-use').status).toBe('unknown');
    input.roads![0].widthM = 16;
    expect(check(input, [floor()], 'core-use').status).toBe('pass');
    input.project!.coreBasis!.officeOperationAreaM2 = 10001;
    expect(check(input, [floor()], 'core-use').status).toBe('fail');
  });
  it('does not grant a green result to unsupported high-rise or extra-large models', () => {
    expect(assessCoreModel(site(), [floor(undefined, 7, 23)], 'inside').status).toBe('unknown');
    const floors = Array.from({ length: 5 }, (_, i) =>
      floor(rectangle(0, 0, 40, 50), i + 1, 3 * (i + 1)),
    );
    expect(assessCoreModel(site(), floors, 'inside').status).toBe('unknown');
  });
});
