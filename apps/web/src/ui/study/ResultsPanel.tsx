import type { StudyController } from '../../useStudyController';
import { number } from './format';
import { DesignMetrics } from './DesignMetrics';
import { ParkingSummary } from './ParkingSummary';
import { FloorBreakdown } from './FloorBreakdown';
import { RuleChecks } from './RuleChecks';
import { CoreModelResults } from '../CoreModel';
import { StudyNotes } from './StudyNotes';

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
        id="design-results"
        tabIndex={-1}
        className={`results-panel ${resultsCollapsed ? 'panel-collapsed' : ''}`}
        aria-busy={pending}
        data-envelope-ms={result?.timingMs?.envelope}
        data-design-ms={result?.timingMs?.designs}
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
          {!result?.designs.length && <StudyNotes study={study} />}
          {design?.coreAssessment && (
            <div className="core-overview" data-status={design.coreAssessment.status}>
              <div>
                <span className="overview-label">CORE MODEL CHECKS</span>
                <strong>
                  {design.coreAssessment.status === 'pass'
                    ? `${design.coreAssessment.checks.filter((check) => check.status === 'pass').length} of ${design.coreAssessment.checks.length} passed`
                    : design.coreAssessment.status === 'fail'
                      ? 'Review failed checks'
                      : `${design.coreAssessment.checks.filter((check) => check.status === 'unknown').length} need more information`}
                </strong>
              </div>
              <p>Declared-model assessment · site approval remains unresolved.</p>
            </div>
          )}
          <DesignMetrics study={study} />
          {!!result?.designs.length && <StudyNotes study={study} />}
          <ParkingSummary study={study} />
          <FloorBreakdown study={study} />
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
          <RuleChecks study={study} />
          <button className="research-button" onClick={() => setDrawer(true)}>
            Open research & limitations
          </button>
        </div>
      </aside>
    </>
  );
}
