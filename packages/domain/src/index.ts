/** Geographic coordinates are [longitude, latitude]; metric coordinates are [east, north]. */
export type Point = [number, number];
export type Ring = Point[];
export interface Polygon {
  outer: Ring;
  holes: Ring[];
}
export type MultiPolygon = Polygon[];
export type CheckStatus = 'pass' | 'fail' | 'unknown' | 'not-applicable';
export interface SourceReference {
  id: string;
  title: string;
  url: string;
  locator: string;
  status: 'located' | 'verified' | 'unresolved';
  note: string;
}
export interface RuleDefinition {
  id: string;
  title: string;
  status: 'assumption' | 'unresolved';
  sourceIds: string[];
  explanation: string;
}
export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  actual?: number;
  required?: number;
  unit?: string;
  explanation: string;
  sourceIds: string[];
}
export interface DesignAssumptions {
  setbackM: number;
  floors: number;
  floorHeightM: number;
}
export interface SiteInput {
  revision: number;
  geographicPlot: Ring;
  use: 'condominium';
  assumptions: DesignAssumptions;
}
export interface FloorGeometry {
  level: number;
  baseM: number;
  topM: number;
  polygons: MultiPolygon;
  areaM2: number;
}
export interface DesignResult {
  id: 'compact' | 'stepped';
  title: string;
  description: string;
  floors: FloorGeometry[];
  coveredGround: MultiPolygon;
  footprintM2: number;
  grossFloorAreaM2: number;
  uncoveredM2: number;
  heightM: number;
  modelledFar: number;
}
export interface CalculationResult {
  revision: number;
  rulesetVersion: string;
  status: 'invalid' | 'empty' | 'partial';
  plot: MultiPolygon;
  plotAreaM2: number;
  envelope: MultiPolygon;
  envelopeAreaM2: number;
  designs: DesignResult[];
  checks: CheckResult[];
  diagnostics: string[];
  durationMs: number;
}
