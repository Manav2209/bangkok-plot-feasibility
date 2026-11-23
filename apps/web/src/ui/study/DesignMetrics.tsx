import type { StudyController } from '../../useStudyController';
import { number } from './format';

export function DesignMetrics({ study }: { study: StudyController }) {
  const { design, activeRule, setActiveRule } = study;
  return (
    <>
      <p className="design-description">
        {design?.description ?? 'Draw a valid plot to generate a massing.'}
      </p>
      <div className="hero-metric">
        <span>Gross modelled floor area</span>
        <div>
          <strong data-testid="gross-area">{number(design?.grossFloorAreaM2)}</strong>
          <span>m²</span>
        </div>
        <small>Sum of actual floor polygons</small>
      </div>
      <dl className="metrics-grid">
        <div>
          <dt>Footprint</dt>
          <dd>
            {number(design?.footprintM2)} <span>m²</span>
          </dd>
        </div>
        <div>
          <dt>Height</dt>
          <dd>
            {number(design?.heightM, 1)} <span>m</span>
          </dd>
        </div>
        <div>
          <dt>Floors generated</dt>
          <dd data-testid="floor-count">{design?.floors.length ?? '—'}</dd>
        </div>
        <div>
          <dt>Modelled FAR</dt>
          <dd>
            {number(design?.modelledFar, 2)} <span>×</span>
          </dd>
        </div>
      </dl>
      {design?.usableAreaM2 !== undefined && (
        <p className="field-hint">
          Estimated usable capacity: {number(design.usableAreaM2)} m² after assumed
          core/circulation. Allocated permeable ground: {number(design.modelledPermeableM2)} m².
        </p>
      )}
      {(design?.budgets ?? []).map((budget) => (
        <button
          className={`budget-block ${activeRule === budget.id ? 'budget-active' : ''}`}
          key={budget.id}
          onClick={() => setActiveRule(budget.id)}
        >
          <span>{budget.label}</span>
          <strong>
            {number(budget.used)} / {number(budget.limit)} {budget.unit}
          </strong>
          <progress max={Math.max(budget.limit, budget.used, 1)} value={budget.used} />
          <small>Historical candidate · not a statutory allowance</small>
        </button>
      ))}
      {design && (
        <p className="checks-note">
          Base reference ratios and gross modelled area only. No FAR incentive bonus or parking-area
          deduction is applied.
        </p>
      )}
      <dl className="metrics-grid legal-metrics">
        <div>
          <dt>Regulated floor area</dt>
          <dd>
            {design?.regulatedAreaM2 == null ? 'Unknown' : `${number(design.regulatedAreaM2)} m²`}
          </dd>
        </div>
        <div>
          <dt>Permeable allocation</dt>
          <dd>
            {design?.permeableAreaM2 == null ? 'Unknown' : `${number(design.permeableAreaM2)} m²`}
          </dd>
        </div>
      </dl>
    </>
  );
}
