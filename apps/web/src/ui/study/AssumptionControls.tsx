import type { StudyController } from '../../useStudyController';
import { number } from './format';

export function AssumptionControls({ study }: { study: StudyController }) {
  const { assumptions, updateAssumption, researchConstraints, setResearchConstraints, changed } =
    study;
  return (
    <>
      <section className="panel-section assumptions">
        <div className="section-heading">
          <h2>Explore assumptions</h2>
          <span className="tiny-tag">Not legal limits</span>
        </div>
        <label className="range-label" htmlFor="setback">
          <span>Boundary inset</span>
          <strong>{number(assumptions.setbackM, 1)} m</strong>
        </label>
        <input
          id="setback"
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={assumptions.setbackM}
          onChange={(event) => updateAssumption('setbackM', Number(event.target.value))}
        />
        <div className="range-extents">
          <span>0 m</span>
          <span>20 m</span>
        </div>
        <div className="input-pair">
          <label htmlFor="floors">
            Floors
            <input
              id="floors"
              type="number"
              min="1"
              max="30"
              step="1"
              value={assumptions.floors}
              onChange={(event) => updateAssumption('floors', event.target.valueAsNumber)}
            />
          </label>
          <label htmlFor="floor-height">
            Floor height, m
            <input
              id="floor-height"
              type="number"
              min="2"
              max="6"
              step="0.1"
              value={assumptions.floorHeightM}
              onChange={(event) => updateAssumption('floorHeightM', event.target.valueAsNumber)}
            />
          </label>
        </div>
        <p className="field-hint">
          The inset is an additional design buffer. Reference setbacks and road-height planes also
          constrain the study when enabled.
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={researchConstraints}
            onChange={(e) => {
              setResearchConstraints(e.target.checked);
              changed();
            }}
          />
          Apply historical reference constraints
        </label>
        <details>
          <summary>Usability and landscape assumptions</summary>
          <div className="input-pair">
            {(
              [
                ['minWidthM', 'Minimum width, m', 6],
                ['minDepthM', 'Minimum depth, m', 6],
                ['courtyardM', 'Courtyard width, m', 8],
                ['coreFraction', 'Core / circulation fraction', 0.12],
                ['permeableFraction', 'Permeable share of uncovered ground', 0.5],
                ['parkingSpaceAreaM2', 'Parking area allowance, m²/space', 25],
                ['fireAccessRingM', 'Additional access reserve, m', 0],
              ] as const
            ).map(([key, label, fallback]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  step={key.includes('Fraction') ? '0.01' : '1'}
                  min={
                    key.includes('Fraction') || key === 'fireAccessRingM'
                      ? 0
                      : key === 'parkingSpaceAreaM2'
                        ? 10
                        : 3
                  }
                  max={
                    key === 'coreFraction'
                      ? 0.5
                      : key === 'permeableFraction'
                        ? 1
                        : key === 'parkingSpaceAreaM2'
                          ? 100
                          : key === 'fireAccessRingM'
                            ? 15
                            : 50
                  }
                  value={assumptions[key] ?? fallback}
                  onChange={(e) => updateAssumption(key, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        </details>
      </section>
    </>
  );
}
