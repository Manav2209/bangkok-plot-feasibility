import { describe, expect, it } from 'vitest';
import type { MultiPolygon, Ring } from '@bangkok/domain';
import {
  area,
  difference,
  inset,
  ORIGIN,
  SAMPLE_METRIC,
  signedArea,
  toGeographic,
  toMetric,
  validateRing,
} from './index';

const polygon = (outer: Ring): MultiPolygon => [{ outer, holes: [] }];
const rectangle = polygon([
  [0, 0],
  [50, 0],
  [50, 40],
  [0, 40],
]);

describe('independently specified metric fixtures', () => {
  it('measures a rectangle and its analytic 3 m inset', () => {
    expect(area(rectangle)).toBe(2000);
    expect(area(inset(rectangle, 3))).toBe(44 * 34);
  });
  it('preserves the L-shaped concavity instead of using a bounding rectangle', () => {
    expect(area(polygon(SAMPLE_METRIC))).toBe(2500);
    expect(area(inset(polygon(SAMPLE_METRIC), 3))).toBe(54 * 24 + 29 * 20);
  });
  it('insets a 30–40–50 right triangle by its known inradius', () => {
    const triangle = polygon([
      [0, 0],
      [40, 0],
      [0, 30],
    ]);
    expect(area(inset(triangle, 2))).toBeCloseTo(600 * 0.8 ** 2, 1);
    expect(inset(triangle, 10)).toEqual([]);
  });
  it('returns no geometry when the setback consumes the plot', () => {
    expect(inset(rectangle, 20)).toEqual([]);
    expect(inset(rectangle, 100)).toEqual([]);
  });
  it('preserves disconnected components when a narrow neck collapses', () => {
    const dumbbell = polygon([
      [0, 0],
      [20, 0],
      [20, 9],
      [30, 9],
      [30, 0],
      [50, 0],
      [50, 20],
      [30, 20],
      [30, 11],
      [20, 11],
      [20, 20],
      [0, 20],
    ]);
    const output = inset(dumbbell, 2);
    expect(output).toHaveLength(2);
    expect(area(output)).toBe(512);
    expect(area(difference(output, dumbbell))).toBe(0);
  });
  it('expands holes while shrinking the outside boundary', () => {
    const courtyard: MultiPolygon = [
      {
        outer: [
          [0, 0],
          [40, 0],
          [40, 40],
          [0, 40],
        ],
        holes: [
          [
            [10, 10],
            [30, 10],
            [30, 30],
            [10, 30],
          ],
        ],
      },
    ];
    const output = inset(courtyard, 2);
    expect(output[0].holes).toHaveLength(1);
    expect(area(output)).toBe(36 * 36 - 24 * 24);
  });
  it('keeps holes produced by a boolean difference', () => {
    const output = difference(
      rectangle,
      polygon([
        [10, 10],
        [20, 10],
        [20, 20],
        [10, 20],
      ]),
    );
    expect(output[0].holes).toHaveLength(1);
    expect(area(output)).toBe(1900);
  });
  it('is stable under winding reversal and vertex rotation', () => {
    const expected = area(inset(rectangle, 3));
    expect(area(inset(polygon([...rectangle[0].outer].reverse()), 3))).toBe(expected);
    const ring = rectangle[0].outer;
    expect(area(inset(polygon([...ring.slice(2), ...ring.slice(0, 2)]), 3))).toBe(expected);
  });
  it('never creates area outside the original polygon at an acute corner', () => {
    const acute = polygon([
      [0, 0],
      [100, 0],
      [2, 3],
    ]);
    const output = inset(acute, 0.2);
    expect(area(output)).toBeLessThan(area(acute));
    expect(area(difference(output, acute))).toBeLessThan(0.01);
  });
  it('rejects a negative or nonfinite inset', () => {
    expect(() => inset(rectangle, -1)).toThrow();
    expect(() => inset(rectangle, NaN)).toThrow();
  });
});

describe('plot validation', () => {
  it.each([
    [
      'self-crossing',
      [
        [0, 0],
        [40, 40],
        [0, 40],
        [40, 0],
      ],
    ],
    [
      'repeated vertex',
      [
        [0, 0],
        [40, 0],
        [40, 40],
        [0, 0],
        [0, 40],
      ],
    ],
    [
      'tiny area',
      [
        [0, 0],
        [0.1, 0],
        [0, 0.1],
      ],
    ],
    [
      'too few points',
      [
        [0, 0],
        [5, 0],
      ],
    ],
    [
      'nonfinite vertex',
      [
        [0, 0],
        [5, NaN],
        [0, 5],
      ],
    ],
    [
      'touching nonadjacent edge',
      [
        [0, 0],
        [40, 0],
        [40, 40],
        [20, 0],
        [0, 40],
      ],
    ],
    [
      'overlapping adjacent edge',
      [
        [0, 0],
        [20, 0],
        [10, 0],
        [10, 20],
        [0, 20],
      ],
    ],
  ] as [string, Ring][])('rejects %s', (_, ring) => {
    expect(validateRing(ring).errors.length).toBeGreaterThan(0);
  });
  it('accepts closed rings, collinear forward vertices, concavity and reverse winding', () => {
    const result = validateRing([
      [0, 0],
      [0, 40],
      [50, 40],
      [50, 0],
      [25, 0],
      [0, 0],
    ]);
    expect(result.errors).toEqual([]);
    expect(result.ring).toHaveLength(5);
    expect(signedArea(result.ring)).toBe(2000);
    expect(validateRing(SAMPLE_METRIC).errors).toEqual([]);
  });
});

describe('WGS84 / UTM47N metric frame', () => {
  it('projects the origin to zero and preserves a metric round trip', () => {
    expect(toMetric(ORIGIN)).toEqual([0, 0]);
    for (const p of SAMPLE_METRIC) {
      const actual = toMetric(toGeographic(p));
      expect(actual[0]).toBeCloseTo(p[0], 6);
      expect(actual[1]).toBeCloseTo(p[1], 6);
    }
  });
  it('matches independent approximate WGS84 east/north distances at this latitude', () => {
    const east = toMetric([ORIGIN[0] + 0.001, ORIGIN[1]]);
    const north = toMetric([ORIGIN[0], ORIGIN[1] + 0.001]);
    expect(Math.hypot(...east)).toBeCloseTo(108.18, 0);
    expect(Math.hypot(...north)).toBeCloseTo(110.65, 0);
  });
});
