import type { StudyController } from '../../useStudyController';
import { number } from './format';

export function RoadClearance({ study }: { study: StudyController }) {
  return (
    <>
      {study.modelRoads.map((model) => (
        <div className="road-clearance" key={model.road.id} data-testid="road-clearance">
          <span className="overview-label">EDGE {model.edgeIndex + 1} · MODEL ROAD CLEARANCE</span>
          <strong data-testid="road-edge-gap">
            {number(model.gapM, 1)} <small>m</small>
          </strong>
          <p>
            Building to assumed road boundary. Centreline gap:{' '}
            <b data-testid="road-centreline-gap">{number(model.centrelineGapM, 1)} m</b>.
          </p>
          <p>
            The shaded corridor is {number(model.road.widthM, 1)} m wide. Its width and legal
            boundary are assumptions, not surveyed facts.
          </p>
          {model.mappedOffsetM !== undefined && (
            <p>
              Model-to-mapped centreline offset: {number(model.mappedOffsetM, 1)} m. Mapping
              accuracy is unverified.
            </p>
          )}
          {model.mappedOffsetM !== undefined &&
            model.mappedOffsetM > Math.max(2, model.road.widthM! / 4) && (
              <p className="road-reference-warning" role="alert">
                The assumed corridor does not align with the mapped road. Correct the plot boundary
                or road reference before relying on road checks.
              </p>
            )}
          {model.gapM !== undefined && model.gapM < 0 && (
            <p className="road-reference-warning" role="alert">
              The building crosses the assumed road boundary.
            </p>
          )}
        </div>
      ))}
    </>
  );
}
