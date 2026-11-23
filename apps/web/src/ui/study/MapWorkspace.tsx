import type { StudyController } from '../../useStudyController';
import { number } from './format';
import { SiteMap } from '../../map/SiteMap';

export function MapWorkspace({ study }: { study: StudyController }) {
  const {
    plot,
    result,
    preview,
    design,
    mode,
    assumptions,
    updatePlot,
    setControls,
    siteData,
    frontage,
    toggleFrontage,
    overlay,
    activeRule,
    parkingPlanLevel,
    toolbarRef,
    setMode,
    setParkingPlanLevel,
    setOverlay,
    threeD,
    controls,
    setThreeD,
    pending,
    error,
  } = study;
  return (
    <>
      <main id="site-view" tabIndex={-1} className="map-panel">
        <SiteMap
          plot={plot}
          result={result}
          preview={preview}
          design={design}
          mode={mode}
          heightM={assumptions.floors * assumptions.floorHeightM}
          onPlot={updatePlot}
          onReady={setControls}
          context={siteData.context}
          contextBounds={siteData.contextBounds}
          zone={siteData.zone}
          frontage={frontage}
          onFrontage={toggleFrontage}
          overlay={overlay}
          activeRule={activeRule}
          parkingPlan={
            parkingPlanLevel === null
              ? undefined
              : design?.parking?.plans?.find((p) => p.level === parkingPlanLevel)
          }
          parkingRamp={parkingPlanLevel === null ? undefined : design?.parking?.ramp?.footprint}
        />
        <div className="map-toolbar" ref={toolbarRef} aria-label="Map view controls">
          <nav className="view-switch" aria-label="Map layers">
            {(
              [
                ['existing', 'Boundary'],
                ['envelope', 'Reference envelope'],
                ['proposal', 'Massing'],
              ] as const
            ).map(([value, title]) => (
              <button
                key={value}
                aria-pressed={mode === value}
                className={mode === value ? 'active' : ''}
                onClick={() => {
                  setMode(value);
                  setParkingPlanLevel(null);
                }}
              >
                {title}
              </button>
            ))}
          </nav>
          <label className="overlay-control">
            <input
              type="checkbox"
              checked={overlay}
              onChange={(e) => setOverlay(e.target.checked)}
            />
            Envelope overlay
          </label>
          <div className="camera-switch">
            <button
              aria-pressed={!threeD}
              className={!threeD ? 'active' : ''}
              disabled={!controls}
              onClick={() => {
                setThreeD(false);
                controls?.view(false);
              }}
            >
              2D
            </button>
            <button
              aria-pressed={threeD}
              className={threeD ? 'active' : ''}
              disabled={!controls}
              onClick={() => {
                setThreeD(true);
                setParkingPlanLevel(null);
                controls?.view(true);
              }}
            >
              3D
            </button>
            <button
              className="fit-button"
              disabled={!controls}
              onClick={() => controls?.fit()}
              title="Fit plot in view"
              aria-label="Fit plot in view"
            >
              ⌖
            </button>
          </div>
        </div>
        {siteData.errors.length > 0 && (
          <div className="data-error" role="alert">
            {siteData.errors.join(' ')}
            <button onClick={siteData.retry}>Retry site data</button>
          </div>
        )}
        <div className="map-caption">
          <span>
            {pending
              ? 'Calculating this revision…'
              : error
                ? 'Calculation unavailable'
                : result?.status === 'outside-zone'
                  ? 'Outside supported zone · results disabled'
                  : result?.status === 'partial'
                    ? 'Measured geometry · legal review pending'
                    : 'Edit the plot to explore'}
          </span>
          <span>{result ? `${number(result.durationMs, 1)} ms calculation` : ''}</span>
        </div>
      </main>
    </>
  );
}
