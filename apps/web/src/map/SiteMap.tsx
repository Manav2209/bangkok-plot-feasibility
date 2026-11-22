import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, StyleSpecification } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import type { CalculationResult, DesignResult, Ring } from '@bangkok/domain';
import { ORIGIN, toGeographic, toGeoJSON } from '@bangkok/geometry';
import { ProposalLayer } from '../scene/ProposalLayer';

maplibregl.setWorkerUrl(mapWorkerUrl);

export interface MapControls {
  draw(): void;
  edit(): void;
  fit(): void;
  view(threeD: boolean): void;
}
interface Props {
  plot: Ring;
  result: CalculationResult | null;
  design?: DesignResult;
  mode: 'existing' | 'envelope' | 'proposal';
  heightM: number;
  onPlot(plot: Ring): void;
  onReady(controls: MapControls): void;
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
  const [drawing, setDrawing] = useState(false);
  const configuredStyle = import.meta.env.VITE_MAP_STYLE_URL;

  useEffect(() => {
    if (!container.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: configuredStyle || style,
        center: toGeographic([25, 25]),
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
      const layer = new ProposalLayer();
      map.addLayer(layer);
      layerRef.current = layer;
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
          draw.clear();
          draw.setMode('polygon');
          setDrawing(true);
          map.easeTo({ pitch: 0, bearing: 0, duration: 300 });
        },
        edit() {
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
        setError(
          `The boundary could not be loaded for editing: ${added.find((feature) => !feature.valid)?.reason ?? 'invalid boundary'}. Reset the example or draw a new plot.`,
        );
      }
    }
    published.current = JSON.stringify(props.plot);
    synchronizing.current = false;
  }, [props.plot, ready]);

  useEffect(() => {
    if (!ready) return;
    const source = mapRef.current?.getSource('envelope') as GeoJSONSource | undefined;
    source?.setData(props.result ? toGeoJSON(props.result.envelope) : empty);
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
    layerRef.current?.update(props.design, props.result?.envelope ?? [], props.mode, props.heightM);
  }, [ready, props.result, props.design, props.mode, props.heightM]);

  return (
    <div className="map-stage">
      <div ref={container} className="map-canvas" aria-label="Interactive plot map" />
      <div className="map-location">
        <span className="map-cross">⌖</span>
        <div>
          <strong>Phra Khanong research area</strong>
          <span>Bangkok, Thailand · illustrative boundary</span>
        </div>
      </div>
      {!configuredStyle && (
        <div className="context-notice">
          Coordinate grid · 20 m spacing
          <br />
          <span>Neighbourhood data is not connected</span>
        </div>
      )}
      {drawing && (
        <div className="drawing-notice" role="status">
          Click to place vertices. Click the first vertex to finish.
          <br />
          Choose Edit boundary to cancel drawing.
        </div>
      )}
      {error && (
        <div className="map-error" role="alert">
          {error}
        </div>
      )}
      <div className="map-legend">
        <span className="legend-boundary" />
        Plot boundary
        <span className="legend-inset" />
        Assumed inset
        <span className="legend-massing" />
        Massing
      </div>
    </div>
  );
}
