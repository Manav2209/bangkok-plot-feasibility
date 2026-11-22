import { useCallback, useMemo, useRef, useState } from 'react';
import type { DesignAssumptions, Ring, SiteInput } from '@bangkok/domain';
import { SAMPLE_PLOT } from '@bangkok/geometry';
import { sources } from '@bangkok/rules';
import { SiteMap, type MapControls } from './map/SiteMap';
import { useCalculation } from './useCalculation';

const STORAGE_KEY = 'bangkok-plot:scenario:v1';
const defaults: DesignAssumptions = { setbackM: 3, floors: 6, floorHeightM: 3.2 };
function savedScenario(): { plot: Ring; assumptions: DesignAssumptions } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    const a = saved?.assumptions;
    if (
      saved?.version === 1 &&
      Array.isArray(saved.plot) &&
      saved.plot.length <= 1000 &&
      saved.plot.every(
        (p: unknown) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite),
      ) &&
      a &&
      Number.isFinite(a.setbackM) &&
      a.setbackM >= 0 &&
      a.setbackM <= 100 &&
      Number.isInteger(a.floors) &&
      a.floors >= 1 &&
      a.floors <= 30 &&
      Number.isFinite(a.floorHeightM) &&
      a.floorHeightM >= 2 &&
      a.floorHeightM <= 6
    ) {
      return { plot: saved.plot, assumptions: a };
    }
  } catch {
    /* Storage can be disabled; exploration still works. */
  }
  return { plot: SAMPLE_PLOT, assumptions: defaults };
}
const number = (value: number | undefined, decimals = 0) =>
  value === undefined
    ? '—'
    : new Intl.NumberFormat('en', { maximumFractionDigits: decimals }).format(value);

