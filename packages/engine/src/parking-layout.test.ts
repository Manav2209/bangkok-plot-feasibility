import { describe, expect, it } from 'vitest';
import { area, difference, intersection, rotatePoint, union } from '@bangkok/geometry';
import type { MultiPolygon } from '@bangkok/domain';
import { packParking } from './parking-layout';
const region: MultiPolygon = [
  {
    outer: [
      [0, 0],
      [30, 0],
      [30, 20],
      [0, 20],
    ],
    holes: [],
  },
];
describe('schematic parking uses real contained and separated geometry', () => {
  it('packs stalls with the source dimensions, connected aisle reserve and core reserve', () => {
    const result = packParking(region, 0.12, 100);
    expect(result.stalls.length).toBeGreaterThan(0);
    expect(result.stallWidthM).toBe(2.4);
    expect(result.stallLengthM).toBe(5);
    expect(result.aisleWidthM).toBe(6);
    for (const stall of result.stalls) {
      expect(area([stall])).toBeCloseTo(12, 5);
      expect(area(difference([stall], region))).toBeLessThanOrEqual(0.001);
      expect(
        area(intersection([stall], [...result.aisles, ...result.serviceReserve])),
      ).toBeLessThanOrEqual(0.001);
    }
    expect(area(union(result.stalls))).toBeCloseTo(result.stalls.length * 12, 3);
    expect(area(result.serviceReserve)).toBeGreaterThanOrEqual(area(region) * 0.12 - 0.01);
    expect(result.scope).toBe('schematic');
  });
  it('preserves courtyard holes in all reserved geometry', () => {
    const hole: MultiPolygon = [
      {
        outer: [
          [12, 6],
          [18, 6],
          [18, 14],
          [12, 14],
        ],
        holes: [],
      },
    ];
    const courtyard = difference(region, hole);
    const result = packParking(courtyard, 0.12, 100);
    for (const shape of [...result.stalls, ...result.aisles, ...result.serviceReserve])
      expect(area(difference([shape], courtyard))).toBeLessThanOrEqual(0.001);
    expect(area(intersection(result.stalls, hole))).toBe(0);
  });
  it('handles rotated floors without changing capacity or modifying inputs', () => {
    const angled = region.map((p) => ({
      outer: p.outer.map((q) => rotatePoint(q, Math.PI / 7)),
      holes: [],
    }));
    const snapshot = JSON.stringify(angled);
    const a = packParking(region, 0.12, 100),
      b = packParking(angled, 0.12, 100);
    expect(b.stalls.length).toBe(a.stalls.length);
    expect(JSON.stringify(angled)).toBe(snapshot);
  });
  it('honours requested count and the explicit bounded search limit', () => {
    expect(packParking(region, 0.12, 3).stalls).toHaveLength(3);
    expect(packParking(region, 0.12, 0).stalls).toHaveLength(0);
    expect(
      packParking(
        [
          {
            outer: [
              [0, 0],
              [200, 0],
              [200, 200],
              [0, 200],
            ],
            holes: [],
          },
        ],
        0,
        1000,
      ).stalls,
    ).toHaveLength(200);
  });
  it('returns no perpendicular layout for a narrow floor rather than clipping stalls into slivers', () => {
    expect(
      packParking(
        [
          {
            outer: [
              [0, 0],
              [3, 0],
              [3, 30],
              [0, 30],
            ],
            holes: [],
          },
        ],
        0.12,
        10,
      ).stalls,
    ).toHaveLength(0);
  });
});
