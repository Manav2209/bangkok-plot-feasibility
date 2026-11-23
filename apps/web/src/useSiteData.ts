import { useEffect, useState } from 'react';
import type { ZoneInput } from '@bangkok/domain';
import type { GeoJSONSourceSpecification } from 'maplibre-gl';

export type ContextCollection = Exclude<GeoJSONSourceSpecification['data'], string | undefined>;
export function useSiteData() {
  const [context, setContext] = useState<ContextCollection | null>(null);
  const [zone, setZone] = useState<ZoneInput | undefined>();
  const [contextBounds, setContextBounds] = useState<
    [number, number, number, number] | undefined
  >();
  const [errors, setErrors] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrors([]);
    const get = async (path: string) => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      return response.json();
    };
    Promise.allSettled([
      get('context.geojson'),
      get('zone.geojson'),
      get('context-manifest.json'),
    ]).then((results) => {
      if (controller.signal.aborted) return;
      const problems: string[] = [];
      const manifest = results[2];
      if (
        manifest.status === 'fulfilled' &&
        Array.isArray(manifest.value.bbox) &&
        manifest.value.bbox.length === 4 &&
        manifest.value.bbox.every(Number.isFinite)
      )
        setContextBounds(manifest.value.bbox);
      else {
        setContextBounds(undefined);
        problems.push(
          'The neighbourhood coverage extent is unavailable. Surroundings beyond the extract are unknown.',
        );
      }
      const c = results[0];
      if (
        c.status === 'fulfilled' &&
        c.value.type === 'FeatureCollection' &&
        Array.isArray(c.value.features) &&
        c.value.features.length > 0
      )
        setContext(c.value);
      else {
        setContext(null);
        problems.push(
          'Neighbourhood data could not load. Missing buildings do not establish vacant land.',
        );
      }
      const z = results[1];
      if (
        z.status === 'fulfilled' &&
        z.value.type === 'FeatureCollection' &&
        z.value.features?.[0]?.geometry
      ) {
        const geometry = z.value.features[0].geometry;
        const polygons =
          geometry.type === 'Polygon'
            ? [geometry.coordinates]
            : geometry.type === 'MultiPolygon'
              ? geometry.coordinates
              : [];
        if (polygons.length)
          setZone({
            id: 'y7-21-2013',
            boundaryLonLat: polygons.map((rings: number[][][]) => ({
              outer: rings[0].slice(0, -1),
              holes: rings.slice(1).map((r) => r.slice(0, -1)),
            })),
            evidence: 'verified',
            sourceUrl:
              'https://cpudgiapp.bangkok.go.th/arcgis/rest/services/GI_Platform/BMAGI_Planing/MapServer/1',
            uncertaintyM: null,
            boundaryGuardM: 1,
          });
        else {
          setZone(undefined);
          problems.push(
            'The authoritative zone geometry is unsupported. Zone checks remain unknown.',
          );
        }
      } else {
        setZone(undefined);
        problems.push('Zone data could not load. Site membership remains unknown.');
      }
      setErrors(problems);
      setLoading(false);
    });
    return () => controller.abort();
  }, [attempt]);
  return { context, contextBounds, zone, errors, loading, retry: () => setAttempt((n) => n + 1) };
}
