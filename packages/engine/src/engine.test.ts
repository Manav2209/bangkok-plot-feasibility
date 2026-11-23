import { describe, expect, it } from 'vitest';
import { area, difference, SAMPLE_PLOT, toGeographic } from '@bangkok/geometry';
import type { SiteInput } from '@bangkok/domain';
import { calculate } from './index';

const input = (): SiteInput => ({
  revision: 1,
  geographicPlot: SAMPLE_PLOT,
  use: 'condominium',
  assumptions: { setbackM: 3, floors: 6, floorHeightM: 3.2 },
});

describe('massing accounting', () => {
  it('matches the manually worked L-shaped example floor by floor', () => {
    const output = calculate(input());
    expect(output.status).toBe('partial');
    expect(output.plotAreaM2).toBeCloseTo(2500, 5);
    expect(output.envelopeAreaM2).toBe(1876);
    expect(output.designs).toHaveLength(2);
    expect(output.designs[0].grossFloorAreaM2).toBe(11256);
    expect(output.designs[1].grossFloorAreaM2).toBe(9064);
    expect(output.designs[1].floors.map((floor) => floor.areaM2)).toEqual([
      1876, 1876, 1500, 1500, 1156, 1156,
    ]);
  });
  it('uses the same polygons for all metrics and preserves containment', () => {
    const output = calculate(input());
    for (const design of output.designs) {
      for (const floor of design.floors) {
        expect(area(floor.polygons)).toBe(floor.areaM2);
        expect(area(difference(floor.polygons, output.envelope))).toBeLessThan(0.01);
      }
      expect(design.grossFloorAreaM2).toBe(
        design.floors.reduce((sum, floor) => sum + floor.areaM2, 0),
      );
      expect(design.uncoveredM2).toBeCloseTo(output.plotAreaM2 - area(design.coveredGround), 6);
      expect(design.uncoveredM2).toBeGreaterThanOrEqual(0);
    }
  });
  it('keeps all unresolved legal prerequisites unknown', () => {
    const output = calculate(input());
    expect(
      output.checks
        .filter((check) => check.id !== 'assumed-setback')
        .every((check) => check.status === 'unknown'),
    ).toBe(true);
    expect(output.rulesetVersion).toBe('research-preview.5');
    expect(output.status).not.toBe('pass');
    for (const design of output.designs) {
      expect(design.compliance).toBe('unknown');
      expect(design.regulatedAreaM2).toBeNull();
      expect(design.permeableAreaM2).toBeNull();
      expect(
        design.checks
          .filter((check) => check.scope === 'statutory')
          .every((check) => check.status === 'unknown'),
      ).toBe(true);
      expect(design.checks.find((check) => check.id === 'assumed-setback')).toMatchObject({
        actual: 0,
        required: 0,
        status: 'pass',
        scope: 'assumption',
      });
    }
    expect(output.designs[0].checks).not.toBe(output.designs[1].checks);
  });
  it('returns only one concept when terraces would be identical', () => {
    const site = input();
    site.assumptions.floors = 2;
    const output = calculate(site);
    expect(output.designs).toHaveLength(1);
    expect(output.diagnostics.join()).toContain('one distinct');
  });
  it('returns an honest empty result for a consumed site', () => {
    const site = input();
    site.assumptions.setbackM = 50;
    const output = calculate(site);
    expect(output.status).toBe('empty');
    expect(output.designs).toHaveLength(0);
  });
  it('rejects invalid plot geometry without retaining old metrics', () => {
    const site = input();
    site.geographicPlot = [
      [0, 0],
      [30, 30],
      [0, 30],
      [30, 0],
    ].map((p) => toGeographic(p as [number, number]));
    const output = calculate(site);
    expect(output.status).toBe('invalid');
    expect(output.plotAreaM2).toBe(0);
    expect(output.designs).toHaveLength(0);
  });
  it.each([NaN, -1, 101])('rejects unsafe inset %s', (setbackM) => {
    const site = input();
    site.assumptions.setbackM = setbackM;
    expect(calculate(site).status).toBe('invalid');
  });
  it.each([0, 1.5, 31])('rejects unsupported floor count %s', (floors) => {
    const site = input();
    site.assumptions.floors = floors;
    expect(calculate(site).status).toBe('invalid');
  });
  it('rejects outside-window input and preserves revision IDs', () => {
    const site = input();
    site.revision = 42;
    site.geographicPlot = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    const output = calculate(site);
    expect(output.status).toBe('invalid');
    expect(output.revision).toBe(42);
  });
  it('is deterministic apart from measured duration', () => {
    const a = calculate(input()),
      b = calculate(input());
    expect({ ...a, durationMs: 0 }).toEqual({ ...b, durationMs: 0 });
  });
});
