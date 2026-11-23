import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, StyleSpecification } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import type {
  CalculationResult,
  DesignResult,
  FrontageInput,
  ParkingPlan,
  Ring,
  ZoneInput,
} from '@bangkok/domain';
import type { ContextCollection } from '../useSiteData';
import type { MappedRoad } from '../roads';
import { ORIGIN, toGeographic, toGeoJSON } from '@bangkok/geometry';
import type { ProposalLayer } from '../scene/ProposalLayer';

maplibregl.setWorkerUrl(mapWorkerUrl);

export interface MapControls {
  draw(): void;
  edit(): void;
  fit(): void;
  view(threeD: boolean): void;
  frontage(): void;
  locate(coordinates: [number, number]): void;
}
interface Props {
  plot: Ring;
  result: CalculationResult | null;
  preview?: CalculationResult | null;
  design?: DesignResult;
  mode: 'existing' | 'envelope' | 'proposal';
  heightM: number;
  onPlot(plot: Ring): void;
  onReady(controls: MapControls): void;
  context?: ContextCollection | null;
  mappedRoads?: MappedRoad[];
  contextBounds?: [number, number, number, number];
  zone?: ZoneInput;
  frontage?: FrontageInput[];
  onFrontage?(edgeIndex: number): void;
  overlay?: boolean;
  activeRule?: string | null;
  parkingPlan?: ParkingPlan;
  parkingRamp?: import('@bangkok/domain').MultiPolygon;
}

const empty = { type: 'FeatureCollection' as const, features: [] };
const style: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e7edef' } }],
};
function grid() {
  const lines = [];
  for (let i = -500; i <= 500; i += 20) {
    for (const coords of [
      [
        [i, -500],
        [i, 500],
      ],
      [
        [-500, i],
        [500, i],
      ],
    ])
      lines.push({
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: coords.map((p) => toGeographic(p as [number, number])),
        },
      });
  }
  return { type: 'FeatureCollection' as const, features: lines };
}

