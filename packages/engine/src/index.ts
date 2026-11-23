import type { CalculationResult, DesignResult, MultiPolygon, SiteInput } from '@bangkok/domain';
import { area, difference, inset, toMetric, validateRing } from '@bangkok/geometry';
import { complianceStatus, evaluateRules, RULESET_VERSION, unresolvedChecks } from '@bangkok/rules';
import { calculateResearch } from './research';

/** Deterministic geometry experiment. This intentionally cannot return a legal feasibility pass. */
export function calculate(input: SiteInput, prepared?: CalculationResult): CalculationResult {
  if (input.researchConstraints) return calculateResearch(input, { prepared });
  if (input.zone) {
    const gate = calculateResearch({ ...input, researchConstraints: true }, { envelopeOnly: true });
    if (gate.status === 'outside-zone') return gate;
  }
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
  if (!['condominium', 'office'].includes(input.use)) {
    result.diagnostics.push('Choose condominium or office.');
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
    const heightM = floorGeometry.at(-1)!.topM;
    const outsideM2 = floorGeometry.reduce(
      (sum, floor) => sum + area(difference(floor.polygons, result.envelope)),
      0,
    );
    const checks = evaluateRules(input.use, {
      modelledAreaM2: grossFloorAreaM2,
      modelledHeightM: heightM,
      modelledUncoveredM2: result.plotAreaM2 - area(footprint),
      // Statutory quantities deliberately stay absent until sourced definitions exist.
      regulatedAreaM2: null,
      regulatedFar: null,
      regulatedOpenSpaceRatio: null,
      permeableOpenSpaceRatio: null,
    });
    checks.unshift({
      id: 'assumed-setback',
      title: 'Assumed boundary inset',
      scope: 'assumption',
      status: outsideM2 <= 0.01 ? 'pass' : 'fail',
      actual: outsideM2,
      required: 0,
      unit: 'm² outside',
      explanation: `Independently measured floor area outside the chosen ${setbackM} m uniform inset. A 0.01 m² clipping tolerance applies; this is a design assumption, not a statutory setback.`,
      sourceIds: [],
    });
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
      heightM,
      modelledFar: grossFloorAreaM2 / result.plotAreaM2,
      regulatedAreaM2: null,
      permeableAreaM2: null,
      checks,
      compliance: complianceStatus(checks),
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
  // Kept for input-wide diagnostics; the UI uses the selected design's independent checks.
  result.checks = result.designs[0]?.checks ?? unresolvedChecks();
  return finish();
}

export function calculateEnvelope(input: SiteInput): CalculationResult {
  if (input.researchConstraints) return calculateResearch(input, { envelopeOnly: true });
  const result = calculate(input);
  return { ...result, designs: [] };
}
