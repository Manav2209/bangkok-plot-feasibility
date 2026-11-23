import type { StudyController } from '../../useStudyController';
import { PlotControls } from './PlotControls';
import { RoadControls } from './RoadControls';
import { AssumptionControls } from './AssumptionControls';
import { ProjectControls } from '../ProjectControls';
import { LocationSearch } from '../LocationSearch';

export function InputsPanel({ study }: { study: StudyController }) {
  const {
    inputsCollapsed,
    setInputsCollapsed,
    setDrawer,
    siteData,
    controls,
    project,
    updateProject,
    loadCoreExample,
  } = study;
  return (
    <>
      <aside
        id="site-inputs"
        tabIndex={-1}
        className={`site-panel ${inputsCollapsed ? 'panel-collapsed' : ''}`}
      >
        <button
          className="panel-toggle"
          aria-expanded={!inputsCollapsed}
          aria-controls="site-panel-body"
          onClick={() => setInputsCollapsed(!inputsCollapsed)}
        >
          {inputsCollapsed ? 'Show inputs' : 'Collapse inputs'}
        </button>
        <div id="site-panel-body" className="panel-content">
          <div className="panel-eyebrow">SITE EXPLORER</div>
          <h1>
            From plot
            <br />
            to possibility.
          </h1>
          <p className="intro">
            Explore how a boundary shapes a building. Start with the example or draw your own.
          </p>
          <div className="example-card">
            <span className="overview-label">START WITH AN EXAMPLE</span>
            <strong>A simple site. Two possibilities.</strong>
            <p>
              A 50 × 50 m square beside a straight road. Start with four floors and a 5 m boundary
              inset. The 8 m road width is illustrative.
            </p>
            <button className="primary-button" onClick={loadCoreExample}>
              Load simple example <span aria-hidden="true">↗</span>
            </button>
          </div>
          <details className="getting-started">
            <summary>First time? Start here</summary>
            <ol>
              <li>
                Locate the land, then draw its boundary. Search moves the map; it does not establish
                a parcel.
              </li>
              <li>
                Mark every road-facing edge and enter known road widths. White roads, purple dashed
                zone lines and orange selected frontage have different meanings.
              </li>
              <li>
                Choose a building use, compare Compact and Courtyard/Stepped, and inspect the floor
                table. Blue parking levels reduce usable capacity.
              </li>
              <li>
                Open review checks and sources. Assumptions are study settings; unknown evidence
                cannot establish legal feasibility. Save locally or copy the scenario link.
              </li>
            </ol>
            <p>
              You do not need to own land to explore the example. Calculations use researched,
              versioned rules and geometry. No AI call or new legal research runs when you edit. The
              example is illustrative; vacancy and title are unverified.
            </p>
            <button onClick={() => setDrawer(true)}>Read research and limitations</button>
          </details>
          <LocationSearch
            context={siteData.context}
            onLocate={(point) => controls?.locate(point)}
          />
          <PlotControls study={study} />
          <RoadControls study={study} />
          <ProjectControls value={project} onChange={updateProject} />
          <AssumptionControls study={study} />
          <div className="scope-note">
            <span className="note-icon">i</span>
            <div>
              <strong>An honest starting point</strong>
              <p>
                No personal plot is required: use Reset example to start. The outline is
                illustrative, inside the sourced 2013 zone. Parcel boundary and vacancy are
                unverified; existing buildings remain visible. Results show geometry, with legal
                feasibility unresolved. This preview is not a permit determination.
              </p>
            </div>
          </div>
          <div className="panel-footer">
            PHRA KHANONG · BANGKOK <span>TH</span>
          </div>
        </div>
      </aside>
    </>
  );
}
