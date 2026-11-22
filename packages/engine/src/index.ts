import type { CalculationResult, DesignResult, MultiPolygon, SiteInput } from '@bangkok/domain';
import { area, inset, toMetric, validateRing } from '@bangkok/geometry';
import { RULESET_VERSION, unresolvedChecks } from '@bangkok/rules';

/** Deterministic geometry experiment. This intentionally cannot return a legal feasibility pass. */
export function calculate(input: SiteInput): CalculationResult {
  const start = performance.now();
  const result: CalculationResult = {
    revision: input.revision,
    rulesetVersion: RULESET_VERSION,
    status: 'invalid',
    plot: [],
    plotAreaM2: 0,
    envelope: [],
    envelopeAreaM2: 0,
    designs: [],
    checks: unresolvedChecks(),
    diagnostics: [],
    durationMs: 0,
  };
  const finish = () => ({ ...result, durationMs: performance.now() - start });
  const { setbackM, floors, floorHeightM } = input.assumptions;
  if (
    !Number.isFinite(setbackM) ||
    setbackM < 0 ||
    setbackM > 100 ||
    !Number.isInteger(floors) ||
    floors < 1 ||
    floors > 30 ||
    !Number.isFinite(floorHeightM) ||
    floorHeightM < 2 ||
    floorHeightM > 6
  ) {
    result.diagnostics.push(
      'Use a setback of 0–100 m, 1–30 whole floors and a floor height of 2–6 m.',
    );
    return finish();
  }
  if (input.use !== 'condominium') {
    result.diagnostics.push('Only the condominium massing experiment is available.');
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
      'Keep the plot within the approximately 4 km research window and below 1,000 vertices. This window is not a zoning boundary.',
    );
    return finish();
  }
  const validation = validateRing(input.geographicPlot.map(toMetric));
  if (validation.errors.length) {
    result.diagnostics = validation.errors;
    return finish();
  }
  result.plot = [{ outer: validation.ring, holes: [] }];
  result.plotAreaM2 = area(result.plot);
  result.envelope = inset(result.plot, setbackM);
  result.envelopeAreaM2 = area(result.envelope);
  result.status = result.envelopeAreaM2 < 1 ? 'empty' : 'partial';
  if (result.status === 'empty') {
    result.diagnostics.push(
      'The assumed inset leaves no footprint of at least 1 m². Reduce it or enlarge the plot.',
    );
    return finish();
  }
  function design(id: DesignResult['id']): DesignResult | null {
    const floorGeometry: DesignResult['floors'] = [];
    let footprint: MultiPolygon = result.envelope;
    for (let level = 0; level < floors; level++) {
      // A nested upper floor keeps the covered projection equal to the ground footprint.
      const polygons =
        id === 'stepped' ? inset(result.envelope, Math.floor(level / 2) * 2) : result.envelope;
      const areaM2 = area(polygons);
      if (areaM2 < 1) break;
      if (level === 0) footprint = polygons;
      floorGeometry.push({
        level: level + 1,
        baseM: level * floorHeightM,
        topM: (level + 1) * floorHeightM,
        polygons,
        areaM2,
      });
    }
    if (!floorGeometry.length) return null;
    const grossFloorAreaM2 = floorGeometry.reduce((sum, floor) => sum + floor.areaM2, 0);
    return {
      id,
      title: id === 'compact' ? 'Compact block' : 'Stepped terraces',
      description:
        id === 'compact'
          ? 'A constant floor plate inside the assumed inset.'
          : 'Upper floors recede by 2 m every two levels.',
      floors: floorGeometry,
      coveredGround: footprint,
      footprintM2: area(footprint),
      grossFloorAreaM2,
      uncoveredM2: result.plotAreaM2 - area(footprint),
      heightM: floorGeometry.at(-1)!.topM,
      modelledFar: grossFloorAreaM2 / result.plotAreaM2,
    };
  }
  const compact = design('compact'),
    stepped = design('stepped');
  if (compact) result.designs.push(compact);
  if (stepped && compact && Math.abs(compact.grossFloorAreaM2 - stepped.grossFloorAreaM2) > 0.01)
    result.designs.push(stepped);
  else
    result.diagnostics.push(
      'These inputs produce only one distinct massing. Try at least three floors for terraces.',
    );
  result.checks.unshift({
    id: 'assumed-setback',
    title: 'Assumed boundary inset',
    status: 'pass',
    actual: setbackM,
    required: setbackM,
    unit: 'm',
    explanation:
      'Applied geometrically to every plot edge. This checks the chosen assumption, not a statutory requirement.',
    sourceIds: [],
  });
  return finish();
}
