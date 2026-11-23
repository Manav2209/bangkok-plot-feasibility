import type { DesignResult, ProjectInputs } from '@bangkok/domain';
import { coreRuleProfile } from '@bangkok/rules';

type Basis = NonNullable<ProjectInputs['coreBasis']>;
const declarations: { key: keyof Omit<Basis, 'officeOperationAreaM2'>; label: string }[] = [
  {
    key: 'wholeSiteAndBuildings',
    label:
      'The outline is the whole construction site for one new building; no retained buildings are omitted.',
  },
  {
    key: 'aggregationAccountedFor',
    label:
      'Any required aggregation of previously used, subdivided land is fully included or does not apply.',
  },
  {
    key: 'allFloorsAndCoverCounted',
    label:
      'All floors, overhead cover and related model extents are included. No bonus, area deduction, extra roofdeck, balcony, basement or rooftop object is claimed; planting is separate from paving/parking.',
  },
  {
    key: 'publicRoadReferences',
    label:
      'All public frontages are marked. Edges meet the near boundaries of straight, uniform public rights-of-way with parallel opposite boundaries.',
  },
  {
    key: 'matchingHeightDatum',
    label: 'The road level and model ground use the same height datum.',
  },
];

export function CoreBasisControls({
  project,
  onChange,
  onExample,
}: {
  project: ProjectInputs;
  onChange: (patch: Partial<ProjectInputs>) => void;
  onExample: () => void;
}) {
  const basis = project.coreBasis ?? {};
  return (
    <details className="core-basis">
      <summary>Core-rule model inputs</summary>
      <p className="field-hint">
        These are calculation declarations, not verified site facts. Missing declarations leave
        affected core checks unknown. The published controls and source editions are shown with each
        result.
      </p>
      <button onClick={onExample}>Load declared 8 m road example</button>
      <p className="field-hint">
        The example supplies a model road and level datum; it does not certify a real road.
      </p>
      {declarations.map(({ key, label }) => (
        <label className="checkbox-row" key={key}>
          <input
            type="checkbox"
            aria-label={`Core basis: ${key}`}
            checked={basis[key] === true}
            onChange={(e) => onChange({ coreBasis: { ...basis, [key]: e.target.checked } })}
          />
          <span>{label}</span>
        </label>
      ))}
      <label className="field-label" htmlFor="core-office-operation">
        Office operation area, m² (optional)
      </label>
      <input
        id="core-office-operation"
        type="number"
        min="1"
        max="1000000"
        step="1"
        value={basis.officeOperationAreaM2 ?? ''}
        placeholder="Including related outdoor activity"
        onChange={(e) =>
          onChange({
            coreBasis: {
              ...basis,
              officeOperationAreaM2: e.target.value === '' ? undefined : Number(e.target.value),
            },
          })
        }
      />
    </details>
  );
}

export function CoreModelResults({ assessment }: { assessment: DesignResult['coreAssessment'] }) {
  if (!assessment) return null;
  const passed = assessment.checks.filter((c) => c.status === 'pass').length;
  const unknown = assessment.checks.filter((c) => c.status === 'unknown').length;
  return (
    <section className="core-results" aria-label="Source-based core model checks">
      <div className="section-heading">
        <h2>Core rule checks</h2>
        <span className="pending-tag" data-testid="core-model-status">
          {assessment.status === 'pass'
            ? 'Pass · conditional model'
            : assessment.status === 'fail'
              ? 'Model fails'
              : 'Inputs incomplete'}
        </span>
      </div>
      <p className="checks-note">
        {passed} passed · {unknown} unknown. These checks compare the declared model with cited rule
        editions. They do not establish site permission or a permit.
      </p>
      <details>
        <summary>Supported scope and source editions</summary>
        <p>{assessment.scope}</p>
        <a href={coreRuleProfile.baselineUrl} target="_blank" rel="noreferrer">
          BMA planning-baseline explanation
        </a>
      </details>
      {assessment.checks.map((check) => {
        const rule = coreRuleProfile.rules.find((rule) => rule.id === check.id)!;
        return (
          <details className="check core-check" data-core-rule={check.id} key={check.id}>
            <summary>
              <span>{check.title}</span>
              <small>
                {check.status === 'pass'
                  ? 'Pass (model)'
                  : check.status === 'fail'
                    ? 'Fail'
                    : 'Unknown'}
              </small>
            </summary>
            <p>{check.explanation}</p>
            {check.actual !== undefined && (
              <p>
                Model:{' '}
                {new Intl.NumberFormat('en', { maximumFractionDigits: 4 }).format(check.actual)}{' '}
                {check.unit} · required:{' '}
                {new Intl.NumberFormat('en', { maximumFractionDigits: 4 }).format(
                  check.required ?? 0,
                )}{' '}
                {check.unit}
              </p>
            )}
            <p>{rule.interpretation}</p>
            <p lang="th">{rule.thai}</p>
            <a href={rule.url} target="_blank" rel="noreferrer">
              {rule.clause}
            </a>
          </details>
        );
      })}
    </section>
  );
}
