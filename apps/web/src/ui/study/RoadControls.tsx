import type { StudyController } from '../../useStudyController';
import { number } from './format';
import type { RoadInput } from '@bangkok/domain';

export function RoadControls({ study }: { study: StudyController }) {
  const {
    controls,
    frontage,
    mappedRoads,
    plot,
    toggleFrontage,
    roads,
    updateRoad,
    transitDistanceM,
    setTransitDistanceM,
    changed,
  } = study;
  return (
    <>
      <section className="panel-section frontage-panel">
        <div className="section-heading">
          <h2>Road frontages</h2>
          <button onClick={() => controls?.frontage()} disabled={!controls}>
            Select on map
          </button>
        </div>
        <p className="field-hint">
          Mark every road-facing edge. Width is the legal right-of-way, not lane count. The research
          model assumes the plot edge meets that right-of-way.
        </p>
        <details className="nearby-roads">
          <summary>Nearby mapped roads · {mappedRoads.length}</summary>
          <p className="field-hint">
            Distances are from the drawn outline to OSM centrelines, not legal road edges. Proximity
            does not establish frontage or access rights.
          </p>
          {mappedRoads.length ? (
            <ul>
              {mappedRoads.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => controls?.locate(r.point)}
                    aria-label={`Show mapped road ${r.id}`}
                  >
                    {r.name}
                  </button>
                  <span>
                    About {number(r.distanceM)} m · {r.id}
                  </span>
                  <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                    Mapped road source
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="field-hint">
              No mapped roads are available for this outline. Road access remains unknown.
            </p>
          )}
        </details>
        <div className="edge-buttons">
          {plot.map((_, i) => (
            <button
              key={i}
              aria-pressed={frontage.some((f) => f.edgeIndex === i)}
              aria-label={`Frontage edge ${i + 1}`}
              onClick={() => toggleFrontage(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {frontage.map((f) => {
          const road = roads.find((r) => r.id === f.roadId);
          return road ? (
            <fieldset key={road.id}>
              <legend>Edge {f.edgeIndex + 1}</legend>
              <label>
                Road name
                <input
                  value={road.name}
                  onChange={(e) => updateRoad(road.id, { name: e.target.value })}
                />
              </label>
              <div className="input-pair">
                <label>
                  Road width, m
                  <input
                    aria-label={`Road width edge ${f.edgeIndex + 1}`}
                    type="number"
                    min="0.1"
                    max="200"
                    step="0.5"
                    value={road.widthM ?? ''}
                    onChange={(e) =>
                      updateRoad(road.id, {
                        widthM: e.target.value === '' ? undefined : Number(e.target.value),
                        confirmed: false,
                      })
                    }
                  />
                </label>
                <label>
                  Provenance
                  <select
                    value={road.widthProvenance}
                    onChange={(e) =>
                      updateRoad(road.id, {
                        widthProvenance: e.target.value as RoadInput['widthProvenance'],
                        confirmed: false,
                      })
                    }
                  >
                    <option value="unknown">Unknown</option>
                    <option value="tag">Map tag</option>
                    <option value="measured">Measured</option>
                    <option value="user">User supplied</option>
                  </select>
                </label>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={road.confirmed}
                  onChange={(e) => updateRoad(road.id, { confirmed: e.target.checked })}
                />
                Confirm width for this study
              </label>
              <small>Confirmation is a user assertion, not legal verification.</small>
            </fieldset>
          ) : null;
        })}
        <label>
          Distance to transit station, m (optional)
          <input
            aria-label="Transit station distance"
            type="number"
            min="0"
            value={transitDistanceM ?? ''}
            placeholder="Unknown"
            onChange={(e) => {
              setTransitDistanceM(e.target.value === '' ? undefined : Number(e.target.value));
              changed();
            }}
          />
        </label>
      </section>
    </>
  );
}
