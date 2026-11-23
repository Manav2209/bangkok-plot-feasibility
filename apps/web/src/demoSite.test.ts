import { describe, expect, it } from 'vitest';
import { area, SAMPLE_PLOT, toMetric } from '@bangkok/geometry';
import { defaultScenario } from './scenario';
import { demoRoad } from './demoSite';
import { roadModels } from './roadModels';
import type { ContextCollection } from './useSiteData';

const context: ContextCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'road', sourceId: demoRoad.sourceId },
      geometry: { type: 'LineString', coordinates: demoRoad.segment },
    },
  ],
};
describe('road-aligned illustrative example', () => {
  it('keeps the entire frontage on the straight segment and offsets its boundary by half the assumed width', () => {
    const scenario = defaultScenario();
    expect(scenario.plot).toHaveLength(4);
    expect(area([{ outer: scenario.plot.map(toMetric), holes: [] }])).toBeCloseTo(2500, 5);
    const ring = scenario.plot.map(toMetric);
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % 4],
        c = ring[(i + 2) % 4];
      expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeCloseTo(50, 5);
      expect((b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1])).toBeCloseTo(0, 4);
    }
    expect(scenario.assumptions).toMatchObject({ setbackM: 5, floors: 4 });
    const model = roadModels(
      scenario.plot,
      scenario.roads,
      scenario.frontage,
      undefined,
      context,
    )[0];
    expect(model.mappedOffsetM).toBeLessThan(0.00001);
    const a = toMetric(demoRoad.segment[0]),
      b = toMetric(demoRoad.segment[1]);
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (const point of model.section.centreline) {
      const along =
        ((point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1])) / length;
      expect(along).toBeGreaterThan(0);
      expect(along).toBeLessThanOrEqual(length - 75 + 0.00001);
    }
    expect(scenario.roads[0].confirmed).toBe(false);
    expect(scenario.roads[0].widthProvenance).toBe('user');
  });
  it('exposes the misalignment of the old example instead of treating its plot inset as mapped-road clearance', () => {
    const scenario = defaultScenario();
    const old = roadModels(SAMPLE_PLOT, scenario.roads, scenario.frontage, undefined, context)[0];
    expect(old.mappedOffsetM).toBeGreaterThan(10);
  });
});
