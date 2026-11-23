import type { StudyController } from '../../useStudyController';
import { number } from './format';
import type { BuildingUse } from '@bangkok/domain';
import { imageryStudy } from '../../imageryStudy';
import { CoreBasisControls } from '../CoreModel';

export function PlotControls({ study }: { study: StudyController }) {
  const {
    reset,
    result,
    preview,
    controls,
    setThreeD,
    plot,
    undo,
    history,
    loadImageryStudy,
    project,
    updateProject,
    loadCoreExample,
    updatePlot,
    siteData,
    use,
    setUse,
    changed,
  } = study;
  return (
    <>
      <section className="panel-section">
        <div className="section-heading">
          <h2>Your plot</h2>
          <button className="text-button" onClick={reset}>
            Reset example
          </button>
        </div>
        <div className="plot-area">
          <strong data-testid="plot-area">{number((result ?? preview)?.plotAreaM2)}</strong>
          <span>m² plot area</span>
        </div>
        {result && (
          <p className="field-hint">
            {number(result.plotAreaM2 / 1600, 3)} rai · {number(result.plotAreaM2 / 400, 3)} ngan ·{' '}
            {number(result.plotAreaM2 / 4, 2)} square wah (equivalent units)
          </p>
        )}
        <div className="two-buttons">
          <button
            className="primary-button"
            disabled={!controls}
            onClick={() => {
              setThreeD(false);
              controls?.draw();
            }}
          >
            Draw a plot
          </button>
          <button
            disabled={!controls || plot.length < 3}
            onClick={() => {
              setThreeD(false);
              controls?.view(false);
              controls?.edit();
            }}
          >
            Edit boundary
          </button>
        </div>
        <div className="boundary-meta">
          <span>{plot.length} vertices · irregular plots supported</span>
          <button className="text-button" onClick={undo} disabled={!history.current.length}>
            Undo
          </button>
        </div>
        <details className="imagery-study">
          <summary>Dated imagery study · {imageryStudy.label}</summary>
          <p className="field-hint">{imageryStudy.observation}</p>
          <button onClick={loadImageryStudy}>Load imagery study</button>
          <p className="field-hint">
            {imageryStudy.attribution}.{' '}
            <a href={imageryStudy.imageUrl} target="_blank" rel="noreferrer">
              Source image
            </a>{' '}
            ·{' '}
            <a href={imageryStudy.citationUrl} target="_blank" rel="noreferrer">
              Capture-date metadata
            </a>
            . Provider imagery can change; this record describes the inspected capture.
          </p>
        </details>
        <CoreBasisControls project={project} onChange={updateProject} onExample={loadCoreExample} />
        <details className="coordinate-editor">
          <summary>Boundary coordinates · keyboard editing</summary>
          {plot.map((p, index) => (
            <div className="coordinate-row" key={index}>
              <span>Vertex {index + 1}</span>
              {([0, 1] as const).map((axis) => (
                <label key={axis}>
                  {axis === 0 ? 'Longitude' : 'Latitude'}
                  <input
                    aria-label={`Vertex ${index + 1} ${axis === 0 ? 'longitude' : 'latitude'}`}
                    type="number"
                    step="0.00001"
                    value={p[axis]}
                    onChange={(event) =>
                      updatePlot(
                        plot.map((point, i) =>
                          i === index
                            ? (point.map((value, a) =>
                                a === axis ? Number(event.target.value) : value,
                              ) as [number, number])
                            : point,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          ))}
        </details>
        <p className="zone-status" data-testid="zone-status">
          2013 Y.7-21 GIS:{' '}
          {siteData.loading ? 'loading boundary' : (result?.zoneMembership ?? 'unknown')}. Current
          legal applicability is reviewed separately.
        </p>
        <label className="field-label" htmlFor="building-use">
          Building type
        </label>
        <select
          id="building-use"
          value={use}
          onChange={(event) => {
            setUse(event.target.value as BuildingUse);
            changed();
          }}
        >
          <option value="condominium">Condominium</option>
          <option value="office">Office</option>
        </select>
        <p className="field-hint">
          Historical Y.7 use and size conditions differ. Their current applicability remains under
          review.
        </p>
      </section>
    </>
  );
}