export function SiteMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const layerRef = useRef<ProposalLayer | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const published = useRef('');
  const synchronizing = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [selectingFrontage, setSelectingFrontage] = useState(false);
  const selectingRef = useRef(false);
  const [outsideCoverage, setOutsideCoverage] = useState(false);
  const [partialCoverage, setPartialCoverage] = useState(false);
  const [contextDetail, setContextDetail] = useState<{
    name: string;
    height: string;
    url: string;
    kind?: 'road';
  } | null>(null);
  const configuredStyle = import.meta.env.VITE_MAP_STYLE_URL;

  useEffect(() => {
    if (!container.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: configuredStyle || style,
        center: props.plot.length
          ? props.plot.reduce(
              (centre, p) => [
                centre[0] + p[0] / props.plot.length,
                centre[1] + p[1] / props.plot.length,
              ],
              [0, 0] as [number, number],
            )
          : ORIGIN,
        zoom: 18.4,
        pitch: 0,
        bearing: 0,
        maxPitch: 65,
        canvasContextAttributes: { antialias: true },
        attributionControl: { compact: true },
      });
    } catch {
      setError(
        'The map could not start. A browser with WebGL2 is needed. The measured results remain available.',
      );
      return;
    }
    mapRef.current = map;
    if (new URLSearchParams(window.location.search).has('measure'))
      map.on('render', () => {
        performance.mark('plot-map-render');
        const start = performance.getEntriesByName('plot-edit-start').at(-1),
          current = latest.current;
        if (
          !start ||
          !current.result ||
          current.mode !== 'proposal' ||
          !map.getLayer('proposal-2d')
        )
          return;
        const features = map.queryRenderedFeatures({ layers: ['proposal-2d'] });
        if (
          features.length &&
          features.every((f) => f.properties?.revision === current.result!.revision)
        ) {
          performance.measure('plot-edit-to-render', {
            start: start.startTime,
            end: performance.now(),
          });
          performance.clearMarks('plot-edit-start');
        }
      });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    const onError = () =>
      setError(
        configuredStyle
          ? 'Some map data could not load. Context may be incomplete. Check the style URL, credentials and network.'
          : 'The map could not render. Try refreshing or enabling browser graphics acceleration.',
      );
    map.on('error', onError);
    map.once('load', () => {
      map.setProjection({ type: 'mercator' });
      if (!configuredStyle) {
        map.addSource('metric-grid', { type: 'geojson', data: grid() });
        map.addLayer({
          id: 'metric-grid',
          type: 'line',
          source: 'metric-grid',
          paint: { 'line-color': '#c9d6db', 'line-width': 0.7, 'line-opacity': 0.7 },
        });
      }
      map.addSource('envelope', { type: 'geojson', data: empty });
      map.addSource('neighbourhood', {
        type: 'geojson',
        data: empty,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a> · ODbL',
      });
      map.addSource('context-coverage', { type: 'geojson', data: empty });
      map.addLayer({
        id: 'context-coverage',
        type: 'line',
        source: 'context-coverage',
        paint: { 'line-color': '#627786', 'line-dasharray': [2, 4], 'line-width': 1.5 },
      });
      map.addLayer({
        id: 'context-road-casing',
        type: 'line',
        source: 'neighbourhood',
        filter: ['==', ['get', 'kind'], 'road'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#768e9e',
          'line-width': ['interpolate', ['linear'], ['zoom'], 15, 3, 19, 13],
        },
      });
      map.addLayer({
        id: 'context-roads',
        type: 'line',
        source: 'neighbourhood',
        filter: ['==', ['get', 'kind'], 'road'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#fffdf5',
          'line-width': ['interpolate', ['linear'], ['zoom'], 15, 1.5, 19, 9],
        },
      });
      map.addLayer({
        id: 'context-water',
        type: 'line',
        source: 'neighbourhood',
        filter: ['==', ['get', 'kind'], 'waterway'],
        paint: { 'line-color': '#8fbccf', 'line-width': 3 },
      });
      map.addLayer({
        id: 'context-buildings',
        type: 'fill-extrusion',
        source: 'neighbourhood',
        filter: ['==', ['get', 'kind'], 'building'],
        paint: {
          'fill-extrusion-color': '#bac5cc',
          'fill-extrusion-height': ['coalesce', ['get', 'heightM'], 0],
          'fill-extrusion-opacity': 0.65,
        },
      });
      map.addSource('supported-zone', {
        type: 'geojson',
        data: empty,
        attribution: 'Bangkok Metropolitan Administration · 2013 planning GIS',
      });
      map.addLayer({
        id: 'zone-boundary',
        type: 'line',
        source: 'supported-zone',
        paint: { 'line-color': '#8b5db5', 'line-width': 2.5, 'line-dasharray': [4, 2] },
      });
      map.addSource('frontages', { type: 'geojson', data: empty });
      map.addLayer({
        id: 'frontage-lines',
        type: 'line',
        source: 'frontages',
        paint: { 'line-color': '#d08729', 'line-width': 6 },
      });
      map.addSource('rule-highlight', { type: 'geojson', data: empty });
      map.addSource('parking-plan', { type: 'geojson', data: empty });
      map.addLayer({
        id: 'parking-plan-fill',
        type: 'fill',
        source: 'parking-plan',
        paint: {
          'fill-color': [
            'match',
            ['get', 'part'],
            'stall',
            '#397eae',
            'aisle',
            '#e7b760',
            'ramp',
            '#c4614c',
            '#9f87b3',
          ],
          'fill-opacity': 0.8,
        },
      });
      map.addLayer({
        id: 'parking-plan-lines',
        type: 'line',
        source: 'parking-plan',
        paint: { 'line-color': '#183d54', 'line-width': 1.2 },
      });
      map.addLayer({
        id: 'rule-highlight',
        type: 'fill',
        source: 'rule-highlight',
        paint: { 'fill-color': '#d08729', 'fill-opacity': 0.3 },
      });
      map.addLayer({
        id: 'envelope-fill',
        type: 'fill',
        source: 'envelope',
        paint: { 'fill-color': '#168b79', 'fill-opacity': 0.15 },
      });
      map.addLayer({
        id: 'envelope-line',
        type: 'line',
        source: 'envelope',
        paint: { 'line-color': '#168b79', 'line-width': 1.5, 'line-dasharray': [4, 3] },
      });
      map.addSource('proposal-2d', { type: 'geojson', data: empty });
      map.addLayer({
        id: 'proposal-2d',
        type: 'fill',
        source: 'proposal-2d',
        paint: { 'fill-color': '#168b79', 'fill-opacity': 0.65 },
      });
      map.addLayer({
        id: 'proposal-2d-line',
        type: 'line',
        source: 'proposal-2d',
        paint: { 'line-color': '#117966', 'line-width': 2 },
      });
      let loadingScene = false;
      const loadScene = async () => {
        if (layerRef.current || loadingScene || map.getPitch() <= 0) return;
        loadingScene = true;
        try {
          const { ProposalLayer } = await import('../scene/ProposalLayer');
          if (mapRef.current !== map) return;
          const layer = new ProposalLayer();
          map.addLayer(layer);
          layerRef.current = layer;
          const p = latest.current,
            current = p.result ?? p.preview;
          layer.update(
            p.design,
            current?.envelope ?? [],
            p.mode,
            p.heightM,
            current?.slices,
            p.overlay,
          );
        } catch {
          setError(
            'The 3D proposal could not load. The 2D geometry and measurements remain available.',
          );
        } finally {
          loadingScene = false;
        }
      };
      map.on('pitch', () => {
        void loadScene();
      });
      const draw = new TerraDraw({
        // Preserve projected WGS84 doubles; metric clipping applies its own 1 mm grid.
        adapter: new TerraDrawMapLibreGLAdapter({ map, coordinatePrecision: 17 }),
        modes: [
          new TerraDrawPolygonMode({
            styles: {
              fillColor: '#2b526e',
              fillOpacity: 0.04,
              outlineColor: '#2b526e',
              outlineWidth: 2,
            },
          }),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  coordinates: { draggable: true, midpoints: true, deletable: true },
                },
              },
            },
            styles: {
              selectedPolygonColor: '#2b526e',
              selectedPolygonFillOpacity: 0.025,
              selectedPolygonOutlineColor: '#2b526e',
              selectedPolygonOutlineWidth: 2,
              selectionPointColor: '#ffffff',
              selectionPointOutlineColor: '#2b526e',
              selectionPointWidth: 5,
              midPointColor: '#8fabbc',
              midPointWidth: 3,
            },
          }),
        ],
      });
      draw.start();
      draw.setMode('select');
      drawRef.current = draw;
      function publish() {
        if (synchronizing.current) return;
        const feature = draw
          .getSnapshot()
          .find((f) => f.geometry.type === 'Polygon' && f.properties.mode === 'polygon');
        const plot =
          feature?.geometry.type === 'Polygon'
            ? (feature.geometry.coordinates[0].slice(0, -1) as Ring)
            : [];
        const serialized = JSON.stringify(plot);
        if (serialized !== published.current) {
          published.current = serialized;
          latest.current.onPlot(plot);
        }
      }
      draw.on('change', () => {
        if (draw.getMode() === 'select') publish();
      });
      draw.on('finish', (id) => {
        draw.setMode('select');
        draw.selectFeature(id);
        publish();
        setDrawing(false);
      });
      latest.current.onReady({
        draw() {
          selectingRef.current = false;
          setSelectingFrontage(false);
          draw.clear();
          draw.setMode('polygon');
          setDrawing(true);
          map.easeTo({ pitch: 0, bearing: 0, duration: 300 });
        },
        edit() {
          selectingRef.current = false;
          setSelectingFrontage(false);
          draw.setMode('select');
          setDrawing(false);
          const feature = draw.getSnapshot().find((f) => f.geometry.type === 'Polygon');
          if (feature?.id !== undefined) draw.selectFeature(feature.id);
        },
        fit() {
          const plot = latest.current.plot;
          if (plot.length) {
            const bounds = new maplibregl.LngLatBounds(plot[0], plot[0]);
            plot.forEach((point) => bounds.extend(point));
            map.fitBounds(bounds, { padding: 90, maxZoom: 19, duration: 500 });
          } else map.easeTo({ center: ORIGIN, zoom: 18.4, duration: 500 });
        },
        view(threeD) {
          map.easeTo({ pitch: threeD ? 55 : 0, bearing: threeD ? -24 : 0, duration: 450 });
        },
        frontage() {
          draw.setMode('select');
          draw.getSnapshot().forEach((feature) => {
            if (feature.id !== undefined) draw.deselectFeature(feature.id);
          });
          selectingRef.current = true;
          setSelectingFrontage(true);
        },
        locate(coordinates) {
          map.flyTo({ center: coordinates, zoom: 18, duration: 700 });
        },
      });
      map.on('click', (event) => {
        if (selectingRef.current) {
          const plot = latest.current.plot;
          let nearest = -1,
            distance = 14;
          plot.forEach((a, i) => {
            const b = plot[(i + 1) % plot.length],
              p = map.project(a),
              q = map.project(b);
            const dx = q.x - p.x,
              dy = q.y - p.y;
            const t = Math.max(
              0,
              Math.min(
                1,
                ((event.point.x - p.x) * dx + (event.point.y - p.y) * dy) /
                  (dx * dx + dy * dy || 1),
              ),
            );
            const d = Math.hypot(event.point.x - (p.x + t * dx), event.point.y - (p.y + t * dy));
            if (d < distance) {
              distance = d;
              nearest = i;
            }
          });
          if (nearest >= 0) latest.current.onFrontage?.(nearest);
          return;
        }
        const feature = map.queryRenderedFeatures(event.point, {
          layers: ['context-buildings'],
        })[0];
        if (feature)
          setContextDetail({
            name: String(
              feature.properties?.name || feature.properties?.sourceId || 'Mapped building',
            ),
            height: String(feature.properties?.heightLabel || 'Estimated height'),
            url: String(feature.properties?.sourceUrl || 'https://www.openstreetmap.org'),
          });
        else {
          const road = map.queryRenderedFeatures(event.point, {
            layers: ['context-road-casing'],
          })[0];
          if (road)
            setContextDetail({
              kind: 'road',
              name: String(
                road.properties?.name || `Unnamed ${road.properties?.highway || 'road'}`,
              ),
              height:
                'Mapped road centreline. Display width is a map style, not measured right-of-way. Legal width and access rights remain unverified.',
              url: String(road.properties?.sourceUrl || 'https://www.openstreetmap.org'),
            });
        }
      });
      setReady(true);
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      drawRef.current?.stop();
      drawRef.current = null;
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
    };
  }, [configuredStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const markers = (props.mappedRoads ?? []).map((road) => {
      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'road-map-label';
      label.textContent = road.name;
      label.setAttribute('aria-label', `Inspect mapped road ${road.id}`);
      label.title = `${road.name} · mapped centreline, legal width unknown`;
      label.addEventListener('click', (event) => {
        event.stopPropagation();
        if (selectingRef.current) return;
        setContextDetail({
          kind: 'road',
          name: road.name,
          height: `OSM ${road.kind} centreline · about ${Math.round(road.distanceM)} m from the outline. ${road.widthM ? `Map width tag: ${road.widthM} m; ` : ''}Legal right-of-way and access rights are unverified. Display width is schematic.`,
          url: road.sourceUrl,
        });
      });
      return new maplibregl.Marker({ element: label }).setLngLat(road.point).addTo(map);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [ready, props.mappedRoads]);

  useEffect(() => {
    if (!ready) return;
    const p = props.parkingPlan;
    (mapRef.current?.getSource('parking-plan') as GeoJSONSource | undefined)?.setData(
      p
        ? {
            type: 'FeatureCollection',
            features: [
              { ...toGeoJSON(p.aisles), properties: { part: 'aisle' } },
              { ...toGeoJSON(p.serviceReserve), properties: { part: 'service' } },
              { ...toGeoJSON(p.stalls), properties: { part: 'stall' } },
              { ...toGeoJSON(props.parkingRamp ?? []), properties: { part: 'ramp' } },
            ],
          }
        : empty,
    );
  }, [ready, props.parkingPlan, props.parkingRamp]);

  useEffect(() => {
    const map = mapRef.current;
    const box = props.contextBounds;
    if (!ready || !map || !box) return;
    const updateCoverage = () => {
      const centre = map.getCenter();
      const bounds = map.getBounds();
      setOutsideCoverage(
        centre.lng < box[0] || centre.lng > box[2] || centre.lat < box[1] || centre.lat > box[3],
      );
      setPartialCoverage(
        bounds.getWest() < box[0] ||
          bounds.getEast() > box[2] ||
          bounds.getSouth() < box[1] ||
          bounds.getNorth() > box[3],
      );
    };
    updateCoverage();
    map.on('moveend', updateCoverage);
    map.on('resize', updateCoverage);
    return () => {
      map.off('moveend', updateCoverage);
      map.off('resize', updateCoverage);
    };
  }, [ready, props.contextBounds]);

  useEffect(() => {
    const draw = drawRef.current;
    if (!ready || !draw || JSON.stringify(props.plot) === published.current) return;
    synchronizing.current = true;
    draw.setMode('select');
    draw.clear();
    setDrawing(false);
    if (props.plot.length >= 3) {
      const added = draw.addFeatures([
        {
          id: draw.getFeatureId(),
          type: 'Feature',
          properties: { mode: 'polygon' },
          geometry: { type: 'Polygon', coordinates: [[...props.plot, props.plot[0]]] },
        },
      ]);
      if (added.some((feature) => !feature.valid)) {
        setBoundaryError(
          `The boundary could not be loaded for editing: ${added.find((feature) => !feature.valid)?.reason ?? 'invalid boundary'}. Reset the example or draw a new plot.`,
        );
      } else setBoundaryError(null);
    }
    published.current = JSON.stringify(props.plot);
    synchronizing.current = false;
  }, [props.plot, ready]);

  useEffect(() => {
    if (!ready) return;
    const source = mapRef.current?.getSource('envelope') as GeoJSONSource | undefined;
    const current = props.result ?? props.preview;
    source?.setData(current ? toGeoJSON(current.envelope) : empty);
    (mapRef.current?.getSource('proposal-2d') as GeoJSONSource | undefined)?.setData(
      props.mode === 'proposal' && props.design
        ? {
            ...toGeoJSON(props.design.coveredGround),
            properties: { revision: props.result?.revision ?? -1 },
          }
        : empty,
    );
    mapRef.current?.setLayoutProperty(
      'envelope-fill',
      'visibility',
      props.mode === 'existing' ? 'none' : 'visible',
    );
    mapRef.current?.setLayoutProperty(
      'envelope-line',
      'visibility',
      props.mode === 'existing' ? 'none' : 'visible',
    );
    layerRef.current?.update(
      props.design,
      current?.envelope ?? [],
      props.mode,
      props.heightM,
      current?.slices,
      props.overlay,
    );
    const affected = props.activeRule ? current?.affectedRegions?.[props.activeRule] : [];
    (mapRef.current?.getSource('rule-highlight') as GeoJSONSource | undefined)?.setData(
      affected?.length ? toGeoJSON(affected) : empty,
    );
  }, [
    ready,
    props.result,
    props.preview,
    props.design,
    props.mode,
    props.heightM,
    props.overlay,
    props.activeRule,
  ]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current!;
    (map.getSource('neighbourhood') as GeoJSONSource)?.setData(props.context ?? empty);
    const box = props.contextBounds;
    (map.getSource('context-coverage') as GeoJSONSource)?.setData(
      box
        ? {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [box[0], box[1]],
                  [box[2], box[1]],
                  [box[2], box[3]],
                  [box[0], box[3]],
                  [box[0], box[1]],
                ],
              ],
            },
          }
        : empty,
    );
    if (map.getLayer('metric-grid'))
      map.setLayoutProperty('metric-grid', 'visibility', props.context ? 'none' : 'visible');
    const zone = props.zone;
    (map.getSource('supported-zone') as GeoJSONSource)?.setData(
      zone
        ? {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'MultiPolygon',
              coordinates: zone.boundaryLonLat.map((p) =>
                [p.outer, ...p.holes].map((r) => [...r, r[0]]),
              ),
            },
          }
        : empty,
    );
    (map.getSource('frontages') as GeoJSONSource)?.setData({
      type: 'FeatureCollection',
      features: (props.frontage ?? [])
        .filter((f) => f.edgeIndex < props.plot.length)
        .map((f) => ({
          type: 'Feature',
          properties: { roadId: f.roadId },
          geometry: {
            type: 'LineString',
            coordinates: [
              props.plot[f.edgeIndex],
              props.plot[(f.edgeIndex + 1) % props.plot.length],
            ],
          },
        })),
    });
  }, [ready, props.context, props.contextBounds, props.zone, props.frontage, props.plot]);

  return (
    <div className="map-stage">
      <div ref={container} className="map-canvas" aria-label="Interactive plot map" />
      <div className="map-location">
        <span className="map-cross">⌖</span>
        <div>
          <strong>Phra Khanong research area</strong>
          <span>Bangkok · 2013 Y.7-21 · illustrative parcel</span>
        </div>
      </div>
      {!configuredStyle && (
        <div className="context-notice">
          <span>
            {props.context
              ? outsideCoverage
                ? 'Beyond bundled context coverage'
                : 'Bundled OpenStreetMap context'
              : 'Coordinate grid · 20 m spacing'}
          </span>
          <br />
          <span>
            {props.context
              ? outsideCoverage
                ? 'Missing features here do not indicate vacant land'
                : partialCoverage
                  ? 'View extends beyond coverage · missing features do not indicate vacant land'
                  : 'Building heights are estimates · click to inspect'
              : 'Neighbourhood data unavailable or loading'}
          </span>
        </div>
      )}
      {selectingFrontage && (
        <div className="drawing-notice" role="status">
          Click a plot edge to mark every road frontage. Use Edit boundary to finish.
        </div>
      )}
      {props.parkingPlan && (
        <div className="parking-plan-notice" role="status">
          Level {props.parkingPlan.level}: {props.parkingPlan.stalls.length} schematic stalls ·{' '}
          {props.parkingPlan.stallWidthM} × {props.parkingPlan.stallLengthM} m · aisle{' '}
          {props.parkingPlan.aisleWidthM} m
          <br />
          Blue: stalls · amber: aisles · purple: service reserve · red: ramp reservation. Turning
          and legal connection are unverified.
        </div>
      )}
      {contextDetail && (
        <div className="context-detail">
          <button
            onClick={() => setContextDetail(null)}
            aria-label={
              contextDetail.kind === 'road' ? 'Close road details' : 'Close building details'
            }
          >
            ×
          </button>
          <strong>{contextDetail.name}</strong>
          <p>{contextDetail.height}</p>
          <a href={contextDetail.url} target="_blank" rel="noreferrer">
            Open mapped source
          </a>
        </div>
      )}
      {drawing && (
        <div className="drawing-notice" role="status">
          Click to place vertices. Click the first vertex to finish.
          <br />
          Choose Edit boundary to cancel drawing.
        </div>
      )}
      {(error || boundaryError) && (
        <div className="map-error" role="alert">
          {error || boundaryError}
        </div>
      )}
      <div className="map-legend">
        <span className="legend-item">
          <i className="legend-road" />
          Road centreline
        </span>
        <span className="legend-item">
          <i className="legend-zone" />
          Zone boundary
        </span>
        <span className="legend-item">
          <i className="legend-frontage" />
          Selected frontage
        </span>
        <span className="legend-item">
          <i className="legend-boundary" />
          Plot boundary
        </span>
        <span className="legend-item">
          <i className="legend-inset" />
          Reference envelope
        </span>
        <span className="legend-item">
          <i className="legend-massing" />
          Massing
        </span>
      </div>
    </div>
  );
}
