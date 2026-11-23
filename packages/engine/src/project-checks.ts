import type { CheckResult, FloorGeometry, ParkingPlan, SiteInput } from '@bangkok/domain';
import { referenceProfile, referenceValue as v } from '@bangkok/rules';
import { packParking } from './parking-layout';
import { screenFireFrontage } from './fire-frontage';
import { union } from '@bangkok/geometry';
import { screenRamp } from './ramp-checks';

/** Reference screening only. User provision and area allowances never certify a parking/fire plan. */
export function screenProject(
  input: SiteInput,
  originalFloors: FloorGeometry[],
  grossArea: number,
  uncovered: number,
) {
  const project = input.project ?? {},
    core = input.assumptions.coreFraction ?? referenceProfile.designDefaults.coreFraction;
  const allowance =
    input.assumptions.parkingSpaceAreaM2 ?? referenceProfile.designDefaults.parkingSpaceAreaM2;
  const height = originalFloors.at(-1)?.topM ?? 0;
  const large =
    grossArea > v('largeBuildingArea') ||
    (height >= v('largeBuildingHeight') && grossArea > v('largeBuildingIntermediateArea'));
  const largeMinimum = large ? Math.ceil(grossArea / v('largeBuildingParkingAreaPerSpace')) : 0;
  const useMinimum =
    input.use === 'condominium'
      ? project.residentialUnitsOver60M2
      : project.officeWorkingAreaM2 === undefined
        ? undefined
        : project.officeWorkingAreaM2 >= v('officeParkingTrigger')
          ? Math.ceil(project.officeWorkingAreaM2 / v('officeParkingAreaPerSpace'))
          : 0;
  const requiredSpaces = useMinimum === undefined ? null : Math.max(useMinimum, largeMinimum);
  const providedSpaces = project.parkingSpaces ?? null;
  const floors: FloorGeometry[] = originalFloors.map((f) => ({
    ...f,
    use: input.use === 'office' ? 'office' : 'residential',
  }));
  let reservedFloorAreaM2 = 0,
    groundAllowanceM2 = 0,
    estimatedCapacity: number | null = null;
  const plans: ParkingPlan[] = [];
  let schematicSpaces = 0;
  if (providedSpaces !== null && project.parkingLocation === 'within-building') {
    for (const floor of floors) {
      if (
        reservedFloorAreaM2 * (1 - core) >= providedSpaces * allowance &&
        schematicSpaces >= providedSpaces
      )
        break;
      floor.use = 'parking';
      reservedFloorAreaM2 += floor.areaM2;
      // Pick orientation from full bounded capacity, not the few stalls remaining on
      // the final level. Otherwise identical floors can rotate their service reserve
      // and leave no aligned vertical ramp space.
      const packed = packParking(floor.polygons, core, 200);
      const plan = {
        level: floor.level,
        ...packed,
        stalls: packed.stalls.slice(0, Math.max(0, providedSpaces - schematicSpaces)),
      };
      plans.push(plan);
      schematicSpaces += plan.stalls.length;
    }
    estimatedCapacity = Math.floor((reservedFloorAreaM2 * (1 - core)) / allowance);
  }
  if (providedSpaces !== null && project.parkingLocation === 'ground-uncovered') {
    groundAllowanceM2 = providedSpaces * allowance;
    estimatedCapacity = providedSpaces;
  }
  const usableAreaM2 = (grossArea - reservedFloorAreaM2) * (1 - core);
  const check = (
    id: string,
    title: string,
    status: CheckResult['status'],
    explanation: string,
    actual?: number,
    required?: number,
    unit?: string,
  ): CheckResult => ({
    id,
    title,
    status,
    scope: 'assumption',
    explanation: `Historical reference / design assumptions only. ${explanation}`,
    actual,
    required,
    unit,
    sourceIds: ['bma-building-2544'],
  });
  const countStatus =
    providedSpaces !== null && providedSpaces < largeMinimum
      ? 'fail'
      : requiredSpaces === 0 && providedSpaces === null
        ? 'not-applicable'
        : requiredSpaces === null || providedSpaces === null
          ? 'unknown'
          : providedSpaces >= requiredSpaces
            ? 'pass'
            : 'fail';
  const checks: CheckResult[] = [
    check(
      'model-parking-count',
      'Reference parking count',
      countStatus,
      requiredSpaces === null
        ? `The use-specific input is unknown. The model large-building screen alone suggests at least ${largeMinimum} spaces; it is not the full requirement.`
        : 'The reference screen takes the larger of the use and large-building counts, rounded up. User-provided spaces are not a verified parking layout.',
      providedSpaces ?? undefined,
      requiredSpaces ?? undefined,
      'spaces',
    ),
  ];
  if (project.officeWorkingAreaM2 !== undefined && input.use === 'office')
    checks.push(
      check(
        'model-office-allocation',
        'Office working-area allocation',
        project.officeWorkingAreaM2 <= usableAreaM2 ? 'pass' : 'fail',
        'Declared working area must fit the modelled non-parking capacity after the core/circulation assumption.',
        project.officeWorkingAreaM2,
        usableAreaM2,
        'm²',
      ),
    );
  if (
    providedSpaces !== null &&
    providedSpaces > 0 &&
    project.parkingLocation === 'within-building'
  ) {
    checks.push(
      check(
        'model-parking-packing',
        'Schematic parking geometry',
        schematicSpaces >= providedSpaces ? 'pass' : 'fail',
        'Contained perpendicular stalls, connected aisle strips and a separate service reserve are generated on actual floor polygons. This bounded packing supports at most 200 stalls per floor. Ramps, columns, swept paths, clear heights and connection to a lawful entrance are not verified; failed packing does not prove every possible layout fails.',
        schematicSpaces,
        providedSpaces,
        'stalls',
      ),
    );
    checks.push(
      check(
        'model-parking-area',
        'Parking floor-area allowance',
        estimatedCapacity! >= providedSpaces ? 'pass' : 'fail',
        'Bottom floors are reserved and rendered as parking. Capacity uses actual reserved floor polygons and the stated area-per-space allowance; stall geometry is not verified.',
        estimatedCapacity!,
        providedSpaces,
        'spaces',
      ),
    );
    checks.push(
      check(
        'model-occupied-floor',
        'Non-parking capacity',
        usableAreaM2 > 0 ? 'pass' : 'fail',
        'At least some modelled capacity must remain for the selected building use.',
        usableAreaM2,
        0,
        'm² above zero',
      ),
    );
  }
  if (project.parkingLocation === 'ground-uncovered') {
    const permeable =
      uncovered *
      (input.assumptions.permeableFraction ?? referenceProfile.designDefaults.permeableFraction);
    checks.push(
      check(
        'model-ground-allocation',
        'Ground parking and permeable allocation',
        groundAllowanceM2 + permeable <= uncovered + 0.01 ? 'pass' : 'fail',
        'The parking area allowance and assumed permeable allocation cannot both consume the same uncovered ground. This is an aggregate allowance, not a surveyed stall layout.',
        groundAllowanceM2 + permeable,
        uncovered,
        'm²',
      ),
    );
  }
  checks.push(
    check(
      'model-parking-layout',
      'Parking layout evidence',
      providedSpaces === 0 && requiredSpaces === 0 ? 'not-applicable' : 'unknown',
      'A schematic perpendicular-stall plan is available for reserved building floors. Turning paths, ramps, gradients, structure, legal entrance and the statutory counting/exclusion definition remain unverified. Schematic packing does not pass this evidence check.',
    ),
  );
  const vehicleParking = providedSpaces ?? requiredSpaces;
  if (vehicleParking !== null && vehicleParking > 0) {
    const drivewayRequired =
      project.drivewayDirection === 'one-way'
        ? v('oneWayDriveway')
        : project.drivewayDirection === 'two-way'
          ? v('twoWayDriveway')
          : undefined;
    checks.push(
      check(
        'model-driveway',
        'Reference driveway width',
        project.drivewayWidthM === undefined || drivewayRequired === undefined
          ? 'unknown'
          : project.drivewayWidthM >= drivewayRequired
            ? 'pass'
            : 'fail',
        'A width screen does not establish connection, clear height, turning geometry or fire access.',
        project.drivewayWidthM,
        drivewayRequired,
        'm',
      ),
    );
  }
  if (vehicleParking !== null && vehicleParking >= v('parkingAccessTrigger')) {
    const accessStatus =
      project.routeConnectedToPublicRoad === false
        ? 'fail'
        : project.accessRoadWidthM === undefined || project.routeConnectedToPublicRoad === undefined
          ? 'unknown'
          : project.accessRoadWidthM >= v('parkingPublicRoadMin')
            ? 'pass'
            : 'fail';
    checks.push(
      check(
        'model-public-road',
        'Reference continuous public-road access',
        accessStatus,
        'For the reference parking trigger, the road-width screen also needs declared continuous connection. Legal right-of-way, route geometry and ownership/access rights remain unverified.',
        project.accessRoadWidthM,
        v('parkingPublicRoadMin'),
        'm',
      ),
    );
  }
  checks.push(
    screenFireFrontage(
      input,
      union(originalFloors.flatMap((f) => f.polygons)),
      originalFloors.length,
    ),
    check(
      'model-fire-layout',
      'Fire-access geometry',
      'unknown',
      `A ${input.assumptions.fireAccessRingM ?? 0} m additional boundary reserve is modelled when requested. Vehicle access, turning and applicable fire provisions require a sourced layout; a buffer alone is insufficient.`,
    ),
  );
  const eia = check(
    'model-eia',
    'Collective-housing EIA screening',
    input.use === 'office' ? 'not-applicable' : 'unknown',
    input.use === 'office'
      ? 'This collective-housing category is not the office determination; other categories and overlays remain unresolved.'
      : `${project.residentialUnits === undefined ? 'Unit count is unknown.' : `${project.residentialUnits} units declared; reference unit trigger ${v('eiaResidentialUnits')}.`} Estimated usable model capacity is ${usableAreaM2.toFixed(2)} m², compared with reference usable-area trigger ${v('eiaResidentialArea')} m². ${project.residentialUnits !== undefined && project.residentialUnits >= v('eiaResidentialUnits') ? 'The unit-count screen triggers a review requirement.' : 'A usable-area proxy cannot establish the legal area definition.'} A review trigger is not itself a prohibition or approval.`,
    input.use === 'condominium' ? usableAreaM2 : undefined,
    input.use === 'condominium' ? v('eiaResidentialArea') : undefined,
    input.use === 'condominium' ? 'model m²' : undefined,
  );
  eia.sourceIds = ['onep-eia-2023'];
  eia.measurementBasis = 'modelled-proxy';
  checks.push(eia);
  const rampReview = screenRamp(project, floors, plans);
  checks.push(...rampReview.checks);
  return {
    floors,
    usableAreaM2,
    checks,
    parking: {
      requiredSpaces,
      providedSpaces,
      estimatedCapacity,
      reservedFloorAreaM2,
      groundAllowanceM2,
      layoutVerified: false as const,
      plans,
      schematicSpaces,
      ramp: rampReview.ramp,
    },
  };
}
