import { describe, expect, it } from 'vitest';
import type { FloorGeometry, SiteInput } from '@bangkok/domain';
import { SAMPLE_PLOT } from '@bangkok/geometry';
import { screenProject } from './project-checks';
const input = (): SiteInput => ({
  revision: 1,
  geographicPlot: SAMPLE_PLOT,
  use: 'condominium',
  assumptions: { setbackM: 3, floors: 6, floorHeightM: 3.2 },
  project: {},
});
const floors = (count = 1): FloorGeometry[] =>
  Array.from({ length: count }, (_, i) => ({
    level: i + 1,
    baseM: i * 3.2,
    topM: (i + 1) * 3.2,
    polygons: [
      {
        outer: [
          [0, 0],
          [20, 0],
          [20, 30],
          [0, 30],
        ],
        holes: [],
      },
    ],
    areaM2: 600,
  }));
const check = (result: ReturnType<typeof screenProject>, id: string) =>
  result.checks.find((c) => c.id === id)!;
describe('project reference screening and real floor reservations', () => {
  it('keeps absent quantities and layouts unknown rather than zero/passed', () => {
    const result = screenProject(input(), floors(6), 3600, 1000);
    expect(result.parking.requiredSpaces).toBeNull();
    expect(result.parking.providedSpaces).toBeNull();
    expect(check(result, 'model-parking-count').status).toBe('unknown');
    expect(check(result, 'model-parking-layout').status).toBe('unknown');
    expect(result.parking.layoutVerified).toBe(false);
  });
  it.each([
    [299.99, 0],
    [300, 5],
    [360.01, 7],
  ])(
    'screens office working area %s at the sourced trigger and rounding boundary',
    (working, required) => {
      const site = input();
      site.use = 'office';
      site.project = { officeWorkingAreaM2: working, parkingSpaces: 10 };
      expect(screenProject(site, floors(), 600, 1000).parking.requiredSpaces).toBe(required);
    },
  );
  it('takes the larger of use and large-building counts', () => {
    const site = input();
    site.project = { residentialUnitsOver60M2: 40, parkingSpaces: 40 };
    expect(screenProject(site, floors(6), 3600, 1000).parking.requiredSpaces).toBe(40);
    site.project.residentialUnitsOver60M2 = 0;
    expect(screenProject(site, floors(6), 3600, 1000).parking.requiredSpaces).toBe(30);
  });
  it('reserves actual bottom-floor polygons and reduces non-parking usable capacity without changing gross area', () => {
    const site = input();
    site.project = {
      residentialUnitsOver60M2: 0,
      parkingSpaces: 40,
      parkingLocation: 'within-building',
    };
    const original = floors(6),
      snapshot = JSON.stringify(original),
      result = screenProject(site, original, 3600, 1000);
    // Area alone suggested two floors; explicit stalls/aisles need a third floor.
    expect(result.floors.filter((f) => f.use === 'parking')).toHaveLength(3);
    expect(result.parking.reservedFloorAreaM2).toBe(1800);
    expect(result.parking.estimatedCapacity).toBe(63);
    expect(result.parking.schematicSpaces).toBe(40);
    expect(result.parking.plans.reduce((n, p) => n + p.stalls.length, 0)).toBe(40);
    expect(result.usableAreaM2).toBe(1584);
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(result.floors.reduce((sum, f) => sum + f.areaM2, 0)).toBe(3600);
    expect(check(result, 'model-parking-count').status).toBe('pass');
    expect(check(result, 'model-parking-layout').status).toBe('unknown');
  });
  it('rejects a definite large-building count shortfall even with unknown use-specific count', () => {
    const site = input();
    site.project = { parkingSpaces: 0 };
    expect(check(screenProject(site, floors(6), 3600, 1000), 'model-parking-count').status).toBe(
      'fail',
    );
  });
  it('cannot allocate parking and permeable ground to the same area', () => {
    const site = input();
    site.project = { parkingSpaces: 5, parkingLocation: 'ground-uncovered' };
    expect(check(screenProject(site, floors(), 600, 100), 'model-ground-allocation').status).toBe(
      'fail',
    );
    site.project.parkingSpaces = 1;
    expect(check(screenProject(site, floors(), 600, 100), 'model-ground-allocation').status).toBe(
      'pass',
    );
  });
  it.each([
    [5.999, 'fail'],
    [6, 'pass'],
  ] as const)(
    'screens connecting road width %s without verifying the vehicle layout',
    (width, status) => {
      const site = input();
      site.project = {
        parkingSpaces: 15,
        accessRoadWidthM: width,
        routeConnectedToPublicRoad: true,
      };
      const result = screenProject(site, floors(), 600, 1000);
      expect(check(result, 'model-public-road').status).toBe(status);
      expect(check(result, 'model-parking-layout').status).toBe('unknown');
    },
  );
  it('distinguishes unknown and disconnected access', () => {
    const site = input();
    site.project = { parkingSpaces: 15, accessRoadWidthM: 6 };
    expect(check(screenProject(site, floors(), 600, 1000), 'model-public-road').status).toBe(
      'unknown',
    );
    site.project.routeConnectedToPublicRoad = false;
    expect(check(screenProject(site, floors(), 600, 1000), 'model-public-road').status).toBe(
      'fail',
    );
  });
  it.each([
    [3.49, 'fail'],
    [3.5, 'pass'],
  ] as const)('screens one-way driveway width %s', (width, status) => {
    const site = input();
    site.project = { parkingSpaces: 5, drivewayDirection: 'one-way', drivewayWidthM: width };
    expect(check(screenProject(site, floors(), 600, 1000), 'model-driveway').status).toBe(status);
  });
  it('reports an EIA trigger as a review prerequisite rather than prohibition or approval', () => {
    const site = input();
    site.project = { residentialUnits: 80 };
    const result = screenProject(site, floors(), 600, 1000);
    expect(check(result, 'model-eia').status).toBe('unknown');
    expect(check(result, 'model-eia').explanation).toContain('triggers a review requirement');
    expect(result.checks.every((c) => c.scope === 'assumption')).toBe(true);
  });
});
