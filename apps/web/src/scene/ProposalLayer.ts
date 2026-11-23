import {
  MercatorCoordinate,
  type CustomLayerInterface,
  type CustomRenderMethodInput,
  type Map,
} from 'maplibre-gl';
import * as THREE from 'three';
import type { DesignResult, EnvelopeSlice, MultiPolygon, Point } from '@bangkok/domain';
import { ORIGIN, toGeographic } from '@bangkok/geometry';

const origin = MercatorCoordinate.fromLngLat(ORIGIN);
const scale = origin.meterInMercatorCoordinateUnits();
function scenePoint(p: Point): THREE.Vector2 {
  const coordinate = MercatorCoordinate.fromLngLat(toGeographic(p));
  return new THREE.Vector2((coordinate.x - origin.x) / scale, -(coordinate.y - origin.y) / scale);
}
function shapes(polygons: MultiPolygon): THREE.Shape[] {
  return polygons.map((polygon) => {
    const shape = new THREE.Shape(polygon.outer.map(scenePoint));
    polygon.holes.forEach((hole) => shape.holes.push(new THREE.Path(hole.map(scenePoint))));
    return shape;
  });
}
export class ProposalLayer implements CustomLayerInterface {
  readonly id = 'proposal-three';
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;
  private camera = new THREE.Camera();
  private scene = new THREE.Scene();
  private group = new THREE.Group();
  private renderer?: THREE.WebGLRenderer;
  private map?: Map;
  private transform = new THREE.Matrix4()
    .makeTranslation(origin.x, origin.y, 0)
    .scale(new THREE.Vector3(scale, -scale, scale));

  constructor() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const light = new THREE.DirectionalLight(0xffffff, 2.4);
    light.position.set(-80, -30, 120);
    this.scene.add(light, this.group);
  }
  onAdd(map: Map, gl: WebGL2RenderingContext) {
    this.map = map;
    this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl });
    this.renderer.autoClear = false;
  }
  private clear() {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.group.clear();
  }
  update(
    design: DesignResult | undefined,
    envelope: MultiPolygon,
    mode: string,
    heightM: number,
    slices?: EnvelopeSlice[],
    overlay = false,
  ) {
    this.clear();
    if (mode === 'existing') {
      this.map?.triggerRepaint();
      return;
    }
    const envelopeFloors = (
      slices?.length ? slices : [{ polygons: envelope, baseM: 0, topM: heightM }]
    ).map((f) => ({ ...f, isEnvelope: true, use: undefined }));
    const designFloors = (design?.floors ?? []).map((f) => ({ ...f, isEnvelope: false }));
    const floors =
      mode === 'envelope'
        ? envelopeFloors
        : overlay
          ? [...designFloors, ...envelopeFloors]
          : designFloors;
    for (const floor of floors) {
      for (const shape of shapes(floor.polygons)) {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: floor.topM - floor.baseM,
          bevelEnabled: false,
        });
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color: floor.isEnvelope ? '#72a8cf' : floor.use === 'parking' ? '#436d91' : '#168b79',
            roughness: 0.85,
            transparent: floor.isEnvelope,
            opacity: floor.isEnvelope ? 0.15 : 1,
            depthWrite: !floor.isEnvelope,
            side: THREE.DoubleSide,
          }),
        );
        mesh.position.z = floor.baseM;
        const lines = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry),
          new THREE.LineBasicMaterial({
            color: floor.isEnvelope ? '#3676a5' : '#d9fff3',
            transparent: true,
            opacity: 0.8,
          }),
        );
        lines.position.z = floor.baseM;
        this.group.add(mesh, lines);
      }
    }
    this.map?.triggerRepaint();
  }
  render(_gl: WebGL2RenderingContext, options: CustomRenderMethodInput) {
    if (!this.renderer) return;
    this.camera.projectionMatrix
      .fromArray(options.defaultProjectionData.mainMatrix)
      .multiply(this.transform);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.renderer.resetState();
  }
  onRemove() {
    this.clear();
    this.renderer?.dispose();
    this.map = undefined;
  }
}
