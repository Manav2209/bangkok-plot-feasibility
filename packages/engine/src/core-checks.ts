import type {
  CheckResult,
  DesignResult,
  FloorGeometry,
  Point,
  Ring,
  SiteInput,
} from '@bangkok/domain';
import { area, difference, signedArea, toMetric, union } from '@bangkok/geometry';
import { coreRuleProfile, referenceProfile, referenceValue as v } from '@bangkok/rules';

const AREA_EPS = 0.01;
const DISTANCE_EPS = 0.001;
function pointSegmentDistance(p: Point, a: Point, b: Point) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function boundaryDistance(floor: FloorGeometry, ring: Ring) {
  let minimum = Infinity;
  for (const polygon of floor.polygons)
    for (let i = 0; i < polygon.outer.length; i++) {
      const a = polygon.outer[i],
        b = polygon.outer[(i + 1) % polygon.outer.length];
      for (let j = 0; j < ring.length; j++) {
        const c = ring[j],
          d = ring[(j + 1) % ring.length];
        minimum = Math.min(minimum, pointSegmentDistance(a, c, d), pointSegmentDistance(c, a, b));
      }
    }
  return minimum;
}

/** Clause-backed checks of a declared model; never an actual-site/permit verdict. */
export function assessCoreModel(
  input: SiteInput,
  floors: FloorGeometry[],
  zoneMembership: string | undefined,
  groundParkingM2 = 0,
): NonNullable<DesignResult['coreAssessment']> {
  const ring = input.geographicPlot.map(toMetric);
  const plot = [{ outer: ring, holes: [] }];
  const plotArea = area(plot);
  const counted = floors.reduce((sum, f) => sum + area(f.polygons), 0);
  const covered = union(floors.flatMap((f) => f.polygons));
  const uncovered = Math.max(0, plotArea - area(covered));
  const height = Math.max(0, ...floors.map((f) => f.topM));
  const basis = input.project?.coreBasis;
  const whole =
    basis?.wholeSiteAndBuildings === true &&
    basis.aggregationAccountedFor === true &&
    basis.allFloorsAndCoverCounted === true;
  const zone =
    input.zone?.id === 'y7-21-2013' &&
    input.zone.evidence === 'verified' &&
    zoneMembership === 'inside';
  const supported =
    height < v('highRiseThreshold') &&
    counted < v('extraLargeBuildingArea') &&
    counted > 0 &&
    plotArea > 0;
  const ready = whole && zone && supported;
  const prerequisites = !whole
    ? 'Confirm the whole-site, aggregation and all-floor/cover model declarations.'
    : !zone
      ? 'The whole outline must be inside the sourced Y.7-21 polygon with its study guard.'
      : !supported
        ? 'This assessment supports new models below both 23 m and 10,000 m².'
        : '';
  const checks: CheckResult[] = [];
  function add(
    id: string,
    actual: number | undefined,
    required: number | undefined,
    pass: boolean,
    canCheck: boolean,
    explanation: string,
    unit = 'm²',
  ) {
    const rule = coreRuleProfile.rules.find((r) => r.id === id)!;
    checks.push({
      id,
      title: rule.title,
      scope: 'core-model',
      measurementBasis: 'assumption',
      status: !ready || !canCheck ? 'unknown' : pass ? 'pass' : 'fail',
      actual,
      required,
      unit,
      sourceIds: rule.sourceIds,
      explanation:
        `Conditional model check against ${rule.clause}. ${explanation} ${!ready ? prerequisites : ''}`.trim(),
    });
  }
  add(
    'core-far',
    counted,
    plotArea * v('far'),
    counted <= plotArea * v('far') + AREA_EPS,
    true,
    'All closed modeled floors, including parking/cores, are counted. No deductions or bonus are applied.',
  );
  add(
    'core-osr',
    uncovered,
    counted * v('osr'),
    uncovered + AREA_EPS >= counted * v('osr'),
    true,
    'Unroofed area is plot area minus the union of all overhead cover represented by the model.',
  );
  const openFraction = v(input.use === 'condominium' ? 'residentialUncovered' : 'officeUncovered');
  add(
    'core-uncovered-bma',
    uncovered,
    plotArea * openFraction,
    uncovered + AREA_EPS >= plotArea * openFraction,
    true,
    'The Bangkok denominator is construction-site plot area.',
  );
  const largestFloor = Math.max(0, ...floors.map((f) => area(f.polygons)));
  add(
    'core-uncovered-national',
    uncovered,
    largestFloor * openFraction,
    uncovered + AREA_EPS >= largestFloor * openFraction,
    true,
    'The national denominator is the largest modeled floor, independently of Bangkok’s plot-based rule.',
  );
  const planting =
    uncovered *
    (input.assumptions.permeableFraction ?? referenceProfile.designDefaults.permeableFraction);
  add(
    'core-planting',
    planting,
    uncovered * v('permeable'),
    planting + AREA_EPS >= uncovered * v('permeable') &&
      planting + groundParkingM2 <= uncovered + AREA_EPS,
    true,
    'This checks the planned planting allocation only. Paving/parking cannot also be counted as permeable planting. Physical planting is unverified.',
  );
  const distances = ready ? floors.map((f) => boundaryDistance(f, ring)) : [];
  const outside = ready ? area(difference(covered, plot)) : 0;
  const margins = distances.map(
    (distance, i) =>
      distance -
      Math.max(
        height > v('boundaryHeightTier') ? v('boundaryHigh') : v('boundaryLow'),
        floors[i].level >= v('boundaryFloorTier') ? v('boundaryHigh') : v('boundaryLow'),
      ),
  );
  const boundaryMargin = margins.length ? Math.min(...margins) : undefined;
  add(
    'core-boundary',
    boundaryMargin,
    0,
    outside <= AREA_EPS && boundaryMargin !== undefined && boundaryMargin >= -DISTANCE_EPS,
    basis?.matchingHeightDatum === true,
    'Actual is minimum remaining boundary margin after whole-building and floor tiers. Requires the declared compatible road/site height datum. Every facade is treated as having openings; no consent/blank-wall exception. Distance tolerance 1 mm, area tolerance 0.01 m².',
    'm margin',
  );
  const aroundRequired = height > v('aroundHeightTier') ? v('aroundHigh') : v('aroundLow');
  const around = distances.length ? Math.min(...distances) : undefined;
  add(
    'core-around',
    around,
    aroundRequired,
    outside <= AREA_EPS && around !== undefined && around + DISTANCE_EPS >= aroundRequired,
    basis?.matchingHeightDatum === true,
    'Minimum distance from every modeled building extent to the construction-site boundary; requires the declared compatible road/site height datum. No unmodeled projections or rooftop objects.',
    'm',
  );

  const bindings = (input.frontage ?? []).map((f) => ({
    edge: f.edgeIndex,
    road: input.roads?.find((r) => r.id === f.roadId),
  }));
  const roadsReady =
    basis?.publicRoadReferences === true &&
    bindings.length > 0 &&
    bindings.every(
      ({ edge, road }) =>
        edge >= 0 &&
        edge < ring.length &&
        road?.confirmed === true &&
        road.widthM !== undefined &&
        road.widthM > 0,
    );
  let setbackMargin = Infinity,
    heightMargin = Infinity;
  if (ready && roadsReady)
    for (const { edge, road } of bindings) {
      const a = ring[edge],
        b = ring[(edge + 1) % ring.length];
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        length = Math.hypot(dx, dy),
        winding = Math.sign(signedArea(ring));
      const nx = (-dy / length) * winding,
        ny = (dx / length) * winding,
        width = road!.widthM!;
      const large =
        floors.length > v('largeRoadBuildingFloors') ||
        height > v('largeRoadBuildingHeight') ||
        counted > v('largeBuildingArea') ||
        input.use === 'office';
      const setback = large
        ? width < v('roadMediumWidth')
          ? Math.max(0, v('roadCentrelineLarge') - width / 2)
          : width <= v('roadWideWidth')
            ? width * v('roadFraction')
            : v('roadWideSetback')
        : width < v('roadSmallWidth')
          ? Math.max(0, v('roadCentrelineSmall') - width / 2)
          : 0;
      for (const floor of floors)
        for (const p of floor.polygons)
          for (const point of p.outer) {
            const insideDistance = nx * (point[0] - a[0]) + ny * (point[1] - a[1]);
            setbackMargin = Math.min(setbackMargin, insideDistance - setback);
            heightMargin = Math.min(
              heightMargin,
              v('roadHeightFactor') * (insideDistance + width) - floor.topM,
            );
          }
    }
  add(
    'core-road-setback',
    Number.isFinite(setbackMargin) ? setbackMargin : undefined,
    0,
    setbackMargin >= -DISTANCE_EPS,
    roadsReady &&
      (basis?.matchingHeightDatum === true ||
        floors.length > v('largeRoadBuildingFloors') ||
        counted > v('largeBuildingArea') ||
        input.use === 'office'),
    'Requires all public frontages identified, confirmed ROW widths, selected edges at near ROW boundaries and straight uniform roads with parallel opposite boundaries. Inputs are declarations, not surveyed access rights.',
    'm margin',
  );
  add(
    'core-road-height',
    Number.isFinite(heightMargin) ? heightMargin : undefined,
    0,
    heightMargin >= -DISTANCE_EPS,
    roadsReady && basis?.matchingHeightDatum === true,
    'Minimum clearance below H=2(s+ROW), checked at every floor top and vertex. Road and model ground must share the declared datum. Unequal/unknown datum is not evaluated; no corner/wider-road/rooftop exception.',
    'm margin',
  );
  const operation = input.use === 'condominium' ? counted : basis?.officeOperationAreaM2;
  const wideAccess =
    roadsReady && bindings.some(({ road }) => road!.widthM! >= v('officeExceptionRoadWidth'));
  const useLimit =
    input.use === 'condominium'
      ? v('condoAreaWithoutAccess')
      : wideAccess
        ? v('officeAreaMaximum')
        : v('officeAreaWithoutAccess');
  const useKnown =
    input.use === 'condominium' ||
    (operation !== undefined &&
      operation > 0 &&
      (operation <= v('officeAreaWithoutAccess') ||
        operation > v('officeAreaMaximum') ||
        wideAccess));
  add(
    'core-use',
    operation,
    useLimit,
    operation !== undefined && operation + AREA_EPS >= counted && operation <= useLimit + AREA_EPS,
    useKnown,
    input.use === 'condominium'
      ? 'The supported model remains below the collective-housing size threshold.'
      : `Declare complete office operation area, including related outdoor use and at least the ${counted.toFixed(2)} m² of counted model floors; no operation-area exclusions are claimed in this model. Working-room area is not substituted. A missing road/station exception remains unknown, not a proven prohibition.`,
  );
  return {
    status: checks.some((c) => c.status === 'fail')
      ? 'fail'
      : checks.some((c) => c.status === 'unknown')
        ? 'unknown'
        : 'pass',
    checks,
    countedModelAreaM2: counted,
    uncoveredModelAreaM2: uncovered,
    scope: coreRuleProfile.scope,
  };
}
