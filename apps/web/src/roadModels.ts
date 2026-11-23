import type { DesignResult, FrontageInput, Ring, RoadInput } from '@bangkok/domain';
import {
  frontageClearance,
  mappedRoadOffset,
  roadSection,
  signedArea,
  toMetric,
} from '@bangkok/geometry';
import type { ContextCollection } from './useSiteData';

/** The same declared near boundary used by the engine, rendered at its physical width. */
export function roadModels(
  plot: Ring,
  roads: RoadInput[],
  frontage: FrontageInput[],
  design?: DesignResult,
  context?: ContextCollection | null,
) {
  const ring = plot.map(toMetric),
    winding = signedArea(ring);
  const mapped =
    context?.type === 'FeatureCollection'
      ? context.features.flatMap((f) =>
          f.properties?.kind === 'road' && f.geometry?.type === 'LineString'
            ? [(f.geometry.coordinates as Ring).map(toMetric)]
            : [],
        )
      : [];
  return frontage.flatMap((f) => {
    const road = roads.find((r) => r.id === f.roadId);
    if (!road?.widthM || !ring[f.edgeIndex]) return [];
    const section = roadSection(
      ring[f.edgeIndex],
      ring[(f.edgeIndex + 1) % ring.length],
      road.widthM,
      winding,
    );
    if (!section) return [];
    const gapM = design
      ? frontageClearance(
          design.floors.flatMap((floor) => floor.polygons),
          section,
        )
      : undefined;
    return [
      {
        road,
        edgeIndex: f.edgeIndex,
        section,
        gapM,
        centrelineGapM: gapM === undefined ? undefined : gapM + road.widthM / 2,
        mappedOffsetM: mappedRoadOffset(section, mapped),
      },
    ];
  });
}
export type RoadModel = ReturnType<typeof roadModels>[number];
