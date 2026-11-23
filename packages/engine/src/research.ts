import type {
  Budget,
  CalculationResult,
  CheckResult,
  DesignResult,
  EnvelopeSlice,
  MultiPolygon,
  Point,
  SiteInput,
} from '@bangkok/domain';
import { assumptionsSchema, projectSchema } from '@bangkok/domain';
import { screenProject } from './project-checks';
import { assessCoreModel } from './core-checks';
import {
  area,
  axisAlignedRectangleInside,
  bounds,
  clipRoadPlane,
  difference,
  edgeInset,
  inset,
  intersection,
  pointInside,
  rotatePoint,
  signedArea,
  toMetric,
  union,
  validateRing,
} from '@bangkok/geometry';
import {
  complianceStatus,
  evaluateRules,
  referenceProfile,
  referenceValue as v,
  RULESET_VERSION,
} from '@bangkok/rules';

const AREA_EPS = 0.01;
interface Rectangle {
  polygons: MultiPolygon;
  width: number;
  depth: number;
  centre: Point;
  angle: number;
}
function rectangle(centre: Point, width: number, depth: number, angle: number): MultiPolygon {
  return [
    {
      outer: (
        [
          [-width / 2, -depth / 2],
          [width / 2, -depth / 2],
          [width / 2, depth / 2],
          [-width / 2, depth / 2],
        ] as Point[]
      ).map((p) => {
        const r = rotatePoint(p, angle);
        return [r[0] + centre[0], r[1] + centre[1]] as Point;
      }),
      holes: [],
    },
  ];
}

/** Bounded deterministic search; tests final polygons against the full concave region. */
function compactRectangle(
  region: MultiPolygon,
  angle: number,
  minWidth: number,
  minDepth: number,
  areaLimit: number,
  counter: { tested: number },
): Rectangle | null {
  if (!region.length || areaLimit < minWidth * minDepth) return null;
  const rotated = region.map((p) => ({
    outer: p.outer.map((p) => rotatePoint(p, -angle)),
    holes: p.holes.map((r) => r.map((p) => rotatePoint(p, -angle))),
  }));
  let best: Rectangle | null = null;
  let bestArea = 0;
  for (const component of rotated) {
    const box = bounds([component]);
    const turns = component.outer.map((p, i) => {
      const q = component.outer[(i + 1) % component.outer.length],
        r = component.outer[(i + 2) % component.outer.length];
      return (q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0]);
    });
    const convex =
      !component.holes.length && (turns.every((t) => t >= -1e-8) || turns.every((t) => t <= 1e-8));
    const winding = signedArea(component.outer) >= 0 ? 1 : -1;
    const halfPlanes = convex
      ? component.outer.map((p, i) => {
          const q = component.outer[(i + 1) % component.outer.length];
          return { p, nx: -(q[1] - p[1]) * winding, ny: (q[0] - p[0]) * winding };
        })
      : [];
    const ratios = [0.5, 1, 2, (box.maxX - box.minX) / (box.maxY - box.minY)];
    for (const x of [0.25, 0.5, 0.75])
      for (const y of [0.25, 0.5, 0.75]) {
        const centre: Point = [
          box.minX + (box.maxX - box.minX) * x,
          box.minY + (box.maxY - box.minY) * y,
        ];
        if (!pointInside(centre, [component])) continue;
        for (const ratio of ratios) {
          const rootRatio = Math.sqrt(ratio);
          // A rectangle is inside a convex polygon iff its support along every inward
          // edge normal fits. Compute that bound once, rather than walking the polygon
          // for four corners in every bisection. Concave components/holes keep clipping.
          const containedScale = convex
            ? Math.min(
                ...halfPlanes.map(({ p, nx, ny }) => {
                  const support = (Math.abs(nx) * rootRatio + Math.abs(ny) / rootRatio) / 2;
                  return support > 0
                    ? (nx * (centre[0] - p[0]) + ny * (centre[1] - p[1])) / support
                    : Infinity;
                }),
              )
            : 0;
          let low = 0,
            high = Math.min(
              (box.maxX - box.minX) / Math.sqrt(ratio),
              (box.maxY - box.minY) * Math.sqrt(ratio),
              Math.sqrt(areaLimit),
            );
          for (let iteration = 0; iteration < 9; iteration++) {
            const scale = (low + high) / 2,
              width = scale * Math.sqrt(ratio),
              depth = scale / Math.sqrt(ratio);
            counter.tested++;
            const fits = convex
              ? scale <= containedScale
              : axisAlignedRectangleInside(centre, width, depth, [component]);
            if (fits) low = scale;
            else high = scale;
          }
          const width = low * Math.sqrt(ratio),
            depth = low / Math.sqrt(ratio);
          if (width + 1e-6 < minWidth || depth + 1e-6 < minDepth || width * depth <= bestArea)
            continue;
          const worldCentre = rotatePoint(centre, angle);
          const polygons = intersection(rectangle(worldCentre, width, depth, angle), region);
          if (area(polygons) > bestArea) {
            bestArea = area(polygons);
            best = { polygons, width, depth, centre: worldCentre, angle };
          }
        }
      }
  }
  return best;
}

