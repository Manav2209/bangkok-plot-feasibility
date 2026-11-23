import type {
  CheckResult,
  FloorGeometry,
  MultiPolygon,
  ParkingPlan,
  ProjectInputs,
} from '@bangkok/domain';
import { area, bounds, difference, intersection, rotatePoint } from '@bangkok/geometry';
import { referenceValue as v } from '@bangkok/rules';

function reserveStraightRamp(region: MultiPolygon, width: number, run: number): MultiPolygon {
  for (const polygon of region) {
    const angles = new Set([0, Math.PI / 2]);
    polygon.outer.forEach((p, i) => {
      const q = polygon.outer[(i + 1) % polygon.outer.length];
      const angle = Math.atan2(q[1] - p[1], q[0] - p[0]);
      angles.add(angle);
      angles.add(angle + Math.PI / 2);
    });
    for (const angle of [...angles].slice(0, 12)) {
      const local = {
        outer: polygon.outer.map((p) => rotatePoint(p, -angle)),
        holes: polygon.holes.map((h) => h.map((p) => rotatePoint(p, -angle))),
      };
      const b = bounds([local]);
      if (run > b.maxX - b.minX + 0.001 || width > b.maxY - b.minY + 0.001) continue;
      for (const x of [b.minX, (b.minX + b.maxX - run) / 2, b.maxX - run])
        for (const y of [b.minY, (b.minY + b.maxY - width) / 2, b.maxY - width]) {
          const shape: MultiPolygon = [
            {
              outer: [
                [x, y],
                [x + run, y],
                [x + run, y + width],
                [x, y + width],
              ],
              holes: [],
            },
          ];
          if (area(difference(shape, [local])) <= 0.001)
            return shape.map((p) => ({
              outer: p.outer.map((q) => rotatePoint(q, angle)),
              holes: [],
            }));
        }
    }
  }
  return [];
}

