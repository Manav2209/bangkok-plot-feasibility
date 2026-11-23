import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { area, capsule, difference, edgeInset, intersection, union } from './index';
import type { MultiPolygon } from '@bangkok/domain';
describe('segment-distance exclusions', () => {
  it('agrees with a hand-computed rectangle inset within the documented grid guard', () => {
    const ring: [number, number][] = [
      [0, 0],
      [50, 0],
      [50, 40],
      [0, 40],
    ];
    const result = edgeInset(ring, [3, 3, 3, 3]);
    expect(area(result)).toBeCloseTo((44 - 0.004) * (34 - 0.004), 2);
    expect(area(difference(result, [{ outer: ring, holes: [] }]))).toBe(0);
  });
  it('caps segment ends conservatively and preserves true voids in unions', () => {
    expect(capsule([0, 0], [10, 0], 3).flatMap((p) => p.outer).length).toBeGreaterThanOrEqual(128);
    const outer: MultiPolygon = [
      {
        outer: [
          [0, 0],
          [20, 0],
          [20, 20],
          [0, 20],
        ],
        holes: [
          [
            [5, 5],
            [15, 5],
            [15, 15],
            [5, 15],
          ],
        ],
      },
    ];
    expect(area(union(outer))).toBe(300);
    expect(area(intersection(outer, outer))).toBe(300);
  });
  it('never gains area when setback distances increase', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 8, noNaN: true }),
        fc.double({ min: 0, max: 8, noNaN: true }),
        (a, b) => {
          const ring: [number, number][] = [
            [0, 0],
            [40, 0],
            [40, 40],
            [0, 40],
          ];
          const small = edgeInset(ring, Array(4).fill(Math.min(a, b))),
            large = edgeInset(ring, Array(4).fill(Math.max(a, b)));
          expect(area(difference(large, small))).toBeLessThanOrEqual(0.01);
        },
      ),
      { numRuns: 50, seed: 20261122 },
    );
  });
});
