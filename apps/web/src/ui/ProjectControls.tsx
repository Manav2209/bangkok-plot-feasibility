import type { ParkingRampInputs, ProjectInputs } from '@bangkok/domain';
export function ProjectControls({
  value,
  onChange,
}: {
  value: ProjectInputs;
  onChange: (patch: Partial<ProjectInputs>) => void;
}) {
  function rampChange(patch: Partial<ParkingRampInputs>) {
    onChange({ ramp: { ...value.ramp, ...patch } });
  }
  return (
    <section className="panel-section frontage-panel">
      <details>
        <summary>Parking, access and review inputs</summary>
        <p className="field-hint">
          Leave unknown inputs blank. These are project assertions and study allocations, not
          verified permits or vehicle layouts.
        </p>
        {(
          [
            ['residentialUnits', 'Total residential units'],
            ['residentialUnitsOver60M2', 'Residential units at least 60 m²'],
            ['officeWorkingAreaM2', 'Office working area, m²'],
            ['parkingSpaces', 'Parking spaces provided'],
            ['accessRoadWidthM', 'Connecting public road width, m'],
            ['drivewayWidthM', 'Driveway clear width, m'],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              aria-label={label}
              type="number"
              min="0"
              step={key.includes('Units') || key === 'parkingSpaces' ? '1' : '0.1'}
              value={value[key] ?? ''}
              placeholder="Unknown"
              onChange={(e) =>
                onChange({ [key]: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </label>
        ))}
        <label>
          Parking location
          <select
            aria-label="Parking location"
            value={value.parkingLocation ?? 'unknown'}
            onChange={(e) =>
              onChange({ parkingLocation: e.target.value as ProjectInputs['parkingLocation'] })
            }
          >
            <option value="unknown">Unknown</option>
            <option value="within-building">Reserve building floors</option>
            <option value="ground-uncovered">Uncovered ground allowance</option>
          </select>
        </label>
        <label>
          Public-road route connection
          <select
            aria-label="Public-road route connection"
            value={
              value.routeConnectedToPublicRoad === undefined
                ? 'unknown'
                : value.routeConnectedToPublicRoad
                  ? 'yes'
                  : 'no'
            }
            onChange={(e) =>
              onChange({
                routeConnectedToPublicRoad:
                  e.target.value === 'unknown' ? undefined : e.target.value === 'yes',
              })
            }
          >
            <option value="unknown">Unknown</option>
            <option value="yes">Asserted connected</option>
            <option value="no">Not connected</option>
          </select>
        </label>
        <label>
          Driveway direction
          <select
            aria-label="Driveway direction"
            value={value.drivewayDirection ?? 'unknown'}
            onChange={(e) =>
              onChange({
                drivewayDirection:
                  e.target.value === 'unknown'
                    ? undefined
                    : (e.target.value as ProjectInputs['drivewayDirection']),
              })
            }
          >
            <option value="unknown">Unknown</option>
            <option value="one-way">One-way</option>
            <option value="two-way">Two-way</option>
          </select>
        </label>
        <details className="ramp-inputs">
          <summary>Ramp dimensions and clearance</summary>
          <p className="field-hint">
            For multiple parking levels, the rise comes from actual modelled floor elevations.
            Horizontal run excludes flat intermediate landings. Enter measured/planned dimensions;
            leave missing data unknown.
          </p>
          <label>
            Ramp type
            <select
              aria-label="Ramp type"
              value={value.ramp?.kind ?? 'unknown'}
              onChange={(e) =>
                rampChange({
                  kind:
                    e.target.value === 'unknown'
                      ? undefined
                      : (e.target.value as ParkingRampInputs['kind']),
                })
              }
            >
              <option value="unknown">Unknown</option>
              <option value="straight">Straight</option>
              <option value="curved">Curved / spiral</option>
            </select>
          </label>
          {(
            [
              ['horizontalRunM', 'Ramp horizontal inclined run, m'],
              ['clearWidthM', 'Ramp clear width, m'],
              ['clearHeightM', 'Parking and ramp clear height, m'],
              ['innerRadiusM', 'Curved ramp inner radius, m'],
              ['intermediateLandingLengthM', 'Each intermediate ramp landing, m'],
              ['entranceOffsetM', 'Ground ramp to entrance mouth, m'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                aria-label={label}
                type="number"
                min="0"
                step="0.1"
                placeholder="Unknown"
                value={value.ramp?.[key] ?? ''}
                onChange={(e) =>
                  rampChange({ [key]: e.target.value === '' ? undefined : Number(e.target.value) })
                }
              />
            </label>
          ))}
        </details>
      </details>
    </section>
  );
}