/** Numeric and plan-space screens; external road status and actual structure remain unknown. */
export function screenRamp(project: ProjectInputs, floors: FloorGeometry[], plans: ParkingPlan[]) {
  const parking = floors.filter((f) => f.use === 'parking'),
    ramp = project.ramp;
  const rises = parking.flatMap((f, i) =>
    i ? [f.baseM - parking[i - 1].baseM] : f.baseM > 0 ? [f.baseM] : [],
  );
  const riseM = Math.max(0, ...rises);
  const limit = ramp?.kind
    ? v(ramp.kind === 'straight' ? 'straightRampMaxSlope' : 'curvedRampMaxSlope')
    : null;
  const gradient = ramp?.horizontalRunM && riseM ? (100 * riseM) / ramp.horizontalRunM : null;
  const flights = riseM ? Math.ceil(riseM / v('rampMaxFlightRise')) : 0;
  const landings = Math.max(0, flights - 1);
  const checks: CheckResult[] = [];
  const check = (
    id: string,
    title: string,
    status: CheckResult['status'],
    explanation: string,
    actual?: number,
    required?: number,
    unit?: string,
  ): CheckResult => ({
    id,
    title,
    status,
    scope: 'assumption',
    explanation,
    actual,
    required,
    unit,
    sourceIds: ['bma-building-2544'],
  });
  let footprint: MultiPolygon = [];
  if (!riseM) return { checks, ramp: undefined };
  checks.push(
    check(
      'model-ramp-gradient',
      'Reference ramp gradient',
      gradient === null || limit === null ? 'unknown' : gradient <= limit + 1e-7 ? 'pass' : 'fail',
      `Rise ${riseM.toFixed(3)} m comes from the greatest transition between actual reserved parking levels, including an elevated first level. The declared horizontal inclined run excludes flat landings. Source clause99; this repeated-transition screen does not verify vertical openings, construction or every distinct ramp.`,
      gradient ?? undefined,
      limit ?? undefined,
      '%',
    ),
  );
  if (ramp?.kind === 'straight')
    checks.push(
      check(
        'model-ramp-landings',
        'Reference intermediate ramp landings',
        !landings
          ? 'not-applicable'
          : ramp.intermediateLandingLengthM === undefined
            ? 'unknown'
            : ramp.intermediateLandingLengthM >= v('rampLandingLength')
              ? 'pass'
              : 'fail',
        `Each straight flight rises at most ${v('rampMaxFlightRise')} m. Equal-rise splitting of this worst transition needs ${flights} flights and ${landings} intermediate resting platforms. Each platform must provide the full length; no staircase, queue or turning-area overlap is assumed. Actual transition curves remain unverified.`,
        ramp.intermediateLandingLengthM,
        v('rampLandingLength'),
        'm per intermediate platform',
      ),
    );
  if (ramp?.kind === 'curved')
    checks.push(
      check(
        'model-ramp-radius',
        'Reference curved-ramp inner radius',
        ramp.innerRadiusM === undefined
          ? 'unknown'
          : ramp.innerRadiusM >= v('curvedRampInnerRadius')
            ? 'pass'
            : 'fail',
        'Source clause99 inner-edge radius; this is not the vehicle steering/turning radius and does not certify a swept path.',
        ramp.innerRadiusM,
        v('curvedRampInnerRadius'),
        'm',
      ),
    );
  const requiredWidth =
    project.drivewayDirection === 'one-way'
      ? v('oneWayDriveway')
      : project.drivewayDirection === 'two-way'
        ? v('twoWayDriveway')
        : undefined;
  checks.push(
    check(
      'model-ramp-width',
      'Declared ramp clear width',
      ramp?.clearWidthM === undefined || requiredWidth === undefined
        ? 'unknown'
        : ramp.clearWidthM >= requiredWidth
          ? 'pass'
          : 'fail',
      'Reference entrance-width screen uses the declared direction. Road entry, perpendicular-parking interaction and lane transitions require separate review.',
      ramp?.clearWidthM,
      requiredWidth,
      'm',
    ),
  );
  const floorHeight = Math.min(...parking.map((f) => f.topM - f.baseM));
  checks.push(
    check(
      'model-ramp-headroom',
      'Declared parking clear height',
      ramp?.clearHeightM === undefined
        ? 'unknown'
        : ramp.clearHeightM >= v('parkingClearHeight') && ramp.clearHeightM <= floorHeight + 1e-7
          ? 'pass'
          : 'fail',
      `Located reference MR41 clause4 suggests ${v('parkingClearHeight')} m clear height. A declared height cannot exceed the shortest modelled parking storey (${floorHeight.toFixed(3)} m). Slabs, beams, equipment, ramp crest/sag and the complete path's actual soffit are not surveyed by this declaration.`,
      ramp?.clearHeightM,
      v('parkingClearHeight'),
      'm',
    ),
  );
  checks.at(-1)!.sourceIds = ['mr41-parking-reference'];
  checks.push(
    check(
      'model-ramp-entrance',
      'Declared ground-ramp entrance separation',
      ramp?.entranceOffsetM === undefined
        ? 'unknown'
        : ramp.entranceOffsetM >= v('rampEntranceOffset')
          ? 'pass'
          : 'fail',
      'Source clause99 ground-level ramp starts at least the reference distance from the building/vehicle mouth. This declaration is separate from platform length and from clause89 intersection spacing; one measurement cannot satisfy all three.',
      ramp?.entranceOffsetM,
      v('rampEntranceOffset'),
      'm',
    ),
  );
  const fullRun =
    ramp?.horizontalRunM === undefined
      ? undefined
      : ramp.horizontalRunM + landings * (ramp.intermediateLandingLengthM ?? 0);
  let geometryStatus: CheckResult['status'] = 'unknown';
  if (
    ramp?.kind === 'straight' &&
    ramp.clearWidthM &&
    fullRun &&
    (!landings || ramp.intermediateLandingLengthM !== undefined) &&
    plans.length === parking.length
  ) {
    const regions = parking.map((f) => {
      const p = plans.find((p) => p.level === f.level);
      return p
        ? difference(intersection(f.polygons, p.serviceReserve), [...p.stalls, ...p.aisles])
        : [];
    });
    const shared = regions
      .slice(1)
      .reduce((common, p) => intersection(common, p), regions[0] ?? []);
    footprint = reserveStraightRamp(shared, ramp.clearWidthM, fullRun);
    geometryStatus = footprint.length ? 'pass' : 'fail';
  }
  checks.push(
    check(
      'model-ramp-reservation',
      'Aligned straight-ramp reservation',
      geometryStatus,
      'A bounded rectangle search places the declared run plus intermediate landings wholly inside the common service reserve of every parking level. It cannot consume stalls or aisles. The reservation does not create a slab opening or verify gradients at crests, structure, usable core space, turning or legal entrance connection. A failed search is not proof that every ramp design is impossible.',
      footprint.length ? area(footprint) : geometryStatus === 'fail' ? 0 : undefined,
      fullRun && ramp?.clearWidthM ? fullRun * ramp.clearWidthM : undefined,
      'm²',
    ),
  );
  checks.push(
    check(
      'model-ramp-swept-path',
      'Vehicle turning and ramp transitions',
      'unknown',
      'A straight-run reservation or curved-ramp inner radius does not supply a vehicle swept path. A design vehicle with wheelbase/overhang, actual entry-to-stall and ramp trajectories, crest/sag sections and clearances is required. No universal turning radius or transition length is invented.',
    ),
  );
  checks.at(-1)!.sourceIds = ['mr41-parking-reference'];
  return {
    checks,
    ramp: {
      riseM,
      gradientPercent: gradient,
      minimumRunM: limit === null ? null : (100 * riseM) / limit,
      flights,
      intermediateLandings: landings,
      footprint,
      scope: 'schematic' as const,
    },
  };
}
