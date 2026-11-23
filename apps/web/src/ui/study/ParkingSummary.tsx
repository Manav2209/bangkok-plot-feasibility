import type { StudyController } from '../../useStudyController';
import { number } from './format';

export function ParkingSummary({ study }: { study: StudyController }) {
  const { design, setParkingPlanLevel, setMode, setThreeD, controls, parkingPlanLevel } = study;
  return (
    <>
      {design?.parking && (
        <div className="parking-summary">
          <strong>Parking reference study</strong>
          <p>
            Count target:{' '}
            {design.parking.requiredSpaces === null ? 'Unknown' : design.parking.requiredSpaces} ·
            provided:{' '}
            {design.parking.providedSpaces === null ? 'Unknown' : design.parking.providedSpaces}.
          </p>
          <p>
            Reserved parking floor polygons: {number(design.parking.reservedFloorAreaM2)} m².
            Area-based capacity estimate: {design.parking.estimatedCapacity ?? 'Unknown'} spaces.
          </p>
          {design.parking.groundAllowanceM2 > 0 && (
            <p>Ground area allowance: {number(design.parking.groundAllowanceM2)} m².</p>
          )}
          {design.parking.ramp && (
            <p data-testid="ramp-summary">
              Parking-level rise: {number(design.parking.ramp.riseM, 2)} m. Ramp gradient:{' '}
              {design.parking.ramp.gradientPercent === null
                ? 'Unknown'
                : `${number(design.parking.ramp.gradientPercent, 2)}%`}
              . Minimum inclined run:{' '}
              {design.parking.ramp.minimumRunM === null
                ? 'Unknown'
                : `${number(design.parking.ramp.minimumRunM, 2)} m`}
              . Intermediate landings: {design.parking.ramp.intermediateLandings}. Red ramp
              reservation is schematic; vertical openings and turning remain unverified.
            </p>
          )}
          {!!design.parking.plans?.length && (
            <>
              <p>
                Schematic stalls placed: {design.parking.schematicSpaces}. Dimensions and aisle
                geometry use the reference profile.
              </p>
              <button
                onClick={() => {
                  setParkingPlanLevel(design.parking!.plans![0].level);
                  setMode('existing');
                  setThreeD(false);
                  controls?.view(false);
                }}
              >
                Inspect parking plan
              </button>
              {parkingPlanLevel !== null && (
                <label>
                  Parking level
                  <select
                    aria-label="Parking plan level"
                    value={parkingPlanLevel}
                    onChange={(e) => setParkingPlanLevel(Number(e.target.value))}
                  >
                    {design.parking.plans.map((p) => (
                      <option key={p.level} value={p.level}>
                        Level {p.level} · {p.stalls.length} stalls
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          <small>
            Schematic layout only; ramps, turning and fire access are not verified. Parking levels
            are blue in 3D.
          </small>
        </div>
      )}
    </>
  );
}
