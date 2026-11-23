import { describe, expect, it } from 'vitest';
import type { FloorGeometry, MultiPolygon, ParkingPlan, ProjectInputs } from '@bangkok/domain';
import { area, difference, intersection } from '@bangkok/geometry';
import { screenRamp } from './ramp-checks';
const shape: MultiPolygon = [
  {
    outer: [
      [0, 0],
      [20, 0],
      [20, 70],
      [0, 70],
    ],
    holes: [],
  },
];
const setup = (rise = 3.2) => {
  const floors: FloorGeometry[] = Array.from({ length: 2 }, (_, i) => ({
    level: i + 1,
    baseM: i * rise,
    topM: (i + 1) * rise,
    polygons: shape,
    areaM2: 1400,
    use: 'parking',
  }));
  const plans: ParkingPlan[] = floors.map((f) => ({
    level: f.level,
    stalls: [],
    aisles: [],
    serviceReserve: [
      {
        outer: [
          [0, 0],
          [4, 0],
          [4, 70],
          [0, 70],
        ],
        holes: [],
      },
    ],
    stallWidthM: 2.4,
    stallLengthM: 5,
    aisleWidthM: 6,
    scope: 'schematic',
  }));
  const project: ProjectInputs = {
    drivewayDirection: 'one-way',
    ramp: {
      kind: 'straight',
      horizontalRunM: rise / 0.15,
      clearWidthM: 3.5,
      clearHeightM: 2.1,
      entranceOffsetM: 6,
    },
  };
  return { floors, plans, project };
};
const find = (r: ReturnType<typeof screenRamp>, id: string) => r.checks.find((c) => c.id === id)!;
describe('source-scoped ramp arithmetic and aligned reservations', () => {
  it.each([
    [15, 'pass'],
    [15.001, 'fail'],
  ] as const)(
    'screens straight gradient %s without certifying the physical section',
    (grade, status) => {
      const s = setup();
      s.project.ramp!.horizontalRunM = (100 * 3.2) / grade;
      const r = screenRamp(s.project, s.floors, s.plans);
      expect(find(r, 'model-ramp-gradient').status).toBe(status);
      expect(find(r, 'model-ramp-swept-path').status).toBe('unknown');
      expect(r.checks.every((c) => c.scope === 'assumption')).toBe(true);
    },
  );
  it.each([
    [12, 6, 'pass', 'pass'],
    [12.001, 5.99, 'fail', 'fail'],
  ] as const)(
    'keeps curved grade%s and inner radius%s separate from vehicle turning',
    (grade, radius, gradientStatus, radiusStatus) => {
      const s = setup();
      s.project.ramp = {
        kind: 'curved',
        horizontalRunM: (100 * 3.2) / grade,
        innerRadiusM: radius,
      };
      const r = screenRamp(s.project, s.floors, s.plans);
      expect(find(r, 'model-ramp-gradient').status).toBe(gradientStatus);
      expect(find(r, 'model-ramp-radius').status).toBe(radiusStatus);
      expect(find(r, 'model-ramp-reservation').status).toBe('unknown');
    },
  );
  it.each([
    [5, 0, 'not-applicable'],
    [5.001, 1, 'unknown'],
  ] as const)(
    'changes rest requirements only above the five-metre flight rise: %s',
    (rise, count, status) => {
      const s = setup(rise),
        r = screenRamp(s.project, s.floors, s.plans);
      expect(r.ramp!.intermediateLandings).toBe(count);
      expect(find(r, 'model-ramp-landings').status).toBe(status);
    },
  );
  it('reserves declared landings in addition to the inclined run', () => {
    const s = setup(6);
    s.project.ramp!.intermediateLandingLengthM = 6;
    const r = screenRamp(s.project, s.floors, s.plans);
    expect(r.ramp!.footprint.length).toBeGreaterThan(0);
    expect(area(r.ramp!.footprint)).toBeCloseTo(3.5 * (40 + 6), 3);
    for (const plan of s.plans)
      expect(area(difference(r.ramp!.footprint, plan.serviceReserve))).toBeLessThanOrEqual(0.001);
    s.project.ramp!.intermediateLandingLengthM = 5.99;
    expect(find(screenRamp(s.project, s.floors, s.plans), 'model-ramp-landings').status).toBe(
      'fail',
    );
  });
  it.each([
    [2.1, 'pass'],
    [2.099, 'fail'],
    [3.3, 'fail'],
  ] as const)('checks actual storey upper bound and declared clear height %s', (height, status) => {
    const s = setup();
    s.project.ramp!.clearHeightM = height;
    expect(find(screenRamp(s.project, s.floors, s.plans), 'model-ramp-headroom').status).toBe(
      status,
    );
  });
  it('does not pass missing dimensions or reserve through stalls/aisles or mismatched floors', () => {
    const s = setup();
    expect(find(screenRamp({}, s.floors, s.plans), 'model-ramp-gradient').status).toBe('unknown');
    s.plans[1].aisles = s.plans[1].serviceReserve;
    const r = screenRamp(s.project, s.floors, s.plans);
    expect(find(r, 'model-ramp-reservation').status).toBe('fail');
    expect(area(intersection(r.ramp!.footprint, s.plans[1].aisles))).toBe(0);
    s.plans[1].level = 3;
    expect(find(screenRamp(s.project, s.floors, s.plans), 'model-ramp-reservation').status).toBe(
      'fail',
    );
  });
  it('does not request an interstorey ramp for a sole ground parking level', () => {
    const s = setup();
    expect(screenRamp(s.project, s.floors.slice(0, 1), s.plans.slice(0, 1)).ramp).toBeUndefined();
  });
});
