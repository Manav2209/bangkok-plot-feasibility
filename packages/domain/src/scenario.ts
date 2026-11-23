import { z } from 'zod';

export const assumptionsSchema = z.strictObject({
  setbackM: z.number().min(0).max(100),
  floors: z.number().int().min(1).max(30),
  floorHeightM: z.number().min(2).max(6),
  minWidthM: z.number().min(3).max(50).optional(),
  minDepthM: z.number().min(3).max(50).optional(),
  courtyardM: z.number().min(3).max(50).optional(),
  coreFraction: z.number().min(0).max(0.5).optional(),
  permeableFraction: z.number().min(0).max(1).optional(),
  parkingSpaceAreaM2: z.number().min(10).max(100).optional(),
  fireAccessRingM: z.number().min(0).max(15).optional(),
});
export const projectSchema = z
  .strictObject({
    coreBasis: z
      .strictObject({
        wholeSiteAndBuildings: z.boolean().optional(),
        aggregationAccountedFor: z.boolean().optional(),
        allFloorsAndCoverCounted: z.boolean().optional(),
        publicRoadReferences: z.boolean().optional(),
        matchingHeightDatum: z.boolean().optional(),
        officeOperationAreaM2: z.number().positive().max(1000000).optional(),
      })
      .optional(),
    ramp: z
      .strictObject({
        kind: z.enum(['straight', 'curved']).optional(),
        horizontalRunM: z.number().positive().max(1000).optional(),
        clearWidthM: z.number().positive().max(50).optional(),
        clearHeightM: z.number().positive().max(10).optional(),
        innerRadiusM: z.number().positive().max(100).optional(),
        intermediateLandingLengthM: z.number().nonnegative().max(100).optional(),
        entranceOffsetM: z.number().nonnegative().max(1000).optional(),
      })
      .optional(),
    residentialUnits: z.number().int().nonnegative().max(10000).optional(),
    residentialUnitsOver60M2: z.number().int().nonnegative().max(10000).optional(),
    officeWorkingAreaM2: z.number().nonnegative().max(1000000).optional(),
    parkingSpaces: z.number().int().nonnegative().max(10000).optional(),
    parkingLocation: z.enum(['unknown', 'ground-uncovered', 'within-building']).optional(),
    accessRoadWidthM: z.number().positive().max(200).optional(),
    routeConnectedToPublicRoad: z.boolean().optional(),
    drivewayWidthM: z.number().positive().max(50).optional(),
    drivewayDirection: z.enum(['one-way', 'two-way']).optional(),
  })
  .refine(
    (p) =>
      p.residentialUnits === undefined ||
      p.residentialUnitsOver60M2 === undefined ||
      p.residentialUnitsOver60M2 <= p.residentialUnits,
    { message: 'Units over60m² cannot exceed total units.' },
  );
// This research window bounds complexity/scope; it is never an authoritative zone.
const pointSchema = z.tuple([
  z.number().min(100.5903).max(100.6303),
  z.number().min(13.6779).max(13.7179),
]);
const plotSchema = z.array(pointSchema).min(3).max(1000);
export const scenarioSchema = z.strictObject({
  version: z.literal(3),
  rulesetId: z.literal('y7-reference'),
  rulesetVersion: z.enum([
    'research-preview.2',
    'research-preview.3',
    'research-preview.4',
    'research-preview.5',
    'research-preview.6',
  ]),
  use: z.enum(['condominium', 'office']),
  plot: plotSchema,
  assumptions: assumptionsSchema,
  roads: z
    .array(
      z.strictObject({
        id: z.string().min(1).max(100),
        name: z.string().min(1).max(200),
        geometry: z.array(pointSchema).min(2).max(200),
        widthM: z.number().positive().max(200).optional(),
        widthProvenance: z.enum(['tag', 'measured', 'user', 'unknown']),
        confirmed: z.boolean(),
        sourceUrl: z.url().optional(),
      }),
    )
    .max(100),
  frontage: z
    .array(
      z.strictObject({
        edgeIndex: z.number().int().nonnegative(),
        roadId: z.string().min(1).max(100),
      }),
    )
    .max(1000),
  transitDistanceM: z.number().nonnegative().max(100000).optional(),
  researchConstraints: z.boolean(),
  project: projectSchema.optional(),
});
export const previousScenarioSchema = z.strictObject({
  version: z.literal(2),
  rulesetId: z.literal('research-preview'),
  use: z.literal('condominium'),
  plot: plotSchema,
  assumptions: assumptionsSchema,
});
export const legacyScenarioSchema = z.strictObject({
  version: z.literal(1),
  plot: plotSchema,
  assumptions: assumptionsSchema,
});
export type Scenario = z.infer<typeof scenarioSchema>;