export default function App() {
  const [initial] = useState(savedScenario);
  const [plot, setPlot] = useState<Ring>(initial.plot);
  const [assumptions, setAssumptions] = useState(initial.assumptions);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<'compact' | 'stepped'>('compact');
  const [mode, setMode] = useState<'existing' | 'envelope' | 'proposal'>('proposal');
  const [threeD, setThreeD] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [controls, setControls] = useState<MapControls | null>(null);
  const [storageMessage, setStorageMessage] = useState('');
  const history = useRef<Ring[]>([]);
  const plotRef = useRef(plot);
  plotRef.current = plot;
  const input = useMemo<SiteInput>(
    () => ({ revision, geographicPlot: plot, use: 'condominium', assumptions }),
    [revision, plot, assumptions],
  );
  const { result, pending, error } = useCalculation(input);
  const design = result?.designs.find((d) => d.id === selected) ?? result?.designs[0];
  const updatePlot = useCallback((next: Ring) => {
    if (JSON.stringify(next) === JSON.stringify(plotRef.current)) return;
    history.current = [...history.current.slice(-49), plotRef.current];
    plotRef.current = next;
    setPlot(next);
    setRevision((value) => value + 1);
  }, []);
  function updateAssumption(key: keyof DesignAssumptions, value: number) {
    setAssumptions((current) => ({ ...current, [key]: value }));
    setRevision((current) => current + 1);
  }
  function undo() {
    const previous = history.current.pop();
    if (previous) {
      plotRef.current = previous;
      setPlot(previous);
      setRevision((current) => current + 1);
    }
  }
  function reset() {
    updatePlot(SAMPLE_PLOT);
    setAssumptions(defaults);
    setRevision((value) => value + 1);
    setSelected('compact');
    setThreeD(false);
    controls?.view(false);
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, plot, assumptions }));
      setStorageMessage('Scenario saved in this browser.');
    } catch {
      setStorageMessage('Browser storage is unavailable. The scenario could not be saved.');
    }
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">▱</span>plot
          <span className="brand-divider" />{' '}
          <span className="brand-subtitle">Bangkok feasibility lab</span>
        </a>
        <div className="topbar-actions">
          <span className="preview-badge">Geometry preview</span>
          <button className="quiet-button" onClick={() => setDrawer(true)}>
            Research & sources
          </button>
          <button className="save-button" onClick={save}>
            Save scenario
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside className="site-panel">
          <div className="panel-eyebrow">SITE EXPLORER</div>
          <h1>
            From plot
            <br />
            to possibility.
          </h1>
          <p className="intro">
            Explore how a boundary shapes a building. Start with the example or draw your own.
          </p>
          <section className="panel-section">
            <div className="section-heading">
              <h2>Your plot</h2>
              <button className="text-button" onClick={reset}>
                Reset example
              </button>
            </div>
            <div className="plot-area">
              <strong data-testid="plot-area">{number(result?.plotAreaM2)}</strong>
              <span>m² plot area</span>
            </div>
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
            <label className="field-label" htmlFor="building-use">
              Building type
            </label>
            <select id="building-use" value="condominium" onChange={() => {}}>
              <option value="condominium">Condominium</option>
            </select>
            <p className="field-hint">
              Use permission is under research. A second use will follow verified rules.
            </p>
          </section>
          <section className="panel-section assumptions">
            <div className="section-heading">
              <h2>Explore assumptions</h2>
              <span className="tiny-tag">Not legal limits</span>
            </div>
            <label className="range-label" htmlFor="setback">
              <span>Boundary inset</span>
              <strong>{number(assumptions.setbackM, 1)} m</strong>
            </label>
            <input
              id="setback"
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={assumptions.setbackM}
              onChange={(event) => updateAssumption('setbackM', Number(event.target.value))}
            />
            <div className="range-extents">
              <span>0 m</span>
              <span>20 m</span>
            </div>
            <div className="input-pair">
              <label htmlFor="floors">
                Floors
                <input
                  id="floors"
                  type="number"
                  min="1"
                  max="30"
                  step="1"
                  value={assumptions.floors}
                  onChange={(event) => updateAssumption('floors', event.target.valueAsNumber)}
                />
              </label>
              <label htmlFor="floor-height">
                Floor height, m
                <input
                  id="floor-height"
                  type="number"
                  min="2"
                  max="6"
                  step="0.1"
                  value={assumptions.floorHeightM}
                  onChange={(event) => updateAssumption('floorHeightM', event.target.valueAsNumber)}
                />
              </label>
            </div>
            <p className="field-hint">
              Uniform inset and floor settings are design inputs. Road and height restrictions are
              not yet evaluated.
            </p>
          </section>
          <div className="scope-note">
            <span className="note-icon">i</span>
            <div>
              <strong>An honest starting point</strong>
              <p>
                The example is illustrative. Zone, parcel boundary and vacancy are unverified.
                Results show geometry, with legal feasibility unresolved.
              </p>
            </div>
          </div>
          <div className="panel-footer">
            PHRA KHANONG · BANGKOK <span>TH</span>
          </div>
        </aside>
        <main className="map-panel">
          <SiteMap
            plot={plot}
            result={result}
            design={design}
            mode={mode}
            heightM={assumptions.floors * assumptions.floorHeightM}
            onPlot={updatePlot}
            onReady={setControls}
          />
          <nav className="view-switch" aria-label="Map layers">
            {(
              [
                ['existing', 'Boundary'],
                ['envelope', 'Inset volume'],
                ['proposal', 'Massing'],
              ] as const
            ).map(([value, title]) => (
              <button
                key={value}
                aria-pressed={mode === value}
                className={mode === value ? 'active' : ''}
                onClick={() => setMode(value)}
              >
                {title}
              </button>
            ))}
          </nav>
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
          <div className="map-caption">
            <span>
              {pending
                ? 'Calculating this revision…'
                : error
                  ? 'Calculation unavailable'
                  : result?.status === 'partial'
                    ? 'Measured geometry · legal review pending'
                    : 'Edit the plot to explore'}
            </span>
            <span>{result ? `${number(result.durationMs, 1)} ms calculation` : ''}</span>
          </div>
        </main>
        <aside className="results-panel" aria-busy={pending}>
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
                  <strong>{id === 'compact' ? 'Compact' : 'Stepped'}</strong>
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
              <dd>{design?.floors.length ?? '—'}</dd>
            </div>
            <div>
              <dt>Modelled FAR</dt>
              <dd>
                {number(design?.modelledFar, 2)} <span>×</span>
              </dd>
            </div>
          </dl>
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
          <section className="checks-section">
            <div className="section-heading">
              <h2>Review status</h2>
              <span className="pending-tag">Incomplete</span>
            </div>
            <p className="checks-note">No overall compliance verdict</p>
            {result?.checks.map((check) => (
              <details className="check" key={check.id}>
                <summary>
                  <span className={check.status === 'pass' ? 'check-applied' : 'check-unknown'}>
                    {check.status === 'pass' ? '✓' : '?'}
                  </span>
                  <span>{check.title}</span>
                  <small>{check.status === 'pass' ? 'Applied' : 'Unknown'}</small>
                </summary>
                <p>{check.explanation}</p>
                {check.sourceIds.length > 0 && (
                  <button className="text-button source-link" onClick={() => setDrawer(true)}>
                    Read research sources
                  </button>
                )}
              </details>
            ))}
          </section>
          <button className="research-button" onClick={() => setDrawer(true)}>
            Open research & limitations
          </button>
        </aside>
      </div>
      {storageMessage && (
        <div className="toast" role="status">
          {storageMessage}
          <button onClick={() => setStorageMessage('')} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
      {drawer && (
        <dialog
          className="drawer-dialog"
          ref={(node) => {
            node?.showModal();
            node?.querySelector<HTMLButtonElement>('.close-button')?.focus();
          }}
          aria-labelledby="research-title"
          onCancel={() => setDrawer(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setDrawer(false);
          }}
        >
          <section
            className="research-drawer"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setDrawer(false);
            }}
          >
            <div className="section-heading">
              <span className="panel-eyebrow">EVIDENCE & SCOPE</span>
              <button
                autoFocus
                className="close-button"
                onClick={() => setDrawer(false)}
                aria-label="Close research"
              >
                ×
              </button>
            </div>
            <h2 id="research-title">
              Know what’s measured.
              <br />
              Know what’s missing.
            </h2>
            <p>
              This first implementation validates geometry and shared area accounting. It does not
              establish zoning or permit feasibility.
            </p>
            <h3>What works now</h3>
            <ul>
              <li>Concave plot drawing and boundary editing</li>
              <li>Millimetre-grid offsets that preserve holes and disconnected components</li>
              <li>UTM zone 47N measurements, georeferenced 3D floor geometry and area totals</li>
              <li>Compact and stepped concepts under explicit design assumptions</li>
            </ul>
            <h3>Evidence still needed</h3>
            <p>
              Current legal instruments; exact zone boundary; a verified vacant site; legal road
              widths; permitted use; applicable setbacks, height, FAR and open-space limits; access,
              parking, classification and review triggers.
            </p>
            <h3>Source register</h3>
            {sources.map((source) => (
              <article className="source-card" key={source.id}>
                <span>
                  {source.status === 'located' ? 'Historical source located' : 'Not verified'}
                </span>
                <h4>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </h4>
                <small>{source.locator}</small>
                <p>{source.note}</p>
              </article>
            ))}
            <h3>Context & measurement</h3>
            <p>
              The default view is a coordinate grid. No fictional neighbourhood buildings are
              displayed. A licensed MapLibre style can be configured; a bounded, attributable
              context extract is still needed.
            </p>
            <p>
              The example is a 2,500 m² illustrative L-shaped outline near the research area. It is
              not a verified parcel. The inset volume uses the chosen floor count and height; it is
              not the maximum legal envelope.
            </p>
            <p>
              Gross modelled area is not yet regulated FAR area. Uncovered ground is not a finding
              of open-space or permeability compliance. Concepts have no verified core, access or
              parking allocation.
            </p>
            <p className="drawer-version">Ruleset: research-preview.1 · Scenario format: v1</p>
          </section>
        </dialog>
      )}
    </div>
  );
}