function regionForFloor(slices: EnvelopeSlice[], base: number, top: number): MultiPolygon {
  const relevant = slices.filter((s) => s.baseM < top - 1e-8 && s.topM > base + 1e-8);
  if (!relevant.length || relevant[0].baseM > base + 1e-8 || relevant.at(-1)!.topM < top - 1e-8)
    return [];
  return relevant.reduce(
    (region, s) => (region === s.polygons ? region : intersection(region, s.polygons)),
    relevant[0].polygons,
  );
}

function modelCheck(
  id: string,
  title: string,
  actual: number,
  required: number,
  unit: string,
  pass: boolean,
  explanation: string,
): CheckResult {
  return {
    id,
    title,
    actual,
    required,
    unit,
    status: pass ? 'pass' : 'fail',
    scope: 'assumption',
    explanation,
    sourceIds: [],
  };
}

export function calculateResearch(
  input: SiteInput,
  options: { envelopeOnly?: boolean; prepared?: CalculationResult } = {},
): CalculationResult {
  const start = performance.now();
  const inputSignature = JSON.stringify(input);
  const prepared =
    options.prepared?.inputSignature === inputSignature &&
    options.prepared.rulesetVersion === RULESET_VERSION &&
    options.prepared.search?.tested === 0 &&
    options.prepared.designs.length === 0
      ? options.prepared
      : undefined;
  const checks = evaluateRules(input.use, { comprehensivePlanBaselineEstablished: true });
  const result: CalculationResult = {
    revision: input.revision,
    rulesetVersion: RULESET_VERSION,
    status: 'invalid',
    plot: [],
    plotAreaM2: 0,
    envelope: [],
    envelopeAreaM2: 0,
    designs: [],
    checks,
    diagnostics: [],
    durationMs: 0,
    slices: [],
    budgets: [],
    zoneMembership: 'unknown',
    search: { tested: 0, outcome: 'none', bounded: true },
    timingMs: { envelope: 0, designs: 0 },
    inputSignature,
  };
  const finish = () => ({
    ...result,
    durationMs: performance.now() - start + (prepared?.timingMs?.envelope ?? 0),
  });
  if (prepared) {
    Object.assign(result, structuredClone(prepared));
    if (prepared.status !== 'partial') return finish();
    result.diagnostics = [];
  }
  const parsed = assumptionsSchema.safeParse(input.assumptions);
  if (
    !parsed.success ||
    !projectSchema.safeParse(input.project ?? {}).success ||
    !['condominium', 'office'].includes(input.use)
  ) {
    result.diagnostics.push('Use finite, supported design assumptions and building type.');
    return finish();
  }
  if (
    input.geographicPlot.length > 1000 ||
    input.geographicPlot.some(
      (p) =>
        p.length !== 2 ||
        !p.every(Number.isFinite) ||
        Math.abs(p[0] - 100.6103) > 0.02 ||
        Math.abs(p[1] - 13.6979) > 0.02,
    )
  ) {
    result.diagnostics.push(
      'Keep the plot within the documented research extent and below 1,000 vertices. This is not a zoning boundary.',
    );
    return finish();
  }
  const raw = input.geographicPlot.map(toMetric);
  if (!raw.length) {
    result.status = 'empty';
    result.diagnostics.push('Draw at least three vertices to start a study.');
    return finish();
  }
  const validation = validateRing(raw);
  if (validation.errors.length) {
    result.diagnostics = validation.errors;
    return finish();
  }
  result.plot = [{ outer: validation.ring, holes: [] }];
  result.plotAreaM2 = area(result.plot);
  if (input.zone && !prepared) {
    const zone = input.zone.boundaryLonLat.map((p) => ({
      outer: p.outer.map(toMetric),
      holes: p.holes.map((r) => r.map(toMetric)),
    }));
    const insideArea = area(intersection(result.plot, zone));
    const membership =
      insideArea <= AREA_EPS
        ? 'outside'
        : result.plotAreaM2 - insideArea > AREA_EPS
          ? 'straddling'
          : 'inside';
    result.zoneMembership = input.zone.evidence === 'verified' ? membership : 'uncertain';
    if (input.zone.evidence === 'verified' && membership !== 'inside') {
      result.status = 'outside-zone';
      result.diagnostics.push(
        membership === 'straddling'
          ? 'The plot straddles the supported zone. Move the whole plot inside.'
          : 'The plot is outside the supported zone.',
      );
      return finish();
    }
    if (
      input.zone.evidence === 'verified' &&
      (input.zone.boundaryGuardM ?? input.zone.uncertaintyM ?? 0) > 0 &&
      area(
        difference(
          result.plot,
          inset(zone, input.zone.boundaryGuardM ?? input.zone.uncertaintyM ?? 0),
        ),
      ) > AREA_EPS
    )
      result.zoneMembership = 'uncertain';
  }
  const roads = input.roads ?? [],
    frontage = input.frontage ?? [];
  if (
    new Set(roads.map((r) => r.id)).size !== roads.length ||
    frontage.some(
      (f) =>
        !Number.isInteger(f.edgeIndex) ||
        f.edgeIndex < 0 ||
        f.edgeIndex >= raw.length ||
        !roads.some((r) => r.id === f.roadId),
    ) ||
    new Set(frontage.map((f) => f.edgeIndex)).size !== frontage.length ||
    roads.some(
      (r) =>
        r.widthM !== undefined && (!Number.isFinite(r.widthM) || r.widthM <= 0 || r.widthM > 200),
    )
  ) {
    result.diagnostics.push(
      'Each frontage needs a valid unique edge, an existing road and a width of 0–200 m when supplied.',
    );
    return finish();
  }
  // Remap physical edge segments after winding normalization; never silently reassign an edge.
  const bindings = frontage.map((f) => {
    const a = raw[f.edgeIndex],
      b = raw[(f.edgeIndex + 1) % raw.length];
    const same = (p: Point, q: Point) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-5;
    const edge = validation.ring.findIndex((p, i) => {
      const q = validation.ring[(i + 1) % validation.ring.length];
      return (same(p, a) && same(q, b)) || (same(p, b) && same(q, a));
    });
    return { edge, road: roads.find((r) => r.id === f.roadId)! };
  });
  if (bindings.some((b) => b.edge < 0)) {
    result.diagnostics.push('A frontage edge changed. Select the frontage again.');
    return finish();
  }
  const defaults = referenceProfile.designDefaults;
  const minWidth = input.assumptions.minWidthM ?? defaults.minWidthM,
    minDepth = input.assumptions.minDepthM ?? defaults.minDepthM,
    courtyard = input.assumptions.courtyardM ?? defaults.courtyardM;
  const permeable = input.assumptions.permeableFraction ?? defaults.permeableFraction;
  const { floors, floorHeightM, setbackM } = input.assumptions;
  const supportedHeight = v('highRiseThreshold') - 0.001;
  const maxFloors = Math.min(floors, Math.floor(supportedHeight / floorHeightM));
  const maxHeight = maxFloors * floorHeightM;
  // The BMA road rule also covers large buildings at low height. Before the
  // search knows the final floor area, conservatively use its plot-derived bound.
  const potentiallyLargeArea =
    Math.min(
      v('far') * result.plotAreaM2,
      maxFloors *
        result.plotAreaM2 *
        (1 - v(input.use === 'condominium' ? 'residentialUncovered' : 'officeUncovered')),
    ) > v('largeBuildingArea');
  if (floors * floorHeightM >= v('highRiseThreshold'))
    result.diagnostics.push(
      'High-rise requirements are unresolved. Research candidates are restricted below 23 m; this is a supported-study limit, not a legal height cap.',
    );
  const globalSide = maxHeight > v('boundaryHeightTier') ? v('boundaryHigh') : v('boundaryLow');
  const knownRoads = bindings.filter((b) => b.road.confirmed && b.road.widthM !== undefined);
  if (!bindings.length)
    result.diagnostics.push('No frontage is selected. Road-dependent legal checks remain unknown.');
  if (knownRoads.length < bindings.length)
    result.diagnostics.push(
      'Confirm each legally relevant road width. Unconfirmed widths do not constrain the research envelope or establish a pass.',
    );
  const heights = Array.from(
    new Set([
      0,
      ...Array.from({ length: maxFloors }, (_, i) => (i + 1) * floorHeightM),
      ...[v('boundaryHeightTier'), v('largeBuildingHeight')].filter((h) => h < maxHeight),
    ]),
  ).sort((a, b) => a - b);
  if (!prepared) {
    const insetCache = new Map<string, MultiPolygon>();
    const boundaryRegions: MultiPolygon = [];
    const roadRegions: MultiPolygon = [];
    const heightRegions: MultiPolygon = [];
    for (let k = 0; k < heights.length - 1; k++) {
      const baseM = heights[k],
        topM = heights[k + 1];
      const floorSide =
        topM > floorHeightM * (v('boundaryFloorTier') - 1) ? v('boundaryHigh') : v('boundaryLow');
      const distances = validation.ring.map(() =>
        Math.max(setbackM, globalSide, floorSide, input.assumptions.fireAccessRingM ?? 0),
      );
      const boundaryKey = distances.join(',');
      let boundary = insetCache.get(boundaryKey);
      if (!boundary) {
        boundary = edgeInset(validation.ring, distances);
        insetCache.set(boundaryKey, boundary);
        boundaryRegions.push(...difference(result.plot, boundary));
      }
      for (const { edge, road } of knownRoads) {
        const width = road.widthM!;
        const large =
          floors > v('largeRoadBuildingFloors') ||
          maxHeight > v('largeRoadBuildingHeight') ||
          potentiallyLargeArea ||
          input.use === 'office';
        const roadDistance = large
          ? width < v('roadMediumWidth')
            ? Math.max(0, v('roadCentrelineLarge') - width / 2)
            : width <= v('roadWideWidth')
              ? width * v('roadFraction')
              : v('roadWideSetback')
          : width < v('roadSmallWidth')
            ? Math.max(0, v('roadCentrelineSmall') - width / 2)
            : 0;
        distances[edge] = Math.max(distances[edge], roadDistance);
      }
      const key = distances.join(',');
      let polygons = insetCache.get(key);
      if (!polygons) {
        polygons = edgeInset(validation.ring, distances);
        insetCache.set(key, polygons);
      }
      if (key !== boundaryKey) roadRegions.push(...difference(boundary, polygons));
      const beforeHeight = polygons;
      for (const { edge, road } of knownRoads)
        polygons = clipRoadPlane(
          polygons,
          validation.ring[edge],
          validation.ring[(edge + 1) % validation.ring.length],
          topM / v('roadHeightFactor') - road.widthM!,
          signedArea(validation.ring),
        );
      result.slices!.push({
        baseM,
        topM,
        polygons,
        limitingRuleIds: [
          'boundary-setback',
          ...(knownRoads.length ? ['road-setback', 'height'] : []),
        ],
      });
      if (polygons !== beforeHeight) heightRegions.push(...difference(beforeHeight, polygons));
    }
    result.affectedRegions = {
      'boundary-setback': union(boundaryRegions),
      'road-setback': union(roadRegions),
      height: union(heightRegions),
    };
  }
  result.envelope = result.slices![0]?.polygons ?? [];
  result.envelopeAreaM2 = area(result.envelope);
  result.timingMs!.envelope = prepared?.timingMs?.envelope ?? performance.now() - start;
  if (result.envelopeAreaM2 < minWidth * minDepth) {
    result.status = 'empty';
    result.search!.outcome = 'proven-empty';
    result.diagnostics.push(
      'The reference exclusions leave no minimum-sized footprint. This proves no candidate under these study assumptions, not statutory infeasibility.',
    );
    return finish();
  }
  if (options.envelopeOnly) {
    result.status = 'partial';
    return finish();
  }
  const designStart = performance.now();
  const maxRoad = Math.max(0, ...knownRoads.map((b) => b.road.widthM!));
  const nearStation =
    input.transitDistanceM !== undefined && input.transitDistanceM <= v('stationExceptionDistance');
  const exceptionalAccess =
    nearStation ||
    maxRoad >=
      v(input.use === 'condominium' ? 'condoExceptionRoadWidth' : 'officeExceptionRoadWidth');
  const useArea =
    input.use === 'office'
      ? exceptionalAccess
        ? v('officeAreaMaximum')
        : v('officeAreaWithoutAccess')
      : exceptionalAccess
        ? Infinity
        : v('condoAreaWithoutAccess');
  const areaBudget = Math.min(
    v('far') * result.plotAreaM2,
    useArea,
    input.use === 'office'
      ? (input.project?.coreBasis?.officeOperationAreaM2 ?? Infinity)
      : Infinity,
    v('extraLargeBuildingArea') - AREA_EPS,
  );
  if (Math.min(v('far') * result.plotAreaM2, useArea) >= v('extraLargeBuildingArea'))
    result.diagnostics.push(
      `Extra-large-building requirements are unresolved. Research candidates are restricted below ${v('extraLargeBuildingArea')} m² gross modelled area as well as below ${v('highRiseThreshold')} m. This is a supported-study limit, not a legal maximum.`,
    );
  const uncoveredFraction = v(
    input.use === 'condominium' ? 'residentialUncovered' : 'officeUncovered',
  );
  const maximumFootprint = (count: number) =>
    Math.min(
      result.plotAreaM2 * (1 - uncoveredFraction),
      result.plotAreaM2 / (1 + v('osr') * count),
      areaBudget / count,
      input.project?.parkingSpaces === undefined
        ? Infinity
        : Math.max(
            count * floorHeightM >= v('largeBuildingHeight')
              ? v('largeBuildingIntermediateArea')
              : v('largeBuildingArea'),
            input.project.parkingSpaces * v('largeBuildingParkingAreaPerSpace'),
          ) / count,
    );
  const binding = bindings[0];
  const edgeAngle = binding
    ? Math.atan2(
        validation.ring[(binding.edge + 1) % validation.ring.length][1] -
          validation.ring[binding.edge][1],
        validation.ring[(binding.edge + 1) % validation.ring.length][0] -
          validation.ring[binding.edge][0],
      )
    : 0;
  const counter = { tested: 0 };
  const rejectedChecks: CheckResult[][] = [];
  let compact: Rectangle | null = null;
  let compactFloors = 0;
  let capacity = 0;
  // Search the requested count, then bounded fallback counts if footprint/area restrictions demand it.
  for (const count of Array.from(new Set([maxFloors, Math.max(1, Math.ceil(maxFloors / 2)), 1]))) {
    let region = regionForFloor(result.slices!, 0, count * floorHeightM);
    if (!region.length) continue;
    for (const degrees of [0, -15, 15, -30, 30]) {
      const candidate = compactRectangle(
        region,
        edgeAngle + (degrees * Math.PI) / 180,
        minWidth,
        minDepth,
        maximumFootprint(count),
        counter,
      );
      if (candidate && area(candidate.polygons) * count > capacity) {
        compact = candidate;
        compactFloors = count;
        capacity = area(candidate.polygons) * count;
      }
    }
  }
  function build(
    id: DesignResult['id'],
    shape: MultiPolygon,
    count: number,
    stepped: boolean,
    title: string,
  ): DesignResult | null {
    const generated: DesignResult['floors'] = [];
    let total = 0;
    for (let level = 0; level < count; level++) {
      let polygons = intersection(
        stepped ? inset(shape, Math.floor(level / 2) * defaults.terraceStepM) : shape,
        regionForFloor(result.slices!, level * floorHeightM, (level + 1) * floorHeightM),
      );
      if (!polygons.length || area(inset(polygons, Math.min(minWidth, minDepth) / 2)) < AREA_EPS)
        break;
      const floorArea = area(polygons);
      if (total + floorArea > areaBudget + AREA_EPS) break;
      generated.push({
        level: level + 1,
        baseM: level * floorHeightM,
        topM: (level + 1) * floorHeightM,
        polygons,
        areaM2: floorArea,
      });
      total += floorArea;
    }
    if (!generated.length) return null;
    const covered = union(generated.flatMap((f) => f.polygons));
    const footprint = area(covered),
      uncovered = Math.max(0, result.plotAreaM2 - footprint);
    const outside = generated.reduce(
      (sum, f) =>
        sum + area(difference(f.polygons, regionForFloor(result.slices!, f.baseM, f.topM))),
      0,
    );
    const screening = screenProject(input, generated, total, uncovered);
    const coreAssessment = assessCoreModel(
      input,
      generated,
      result.zoneMembership,
      screening.parking.groundAllowanceM2,
    );
    const researchChecks = [
      modelCheck(
        'model-study-classification',
        'Supported study classification',
        total,
        v('extraLargeBuildingArea'),
        'm², strict upper study bound',
        total < v('extraLargeBuildingArea') && generated.at(-1)!.topM < v('highRiseThreshold'),
        'The additional high-rise/extra-large regime is not fully implemented. Both height and modelled total area must remain below the supported-study thresholds.',
      ),
      modelCheck(
        'model-envelope',
        'Research envelope containment',
        outside,
        0,
        'm² outside',
        outside <= AREA_EPS,
        'Every rendered floor is checked over its complete height range. Reference rules remain unverified.',
      ),
      modelCheck(
        'model-far',
        'Reference FAR budget',
        total,
        v('far') * result.plotAreaM2,
        'm²',
        total <= v('far') * result.plotAreaM2 + AREA_EPS,
        'All rendered floor area is assumed counted for this study; statutory inclusions remain unresolved.',
      ),
      modelCheck(
        'model-open-space',
        'Reference uncovered ground',
        uncovered,
        Math.max(result.plotAreaM2 * uncoveredFraction, total * v('osr')),
        'm²',
        uncovered + AREA_EPS >= Math.max(result.plotAreaM2 * uncoveredFraction, total * v('osr')),
        'Research targets combine the historical OSR candidate and Bangkok uncovered-ground candidate.',
      ),
      modelCheck(
        'model-permeability',
        'Assumed permeable allocation',
        uncovered * permeable,
        uncovered * v('permeable'),
        'm²',
        permeable >= v('permeable'),
        'This is an allocated design assumption; a landscaping/site plan has not verified it.',
      ),
      modelCheck(
        'model-use',
        'Reference use/size restriction',
        total,
        Math.min(useArea, v('far') * result.plotAreaM2),
        'm²',
        total <= useArea + AREA_EPS,
        'Reference use exception uses confirmed study road width or the user-supplied station distance. These inputs do not establish legal evidence.',
      ),
    ];
    researchChecks.push(...screening.checks);
    if (researchChecks.some((c) => c.status === 'fail') || coreAssessment.status === 'fail') {
      const rejected = [...researchChecks, ...coreAssessment.checks];
      rejectedChecks.push(rejected);
      (result.rejectedCandidates ??= []).push({ id, title, checks: rejected });
      return null;
    }
    const legalChecks = evaluateRules(input.use, {
      comprehensivePlanBaselineEstablished: true,
      modelledAreaM2: total,
      modelledHeightM: generated.at(-1)!.topM,
      regulatedAreaM2: null,
      regulatedFar: null,
    });
    const proxies = [
      ['far', total / result.plotAreaM2, v('far'), 'ratio'],
      ['open-space', total ? uncovered / total : 0, v('osr'), 'ratio'],
      ['permeability', permeable, v('permeable'), 'ratio'],
      ['permitted-use', total, Math.min(useArea, v('far') * result.plotAreaM2), 'm²'],
    ] as const;
    for (const [id, actual, required, unit] of proxies) {
      const check = legalChecks.find((c) => c.id === id);
      if (check)
        Object.assign(check, {
          actual,
          required,
          unit,
          measurementBasis: 'modelled-proxy',
          explanation: `Model proxy only; the statutory definition and prerequisites are unresolved. ${check.explanation}`,
        });
    }
    const classification = legalChecks.find((c) => c.id === 'classification');
    if (classification)
      classification.explanation += ` Model height ${generated.at(-1)!.topM.toFixed(2)} m; gross area ${total.toFixed(2)} m². Reference large-building screening: ${total > v('largeBuildingArea') || (generated.at(-1)!.topM >= v('largeBuildingHeight') && total > v('largeBuildingIntermediateArea')) ? 'additional requirements may apply' : 'below the model area/height screen'}. Legal counting and current exceptions remain unresolved.`;
    const review = legalChecks.find((c) => c.id === 'environmental-review');
    if (review && input.use === 'condominium')
      review.explanation += ` The national reference screen includes ${v('eiaResidentialUnits')} units or ${v('eiaResidentialArea')} m² usable area. Declared unit count: ${input.project?.residentialUnits ?? 'unknown'}; estimated non-parking usable model capacity is ${screening.usableAreaM2.toFixed(2)} m² and is not a verified statutory usable-area measurement.`;
    const budgets: Budget[] = [
      {
        id: 'far',
        label: 'Reference floor-area budget',
        used: total,
        limit: v('far') * result.plotAreaM2,
        unit: 'm²',
        evidence: 'hypothesis',
        sourceIds: ['bma-2013'],
      },
      {
        id: 'open-space',
        label: 'Uncovered ground target',
        used: uncovered,
        limit: Math.max(result.plotAreaM2 * uncoveredFraction, total * v('osr')),
        unit: 'm² minimum',
        evidence: 'hypothesis',
        sourceIds: ['bma-2013', 'bma-building-2544'],
      },
    ];
    return {
      id,
      title,
      description:
        id === 'compact'
          ? 'A bounded frontage-oriented rectangle search.'
          : stepped
            ? 'Upper floors recede within every overlapping height slice.'
            : 'A perimeter block with a real courtyard void.',
      floors: screening.floors,
      coreAssessment,
      coveredGround: covered,
      footprintM2: footprint,
      grossFloorAreaM2: total,
      uncoveredM2: uncovered,
      heightM: generated.at(-1)!.topM,
      modelledFar: total / result.plotAreaM2,
      regulatedAreaM2: null,
      permeableAreaM2: null,
      modelledPermeableM2: uncovered * permeable,
      usableAreaM2: screening.usableAreaM2,
      parking: screening.parking,
      checks: [...researchChecks, ...legalChecks],
      compliance: complianceStatus(legalChecks),
      budgets,
      searchNote:
        'Bounded deterministic search; usable area excludes the assumed core/circulation fraction.',
    };
  }
  if (compact) {
    const first = build('compact', compact.polygons, compactFloors, false, 'Compact block');
    if (first) result.designs.push(first);
    let second: DesignResult | null = null;
    if (compact.width >= courtyard + 2 * minWidth && compact.depth >= courtyard + 2 * minDepth) {
      const voidGeometry = rectangle(compact.centre, courtyard, courtyard, compact.angle);
      second = build(
        'stepped',
        difference(compact.polygons, voidGeometry),
        compactFloors,
        false,
        'Courtyard block',
      );
    }
    if (!second)
      second = build('stepped', compact.polygons, compactFloors, true, 'Stepped terraces');
    if (second && (!first || Math.abs(second.grossFloorAreaM2 - first.grossFloorAreaM2) > AREA_EPS))
      result.designs.push(second);
  }
  result.search = {
    tested: counter.tested,
    outcome: result.designs.length >= 2 ? 'two' : result.designs.length === 1 ? 'one' : 'none',
    bounded: true,
  };
  result.timingMs!.designs = performance.now() - designStart;
  result.budgets = result.designs[0]?.budgets ?? [];
  result.checks = result.designs[0]?.checks ?? checks;
  result.status = result.designs.length ? 'partial' : 'insufficient-data';
  if (!result.designs.length && rejectedChecks.length) {
    result.checks = [...rejectedChecks[0], ...checks];
    result.diagnostics.push(
      ...rejectedChecks[0]
        .filter((c) => c.status === 'fail')
        .map(
          (c) =>
            `${c.title}: actual ${c.actual ?? 'unknown'}, required ${c.required ?? 'unknown'} ${c.unit ?? ''}. ${c.explanation}`,
        ),
    );
  }
  if (result.designs.length < 2)
    result.diagnostics.push(
      result.designs.length
        ? 'Only one distinct candidate was found under the bounded search.'
        : 'The bounded search found no usable concept. This is not proof of statutory infeasibility.',
    );
  if (result.designs.length && rejectedChecks.length) {
    const failed = [
      ...new Set(
        rejectedChecks.flatMap((set) =>
          set
            .filter((c) => c.status === 'fail')
            .map(
              (c) =>
                `${c.title}: actual ${c.actual ?? 'unknown'}, required ${c.required ?? 'unknown'} ${c.unit ?? ''}`,
            ),
        ),
      ),
    ];
    if (failed.length)
      result.diagnostics.push(
        `Additional bounded candidates failed implemented study checks: ${failed.join('; ')}. This does not prove every alternative fails.`,
      );
  }
  result.diagnostics.push(
    'Reference study only: current legal applicability, zone, parcel, road evidence, parking, fire access and environmental review are not fully verified.',
  );
  return finish();
}
