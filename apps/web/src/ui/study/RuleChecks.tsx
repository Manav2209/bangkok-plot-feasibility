import type { StudyController } from '../../useStudyController';
import { number } from './format';
import { rules, sources } from '@bangkok/rules';

export function RuleChecks({ study }: { study: StudyController }) {
  const { design, result, setActiveRule } = study;
  return (
    <>
      <section className="checks-section">
        <div className="section-heading">
          <h2>Review status</h2>
          <span className="pending-tag">Incomplete</span>
        </div>
        <p className="checks-note">No overall compliance verdict</p>
        {(design?.checks ?? result?.checks)?.map((check) => (
          <details
            data-scope={check.scope}
            data-status={check.status}
            data-rule-id={check.id}
            className="check"
            key={check.id}
            onToggle={(e) => {
              if (e.currentTarget.open) setActiveRule(check.id);
            }}
          >
            <summary>
              <span
                className={
                  check.status === 'pass'
                    ? 'check-applied'
                    : check.status === 'unknown'
                      ? 'check-unknown'
                      : 'check-other'
                }
              >
                {check.status === 'pass'
                  ? '✓'
                  : check.status === 'fail'
                    ? '×'
                    : check.status === 'not-applicable'
                      ? '–'
                      : '?'}
              </span>
              <span>{check.title}</span>
              <small>
                {check.scope === 'assumption'
                  ? check.status === 'pass'
                    ? 'Assumption'
                    : check.status === 'unknown'
                      ? 'Unknown'
                      : check.status === 'not-applicable'
                        ? 'N/A'
                        : 'Failed'
                  : check.status === 'not-applicable'
                    ? 'N/A'
                    : check.status === 'pass'
                      ? 'Pass'
                      : check.status === 'fail'
                        ? 'Fail'
                        : 'Unknown'}
              </small>
            </summary>
            <p>{check.explanation}</p>
            {check.actual !== undefined && (
              <p>
                {check.measurementBasis === 'modelled-proxy' ? 'Model proxy' : 'Actual'}:{' '}
                {number(check.actual, 4)} {check.unit} ·{' '}
                {check.measurementBasis === 'modelled-proxy' ? 'historical candidate' : 'required'}:{' '}
                {number(check.required, 4)} {check.unit}
              </p>
            )}
            {rules
              .filter((rule) => rule.id === check.id)
              .map((rule) => (
                <div className="rule-evidence" key={rule.id}>
                  <p>
                    Evidence: {rule.evidence} · implementation: {rule.implementation}
                  </p>
                  {rule.clause && (
                    <p>
                      {rule.clause} · {rule.legalVersion}
                    </p>
                  )}
                  {rule.originalThai && <p lang="th">{rule.originalThai}</p>}
                  <p>{rule.interpretation}</p>
                  {rule.evidence === 'hypothesis' && (
                    <p>Historical candidate only; these values are not applied as legal limits.</p>
                  )}
                  {rule.exceptions.length > 0 && (
                    <p>Exceptions/review: {rule.exceptions.join(' ')}</p>
                  )}
                </div>
              ))}
            {check.sourceIds.length > 0 && (
              <div className="check-sources">
                {check.sourceIds.map((id) => {
                  const source = sources.find((entry) => entry.id === id);
                  return source ? (
                    <a key={id} href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                  ) : null;
                })}
              </div>
            )}
          </details>
        ))}
      </section>
    </>
  );
}
