import { describe, expect, it } from 'vitest';
import { toGeographic } from '@bangkok/geometry';
import type { Ring } from '@bangkok/domain';
import type { ContextCollection } from './useSiteData';
import { nearbyRoads } from './roads';
const plot = (
  [
    [0, 0],
    [20, 0],
    [20, 20],
    [0, 20],
  ] as Ring
).map(toGeographic);
const road = (id: string, points: Ring, name: string | null = null) => ({
  type: 'Feature' as const,
  properties: { kind: 'road', sourceId: id, highway: 'residential', name },
  geometry: { type: 'LineString' as const, coordinates: points.map(toGeographic) },
});
const collection = (...features: ReturnType<typeof road>[]): ContextCollection => ({
  type: 'FeatureCollection',
  features,
});
describe('mapped road proximity without legal adjacency claims', () => {
  it('measures distance to an entire segment rather than its vertices', () => {
    const result = nearbyRoads(
      collection(
        road('r', [
          [-100, -5],
          [100, -5],
        ]),
      ),
      plot,
    );
    expect(result[0].distanceM).toBeCloseTo(5, 4);
    expect(result[0].name).toBe('Unnamed residential');
    expect(result[0].widthM).toBeUndefined();
  });
  it('detects intersecting centrelines and sorts distance with deterministic ties', () => {
    const result = nearbyRoads(
      collection(
        road('far', [
          [-10, -10],
          [30, -10],
        ]),
        road('cross', [
          [-10, 10],
          [30, 10],
        ]),
      ),
      plot,
    );
    expect(result.map((r) => r.id)).toEqual(['cross', 'far']);
    expect(result[0].distanceM).toBe(0);
  });
  it('deduplicates clipped pieces by source ID, keeping the nearest geometry', () => {
    const result = nearbyRoads(
      collection(
        road(
          'same',
          [
            [0, -10],
            [20, -10],
          ],
          'A',
        ),
        road(
          'same',
          [
            [0, -2],
            [20, -2],
          ],
          'A',
        ),
      ),
      plot,
    );
    expect(result).toHaveLength(1);
    expect(result[0].distanceM).toBeCloseTo(2, 4);
  });
  it('requires a plot and available data', () => {
    expect(nearbyRoads(null, plot)).toEqual([]);
    expect(
      nearbyRoads(
        collection(
          road('r', [
            [0, 0],
            [20, 0],
          ]),
        ),
        [],
      ),
    ).toEqual([]);
  });
});
