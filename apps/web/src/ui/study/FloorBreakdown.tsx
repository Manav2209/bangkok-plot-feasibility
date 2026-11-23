import type { StudyController } from '../../useStudyController';
import { number } from './format';

export function FloorBreakdown({ study }: { study: StudyController }) {
  const { design, use } = study;
  return (
    <>
      {design && (
        <details className="floor-details">
          <summary>Floor-by-floor areas · {design.title}</summary>
          <table className="floor-table">
            <caption>
              Actual rendered floor polygons; gross modelled area, not statutory FAR area.
            </caption>
            <thead>
              <tr>
                <th scope="col">Level</th>
                <th scope="col">Use</th>
                <th scope="col">Height, m</th>
                <th scope="col">Area, m²</th>
              </tr>
            </thead>
            <tbody>
              {design.floors.map((floor) => (
                <tr key={floor.level}>
                  <th scope="row">{floor.level}</th>
                  <td>{floor.use ?? (use === 'office' ? 'office' : 'residential')}</td>
                  <td>
                    {number(floor.baseM, 1)}–{number(floor.topM, 1)}
                  </td>
                  <td>{number(floor.areaM2, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  Total
                </th>
                <td data-testid="floor-total">{number(design.grossFloorAreaM2, 2)}</td>
              </tr>
            </tfoot>
          </table>
        </details>
      )}
    </>
  );
}
