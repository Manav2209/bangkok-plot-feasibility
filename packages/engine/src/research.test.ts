import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { SiteInput, ZoneInput } from '@bangkok/domain';
import { area, difference, SAMPLE_PLOT, toGeographic } from '@bangkok/geometry';
import { calculate, calculateEnvelope } from './index';

const site = (): SiteInput => ({
  revision: 1,
  geographicPlot: SAMPLE_PLOT,
  use: 'condominium',
  assumptions: { setbackM: 3, floors: 6, floorHeightM: 3.2 },
  researchConstraints: true,
  roads: [
    {
      id: 'road',
      name: 'Synthetic study road',
      geometry: [SAMPLE_PLOT[0], SAMPLE_PLOT[1]],
      widthM: 8,
      widthProvenance: 'user',
      confirmed: true,
    },
  ],
  frontage: [{ edgeIndex: 0, roadId: 'road' }],
});
describe('reference envelope and independently checked concepts', () => {
  it('keeps dense convex searches contained and stable under reversed vertex order', () => {
    const input = site();
    input.geographicPlot = Array.from({ length: 100 }, (_, i) =>
      toGeographic([
        Math.cos((i / 100) * Math.PI * 2) * 20,
        Math.sin((i / 100) * Math.PI * 2) * 20,
      ]),
    );
    input.roads = [];
    input.frontage = [];
    const forward = calculate(input);
    const reverse = calculate({ ...input, geographicPlot: [...input.geographicPlot].reverse() });
    expect(forward.designs.length).toBeGreaterThan(0);
    expect(reverse.designs.map((d) => d.grossFloorAreaM2)).toEqual(
      forward.designs.map((d) => d.grossFloorAreaM2),
    );
    for (const result of [forward, reverse])
      for (const design of result.designs)
        for (const floor of design.floors)
          for (const slice of result.slices!.filter(
            (s) => s.baseM < floor.topM && s.topM > floor.baseM,
          ))
            expect(area(difference(floor.polygons, slice.polygons))).toBeLessThanOrEqual(0.01);
  });
  it('does not bypass the extra-large regime merely by remaining below 23m', () => {
    const input = site();
    input.geographicPlot = (
      [
        [0, 0],
        [80, 0],
        [80, 80],
        [0, 80],
      ] as [number, number][]
    ).map(toGeographic);
    input.roads = [];
    input.frontage = [];
    input.transitDistanceM = 0;
    const result = calculate(input);
    expect(result.diagnostics.join(' ')).toContain('Extra-large-building requirements');
    expect(result.designs.length).toBeGreaterThan(0);
    for (const d of result.designs) {
      expect(d.heightM).toBeLessThan(23);
      expect(d.grossFloorAreaM2).toBeLessThan(10000);
      expect(d.compliance).toBe('unknown');
    }
  });
  it('reuses only an exact-input envelope without mutating it or accepting stale preparation', () => {
    const input = site(),
      prepared = calculateEnvelope(input),
      before = JSON.stringify(prepared);
    const fresh = calculate(input),
      reused = calculate(input, prepared);
    expect(reused.designs).toEqual(fresh.designs);
    expect(JSON.stringify(prepared)).toBe(before);
    const changed = site();
    changed.assumptions.floors = 3;
    expect(calculate(changed, prepared).designs).toEqual(calculate(changed).designs);
  });
  it('produces two distinct measured concepts without a legal feasibility pass', () => {
    const result = calculate(site());
    expect(result.designs).toHaveLength(2);
    expect(result.designs[0].grossFloorAreaM2).not.toBe(result.designs[1].grossFloorAreaM2);
    expect(result.slices!.length).toBeGreaterThan(1);
    for (const design of result.designs) {
      expect(design.compliance).toBe('unknown');
      expect(design.checks.find((c) => c.id === 'legal-version')?.status).toBe('pass');
      expect(design.checks.some((c) => c.scope === 'statutory' && c.status === 'unknown')).toBe(
        true,
      );
      expect(
        design.checks.filter((c) => c.scope === 'assumption').every((c) => c.status !== 'fail'),
      ).toBe(true);
      expect(design.grossFloorAreaM2).toBe(
        design.floors.reduce((sum, f) => sum + area(f.polygons), 0),
      );
      expect(design.uncoveredM2 + area(design.coveredGround)).toBeCloseTo(result.plotAreaM2, 5);
      for (const floor of design.floors)
        for (const slice of result.slices!.filter(
          (s) => s.baseM < floor.topM && s.topM > floor.baseM,
        ))
          expect(area(difference(floor.polygons, slice.polygons))).toBeLessThanOrEqual(0.01);
    }
  });
  it('changes office size capacity at the researched road exception while retaining unknown evidence', () => {
    const narrow = site();
    narrow.use = 'office';
    const a = calculate(narrow);
    const wide = structuredClone(narrow);
    wide.roads![0].widthM = 16;
    const b = calculate(wide);
    expect(a.designs[0].grossFloorAreaM2).toBeLessThanOrEqual(1000.01);
    expect(b.designs[0].grossFloorAreaM2).toBeGreaterThan(1000);
    expect(b.designs[0].compliance).toBe('unknown');
    expect(b.designs[0].grossFloorAreaM2).toBeLessThanOrEqual(10000.01);
  });
  it('never treats an unconfirmed road as verified access evidence', () => {
    const input = site();
    input.use = 'office';
    input.roads![0].widthM = 30;
    input.roads![0].confirmed = false;
    const output = calculate(input);
    expect(output.designs[0].grossFloorAreaM2).toBeLessThanOrEqual(1000.01);
    expect(output.diagnostics.join(' ')).toContain('Confirm');
    expect(output.designs[0].checks.find((c) => c.id === 'road-setback')?.status).toBe('unknown');
  });
  it('intersects all selected frontage height planes', () => {
    const input = site();
    input.assumptions.floors = 7;
    input.roads![0].widthM = 2;
    input.roads!.push({ ...input.roads![0], id: 'other' });
    input.frontage!.push({ edgeIndex: 5, roadId: 'other' });
    const output = calculateEnvelope(input);
    expect(area(output.slices!.at(-1)!.polygons)).toBeLessThan(output.envelopeAreaM2);
    // Frontage0 points east, so its inward normal points north in the original sample frame.
    for (const slice of output.slices!)
      for (const polygon of slice.polygons)
        for (const point of polygon.outer) {
          expect(point[1] - -30 + 2 + 0.002).toBeGreaterThanOrEqual(slice.topM / 2);
        }
  });
  it('keeps full-building setback requirements at ground level', () => {
    const input = site();
    input.assumptions.setbackM = 0;
    input.roads = [];
    input.frontage = [];
    const output = calculateEnvelope(input);
    // Whole-building height exceeds9m, so the reference3m setback applies even at the first slice.
    expect(output.slices![0].polygons.flatMap((p) => p.outer).every((p) => p[0] >= -77.001)).toBe(
      true,
    );
  });
  it('returns a current-revision envelope without starting design search', () => {
    const input = site();
    input.revision = 42;
    const output = calculateEnvelope(input);
    expect(output.revision).toBe(42);
    expect(output.designs).toEqual([]);
    expect(output.search!.tested).toBe(0);
    expect(output.timingMs!.designs).toBe(0);
  });
  it('caps high-rise study requests honestly rather than inventing additional requirements', () => {
    const input = site();
    input.assumptions.floors = 20;
    const output = calculate(input);
    expect(output.diagnostics.join(' ')).toContain('High-rise requirements are unresolved');
    expect(output.designs.every((d) => d.heightM < 23)).toBe(true);
  });
  it('handles empty, invalid and collapsed studies separately', () => {
    const empty = site();
    empty.geographicPlot = [];
    expect(calculate(empty).status).toBe('empty');
    const invalid = site();
    invalid.assumptions.floors = 0;
    expect(calculate(invalid).status).toBe('invalid');
    const collapsed = site();
    collapsed.assumptions.setbackM = 100;
    expect(calculate(collapsed).search?.outcome).toBe('proven-empty');
  });
});

