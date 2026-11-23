/** Geographic coordinates are [longitude, latitude]; metric coordinates are [east, north]. */
export type Point = [number, number];
export type Ring = Point[];
export interface Polygon {
  outer: Ring;
  holes: Ring[];
}
export type MultiPolygon = Polygon[];
export type CheckStatus = 'pass' | 'fail' | 'unknown' | 'not-applicable';
export type BuildingUse = 'condominium' | 'office';
export interface SourceReference {
  id: string;
  title: string;
  url: string;
  locator: string;
  status: 'located' | 'verified' | 'unresolved';
  note: string;
  issuer: string;
  retrievedOn: string;
  instrumentState: 'historical' | 'draft' | 'current' | 'unknown';
  effectiveDate?: string;
  publishedOn?: string;
}
export interface RuleDefinition {
  id: string;
  title: string;
  kind: 'evidence' | 'geometric' | 'aggregate' | 'use' | 'access' | 'classification';
  evidence: 'verified' | 'hypothesis' | 'unresolved';
  implementation: 'implemented' | 'unresolved';
  appliesTo: BuildingUse[];
  sourceIds: string[];
  explanation: string;
  originalThai: string | null;
  interpretation: string;
  legalVersion: string | null;
  clause: string | null;
  dependencies: string[];
  inputs: string[];
  params: Record<string, number>;
  paramUnits: Record<string, string>;
  predicate: 'evidence' | 'at-most' | 'at-least' | 'review';
  applicability?: { fact: string; equals: boolean | number | string };
  exceptions: string[];
  effect: string;
  boundaryCases: string[];
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
  scope: 'assumption' | 'statutory' | 'core-model';
  prerequisiteIds?: string[];
  measurementBasis?: 'modelled-proxy' | 'verified' | 'assumption';
}
export interface DesignAssumptions {
  setbackM: number;
  floors: number;
  floorHeightM: number;
  minWidthM?: number;
  minDepthM?: number;
  courtyardM?: number;
  coreFraction?: number;
  permeableFraction?: number;
  parkingSpaceAreaM2?: number;
  fireAccessRingM?: number;
}
export interface ProjectInputs {
  coreBasis?: {
    wholeSiteAndBuildings?: boolean;
    aggregationAccountedFor?: boolean;
    allFloorsAndCoverCounted?: boolean;
    publicRoadReferences?: boolean;
    matchingHeightDatum?: boolean;
    officeOperationAreaM2?: number;
  };
  ramp?: ParkingRampInputs;
  residentialUnits?: number;
  residentialUnitsOver60M2?: number;
  officeWorkingAreaM2?: number;
  parkingSpaces?: number;
  parkingLocation?: 'unknown' | 'ground-uncovered' | 'within-building';
  accessRoadWidthM?: number;
  routeConnectedToPublicRoad?: boolean;
  drivewayWidthM?: number;
  drivewayDirection?: 'one-way' | 'two-way';
}
export interface ParkingRampInputs {
  kind?: 'straight' | 'curved';
  horizontalRunM?: number;
  clearWidthM?: number;
  clearHeightM?: number;
  innerRadiusM?: number;
  intermediateLandingLengthM?: number;
  entranceOffsetM?: number;
}
export interface RoadInput {
  id: string;
  name: string;
  geometry: Ring;
  widthM?: number;
  widthProvenance: 'tag' | 'measured' | 'user' | 'unknown';
  confirmed: boolean;
  sourceUrl?: string;
}
export interface FrontageInput {
  edgeIndex: number;
  roadId: string;
}
export interface ZoneInput {
  id: string;
  boundaryLonLat: MultiPolygon;
  evidence: 'verified' | 'illustrative';
  sourceUrl: string;
  uncertaintyM: number | null;
  boundaryGuardM?: number;
}
export interface EnvelopeSlice {
  baseM: number;
  topM: number;
  polygons: MultiPolygon;
  limitingRuleIds: string[];
}
export interface Budget {
  id: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
  evidence: 'hypothesis' | 'verified' | 'assumption';
  sourceIds: string[];
}
export interface SiteInput {
  revision: number;
  geographicPlot: Ring;
  use: BuildingUse;
  assumptions: DesignAssumptions;
  roads?: RoadInput[];
  frontage?: FrontageInput[];
  zone?: ZoneInput;
  transitDistanceM?: number;
  researchConstraints?: boolean;
  project?: ProjectInputs;
}
export interface FloorGeometry {
  level: number;
  baseM: number;
  topM: number;
  polygons: MultiPolygon;
  areaM2: number;
  use?: 'residential' | 'office' | 'parking' | 'core' | 'amenity';
}
export interface ParkingPlan {
  level: number;
  stalls: MultiPolygon;
  aisles: MultiPolygon;
  serviceReserve: MultiPolygon;
  stallWidthM: number;
  stallLengthM: number;
  aisleWidthM: number;
  scope: 'schematic';
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
  regulatedAreaM2: number | null;
  permeableAreaM2: number | null;
  checks: CheckResult[];
  compliance: 'unknown' | 'fail' | 'pass';
  coreAssessment?: {
    status: 'pass' | 'fail' | 'unknown';
    checks: CheckResult[];
    countedModelAreaM2: number;
    uncoveredModelAreaM2: number;
    scope: string;
  };
  usableAreaM2?: number;
  modelledPermeableM2?: number;
  budgets?: Budget[];
  searchNote?: string;
  parking?: {
    requiredSpaces: number | null;
    providedSpaces: number | null;
    estimatedCapacity: number | null;
    reservedFloorAreaM2: number;
    groundAllowanceM2: number;
    layoutVerified: false;
    plans?: ParkingPlan[];
    schematicSpaces?: number;
    ramp?: {
      riseM: number;
      gradientPercent: number | null;
      minimumRunM: number | null;
      flights: number;
      intermediateLandings: number;
      footprint: MultiPolygon;
      scope: 'schematic';
    };
  };
}
export interface CalculationResult {
  rejectedCandidates?: { id: DesignResult['id']; title: string; checks: CheckResult[] }[];
  revision: number;
  rulesetVersion: string;
  status:
    | 'invalid'
    | 'empty'
    | 'partial'
    | 'outside-zone'
    | 'insufficient-data'
    | 'infeasible'
    | 'feasible';
  plot: MultiPolygon;
  plotAreaM2: number;
  envelope: MultiPolygon;
  envelopeAreaM2: number;
  designs: DesignResult[];
  checks: CheckResult[];
  diagnostics: string[];
  durationMs: number;
  slices?: EnvelopeSlice[];
  zoneMembership?: 'inside' | 'outside' | 'straddling' | 'uncertain' | 'unknown';
  budgets?: Budget[];
  timingMs?: { envelope: number; designs: number };
  search?: { tested: number; outcome: 'two' | 'one' | 'none' | 'proven-empty'; bounded: true };
  affectedRegions?: Record<string, MultiPolygon>;
  inputSignature?: string;
}

export {
  assumptionsSchema,
  projectSchema,
  scenarioSchema,
  previousScenarioSchema,
  legacyScenarioSchema,
  type Scenario,
} from './scenario';
