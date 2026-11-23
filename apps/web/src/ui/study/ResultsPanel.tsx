import type { StudyController } from '../../useStudyController';
import { number } from './format';
import { DesignMetrics } from './DesignMetrics';
import { ParkingSummary } from './ParkingSummary';
import { FloorBreakdown } from './FloorBreakdown';
import { RuleChecks } from './RuleChecks';
import { CoreModelResults } from '../CoreModel';

export function ResultsPanel({ study }: { study: StudyController }) {
  const {
    resultsCollapsed,
    pending,
    setResultsCollapsed,
    design,
    result,
    setSelected,
    error,
    setDrawer,
  } = study;
  return (
    <>
      <aside
        className={`results-panel ${resultsCollapsed ? 'panel-collapsed' : ''}`}
        aria-busy={pending}
      >
        <button
          className="panel-toggle"
          aria-expanded={!resultsCollapsed}
          aria-controls="results-panel-body"
          onClick={() => setResultsCollapsed(!resultsCollapsed)}
        >
          {resultsCollapsed ? 'Show results' : 'Collapse results'}
        </button>
        <div id="results-panel-body" className="panel-content">
          <div className="panel-eyebrow">MASSING STUDY</div>
          <h2 className="results-title">Explore the potential</h2>
          <p className="results-intro">
            Two geometric approaches.
            <br />
            One shared, measured boundary.
          </p>
          <div className="design-picker" aria-label="Design selection">
            {(['compact', 'stepped'] as const).map((id, index) => (
              <button
                key={id}
                aria-pressed={design?.id === id}
                className={design?.id === id ? 'selected' : ''}
                disabled={!result?.designs.some((d) => d.id === id)}
                onClick={() => setSelected(id)}
              >
                <span className={`design-icon ${id}`}>
                  <i />
                  <i />
                  <i />
                </span>
                <span>
                  <small>OPTION {index === 0 ? 'A' : 'B'}</small>
                  <strong>
                    {id === 'compact'
                      ? 'Compact'
                      : result?.designs.find((d) => d.id === id)?.title.includes('Courtyard')
                        ? 'Courtyard'
                        : 'Stepped'}
                  </strong>
                </span>
              </button>
            ))}
          </div>
          {pending && (
            <div className="state-message" role="status">
              Updating geometry and measurements…
            </div>
          )}
          {error && (
            <div className="state-message error-state" role="alert">
              {error}
            </div>
          )}
          {result?.diagnostics.map((message) => (
            <div className="state-message" role="status" key={message}>
              {message}
            </div>
          ))}
          {result?.search && (
            <p className="field-hint">
              Search: {result.search.tested.toLocaleString()} bounded trials ·{' '}
              {result.search.outcome}.{' '}
              {result.timingMs &&
                `Envelope ${number(result.timingMs.envelope, 1)} ms; designs ${number(result.timingMs.designs, 1)} ms.`}
            </p>
          )}
          <DesignMetrics study={study} />
          <ParkingSummary study={study} />
          <FloorBreakdown study={study} />{' '}
          <div className="open-space">
            <div>
              <span>Uncovered ground</span>
              <strong>{number(design?.uncoveredM2)} m²</strong>
            </div>
            <div className="space-track">
              <span
                style={{
                  width: `${design && result ? (100 * design.uncoveredM2) / result.plotAreaM2 : 0}%`,
                }}
              />
            </div>
            <p>
              Uncovered plot area; permeability and statutory open-space accounting are unresolved.
            </p>
          </div>
          <CoreModelResults assessment={design?.coreAssessment} />
          <RuleChecks study={study} />{' '}
          <button className="research-button" onClick={() => setDrawer(true)}>
            Open research & limitations
          </button>
        </div>
      </aside>
    </>
  );
}