describe('authoritative-boundary contract with explicitly synthetic zone fixtures', () => {
  const zone: ZoneInput = {
    id: 'synthetic-zone',
    evidence: 'verified',
    sourceUrl: 'https://example.test/zone',
    uncertaintyM: 0,
    boundaryLonLat: [
      {
        outer: [
          [-100, -50],
          [0, -50],
          [0, 50],
          [-100, 50],
        ].map((p) => toGeographic(p as [number, number])),
        holes: [],
      },
    ],
  };
  it('checks the whole plot rather than its centroid and disables both model modes outside', () => {
    const inside = site();
    inside.zone = zone;
    expect(calculateEnvelope(inside).zoneMembership).toBe('inside');
    const straddling = site();
    straddling.zone = {
      ...zone,
      boundaryLonLat: [
        {
          outer: [
            [-100, -50],
            [-30, -50],
            [-30, 50],
            [-100, 50],
          ].map((p) => toGeographic(p as [number, number])),
          holes: [],
        },
      ],
    };
    expect(calculate(straddling).status).toBe('outside-zone');
    expect(calculate(straddling).zoneMembership).toBe('straddling');
    const outside = site();
    outside.zone = {
      ...zone,
      boundaryLonLat: [
        {
          outer: [
            [100, 100],
            [200, 100],
            [200, 200],
            [100, 200],
          ].map((p) => toGeographic(p as [number, number])),
          holes: [],
        },
      ],
    };
    outside.researchConstraints = false;
    expect(calculate(outside).status).toBe('outside-zone');
  });
});

describe('generated geometry invariants', () => {
  it('preserves containment and deterministic envelopes under winding reversal', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 35, max: 60, noNaN: true }), { minLength: 8, maxLength: 30 }),
        (radii) => {
          const input = site();
          input.roads = [];
          input.frontage = [];
          input.geographicPlot = radii.map((r, i) =>
            toGeographic([
              Math.cos((i / radii.length) * Math.PI * 2) * r - 60,
              Math.sin((i / radii.length) * Math.PI * 2) * r,
            ]),
          );
          const a = calculateEnvelope(input);
          input.geographicPlot.reverse();
          const b = calculateEnvelope(input);
          expect(a.status).toBe('partial');
          expect(b.envelopeAreaM2).toBeCloseTo(a.envelopeAreaM2, 2);
          expect(area(difference(a.envelope, a.plot))).toBeLessThanOrEqual(0.01);
        },
      ),
      { numRuns: 20, seed: 20261122 },
    );
  });
});
