import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  BuildingUse,
  DesignAssumptions,
  FrontageInput,
  ProjectInputs,
  Ring,
  RoadInput,
  SiteInput,
} from '@bangkok/domain';
import { SAMPLE_PLOT } from '@bangkok/geometry';
import { RULESET_VERSION, rules, sources } from '@bangkok/rules';
import { SiteMap, type MapControls } from './map/SiteMap';
import { useCalculation } from './useCalculation';
import { useSiteData } from './useSiteData';
import { LocationSearch } from './ui/LocationSearch';
import { ProjectControls } from './ui/ProjectControls';
import { nearbyRoads } from './roads';
import {
  defaultScenario,
  initialScenario,
  parseScenario,
  scenarioUrl,
  STORAGE_KEY,
} from './scenario';

const defaults: DesignAssumptions = defaultScenario().assumptions;
function markEdit() {
  if (new URLSearchParams(window.location.search).has('measure'))
    performance.mark('plot-edit-start');
}
const number = (value: number | undefined, decimals = 0) =>
  value === undefined
    ? '—'
    : new Intl.NumberFormat('en', { maximumFractionDigits: decimals }).format(value);

export default function App() {
  const [initial] = useState(initialScenario);
  const [plot, setPlot] = useState<Ring>(initial.scenario.plot);
  const [assumptions, setAssumptions] = useState(initial.scenario.assumptions);
  const [use, setUse] = useState<BuildingUse>(initial.scenario.use);
  const [roads, setRoads] = useState<RoadInput[]>(initial.scenario.roads);
  const [frontage, setFrontage] = useState<FrontageInput[]>(initial.scenario.frontage);
  const [transitDistanceM, setTransitDistanceM] = useState(initial.scenario.transitDistanceM);
  const [researchConstraints, setResearchConstraints] = useState(
    initial.scenario.researchConstraints,
  );
  const [overlay, setOverlay] = useState(false);
  const [parkingPlanLevel, setParkingPlanLevel] = useState<number | null>(null);
  const [project, setProject] = useState<ProjectInputs>(initial.scenario.project ?? {});
  const [activeRule, setActiveRule] = useState<string | null>(null);
  const [inputsCollapsed, setInputsCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const siteData = useSiteData();
  const mappedRoads = useMemo(() => nearbyRoads(siteData.context, plot), [siteData.context, plot]);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<'compact' | 'stepped'>('compact');
  const [mode, setMode] = useState<'existing' | 'envelope' | 'proposal'>('proposal');
  const [threeD, setThreeD] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [controls, setControls] = useState<MapControls | null>(null);
  const [storageMessage, setStorageMessage] = useState(initial.message);
  const [shareUrl, setShareUrl] = useState('');
  const history = useRef<Ring[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const observer = new ResizeObserver(() => {
      toolbar.parentElement?.style.setProperty(
        '--map-toolbar-height',
        `${toolbar.getBoundingClientRect().height}px`,
      );
    });
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, []);
  const plotRef = useRef(plot);
  plotRef.current = plot;
  const input = useMemo<SiteInput>(
    () => ({
      revision,
      geographicPlot: plot,
      use,
      assumptions,
      roads,
      frontage,
      zone: siteData.zone,
      project,
      transitDistanceM,
      researchConstraints,
    }),
    [
      revision,
      plot,
      use,
      assumptions,
      roads,
      frontage,
      siteData.zone,
      project,
      transitDistanceM,
      researchConstraints,
    ],
  );
  useEffect(() => setRevision((n) => n + 1), [siteData.zone]);
  const { result, preview, pending, error } = useCalculation(input);
  const design = result?.designs.find((d) => d.id === selected) ?? result?.designs[0];
  const updatePlot = useCallback((next: Ring) => {
    if (JSON.stringify(next) === JSON.stringify(plotRef.current)) return;
    markEdit();
    history.current = [...history.current.slice(-49), plotRef.current];
    if (next.length !== plotRef.current.length) {
      setFrontage([]);
      setRoads([]);
    } else setRoads((current) => current.map((road) => ({ ...road, confirmed: false })));
    plotRef.current = next;
    setPlot(next);
    setRevision((value) => value + 1);
  }, []);
  function changed() {
    markEdit();
    setRevision((n) => n + 1);
  }
  function updateProject(patch: Partial<ProjectInputs>) {
    setProject((current) => ({ ...current, ...patch }));
    changed();
  }
  function toggleFrontage(edgeIndex: number) {
    if (frontage.some((f) => f.edgeIndex === edgeIndex)) {
      setFrontage(frontage.filter((f) => f.edgeIndex !== edgeIndex));
      setRoads(
        roads.filter((r) => r.id !== frontage.find((f) => f.edgeIndex === edgeIndex)!.roadId),
      );
    } else {
      const id = `frontage-${edgeIndex}`;
      setFrontage([...frontage, { edgeIndex, roadId: id }]);
      setRoads([
        ...roads,
        {
          id,
          name: `Road at edge ${edgeIndex + 1}`,
          geometry: [plot[edgeIndex], plot[(edgeIndex + 1) % plot.length]],
          widthProvenance: 'unknown',
          confirmed: false,
        },
      ]);
    }
    changed();
  }
  function updateRoad(id: string, patch: Partial<RoadInput>) {
    setRoads((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    changed();
  }
  function scenario() {
    return {
      ...defaultScenario(),
      project,
      plot,
      assumptions,
      use,
      roads,
      frontage,
      transitDistanceM,
      researchConstraints,
    };
  }
  function updateAssumption(key: keyof DesignAssumptions, value: number) {
    markEdit();
    setAssumptions((current) => ({ ...current, [key]: value }));
    setRevision((current) => current + 1);
  }
  function undo() {
    const previous = history.current.pop();
    if (previous) {
      plotRef.current = previous;
      setPlot(previous);
      setFrontage([]);
      setRoads([]);
      setRevision((current) => current + 1);
    }
  }
  function reset() {
    updatePlot(SAMPLE_PLOT);
    setAssumptions(defaults);
    const sample = defaultScenario();
    setUse(sample.use);
    setRoads(sample.roads);
    setFrontage(sample.frontage);
    setTransitDistanceM(undefined);
    setResearchConstraints(true);
    setProject({});
    setRevision((value) => value + 1);
    setSelected('compact');
    setParkingPlanLevel(null);
    setMode('proposal');
    setThreeD(false);
    controls?.view(false);
  }
  function save() {
    let scenario;
    try {
      scenario = parseScenario({
        ...defaultScenario(),
        project,
        plot,
        assumptions,
        use,
        roads,
        frontage,
        transitDistanceM,
        researchConstraints,
      });
    } catch {
      setStorageMessage('This scenario is invalid. Fix the plot and assumptions before saving.');
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
      setStorageMessage('Scenario saved in this browser.');
    } catch {
      setStorageMessage('Browser storage is unavailable. The scenario could not be saved.');
    }
  }
  async function share() {
    let url: string;
    try {
      url = scenarioUrl(scenario(), window.location.href);
    } catch {
      setStorageMessage(
        'This scenario cannot be shared. Fix invalid inputs or reduce the plot size.',
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setStorageMessage(
        'Scenario link copied. The recipient can open the same plot and assumptions.',
      );
    } catch {
      setShareUrl(url);
      setStorageMessage('Automatic copying is unavailable. Select and copy the link below.');
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
          <span className="preview-badge">Reference study · legal checks incomplete</span>
          <button className="quiet-button" onClick={() => setDrawer(true)}>
            Research & sources
          </button>
          <button className="save-button" onClick={save}>
            Save scenario
          </button>
          <button className="save-button" onClick={share}>
            Copy link
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside className={`site-panel ${inputsCollapsed ? 'panel-collapsed' : ''}`}>
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
            <details className="getting-started">
              <summary>First time? Start here</summary>
              <ol>
                <li>
                  Locate the land, then draw its boundary. Search moves the map; it does not
                  establish a parcel.
                </li>
                <li>
                  Mark every road-facing edge and enter known road widths. White roads, purple
                  dashed zone lines and orange selected frontage have different meanings.
                </li>
                <li>
                  Choose a building use, compare Compact and Courtyard/Stepped, and inspect the
                  floor table. Blue parking levels reduce usable capacity.
                </li>
                <li>
                  Open review checks and sources. Assumptions are study settings; unknown evidence
                  cannot establish legal feasibility. Save locally or copy the scenario link.
                </li>
              </ol>
              <p>
                You do not need to own land to explore the example. Calculations use researched,
                versioned rules and geometry. No AI call or new legal research runs when you edit.
                The example is illustrative; vacancy and title are unverified.
              </p>
              <button onClick={() => setDrawer(true)}>Read research and limitations</button>
            </details>
            <LocationSearch
              context={siteData.context}
              onLocate={(point) => controls?.locate(point)}
            />
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
                  {number(result.plotAreaM2 / 1600, 3)} rai · {number(result.plotAreaM2 / 400, 3)}{' '}
                  ngan · {number(result.plotAreaM2 / 4, 2)} square wah (equivalent units)
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
                {siteData.loading ? 'loading boundary' : (result?.zoneMembership ?? 'unknown')}.
                Current legal applicability is reviewed separately.
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
                Historical Y.7 use and size conditions differ. Their current applicability remains
                under review.
              </p>
            </section>
            <section className="panel-section frontage-panel">
              <div className="section-heading">
                <h2>Road frontages</h2>
                <button onClick={() => controls?.frontage()} disabled={!controls}>
                  Select on map
                </button>
              </div>
              <p className="field-hint">
                Mark every road-facing edge. Width is the legal right-of-way, not lane count. The
                research model assumes the plot edge meets that right-of-way.
              </p>
              <details className="nearby-roads">
                <summary>Nearby mapped roads · {mappedRoads.length}</summary>
                <p className="field-hint">
                  Distances are from the drawn outline to OSM centrelines, not legal road edges.
                  Proximity does not establish frontage or access rights.
                </p>
                {mappedRoads.length ? (
                  <ul>
                    {mappedRoads.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => controls?.locate(r.point)}
                          aria-label={`Show mapped road ${r.id}`}
                        >
                          {r.name}
                        </button>
                        <span>
                          About {number(r.distanceM)} m · {r.id}
                        </span>
                        <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                          Mapped road source
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="field-hint">
                    No mapped roads are available for this outline. Road access remains unknown.
                  </p>
                )}
              </details>
              <div className="edge-buttons">
                {plot.map((_, i) => (
                  <button
                    key={i}
                    aria-pressed={frontage.some((f) => f.edgeIndex === i)}
                    aria-label={`Frontage edge ${i + 1}`}
                    onClick={() => toggleFrontage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              {frontage.map((f) => {
                const road = roads.find((r) => r.id === f.roadId);
                return road ? (
                  <fieldset key={road.id}>
                    <legend>Edge {f.edgeIndex + 1}</legend>
                    <label>
                      Road name
                      <input
                        value={road.name}
                        onChange={(e) => updateRoad(road.id, { name: e.target.value })}
                      />
                    </label>
                    <div className="input-pair">
                      <label>
                        Road width, m
                        <input
                          aria-label={`Road width edge ${f.edgeIndex + 1}`}
                          type="number"
                          min="0.1"
                          max="200"
                          step="0.5"
                          value={road.widthM ?? ''}
                          onChange={(e) =>
                            updateRoad(road.id, {
                              widthM: e.target.value === '' ? undefined : Number(e.target.value),
                              confirmed: false,
                            })
                          }
                        />
                      </label>
                      <label>
                        Provenance
                        <select
                          value={road.widthProvenance}
                          onChange={(e) =>
                            updateRoad(road.id, {
                              widthProvenance: e.target.value as RoadInput['widthProvenance'],
                              confirmed: false,
                            })
                          }
                        >
                          <option value="unknown">Unknown</option>
                          <option value="tag">Map tag</option>
                          <option value="measured">Measured</option>
                          <option value="user">User supplied</option>
                        </select>
                      </label>
                    </div>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={road.confirmed}
                        onChange={(e) => updateRoad(road.id, { confirmed: e.target.checked })}
                      />
                      Confirm width for this study
                    </label>
                    <small>Confirmation is a user assertion, not legal verification.</small>
                  </fieldset>
                ) : null;
              })}
              <label>
                Distance to transit station, m (optional)
                <input
                  aria-label="Transit station distance"
                  type="number"
                  min="0"
                  value={transitDistanceM ?? ''}
                  placeholder="Unknown"
                  onChange={(e) => {
                    setTransitDistanceM(e.target.value === '' ? undefined : Number(e.target.value));
                    changed();
                  }}
                />
              </label>
            </section>
            <ProjectControls value={project} onChange={updateProject} />
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
                    onChange={(event) =>
                      updateAssumption('floorHeightM', event.target.valueAsNumber)
                    }
                  />
                </label>
              </div>
              <p className="field-hint">
                The inset is an additional design buffer. Reference setbacks and road-height planes
                also constrain the study when enabled.
              </p>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={researchConstraints}
                  onChange={(e) => {
                    setResearchConstraints(e.target.checked);
                    changed();
                  }}
                />
                Apply historical reference constraints
              </label>
              <details>
                <summary>Usability and landscape assumptions</summary>
                <div className="input-pair">
                  {(
                    [
                      ['minWidthM', 'Minimum width, m', 6],
                      ['minDepthM', 'Minimum depth, m', 6],
                      ['courtyardM', 'Courtyard width, m', 8],
                      ['coreFraction', 'Core / circulation fraction', 0.12],
                      ['permeableFraction', 'Permeable share of uncovered ground', 0.5],
                      ['parkingSpaceAreaM2', 'Parking area allowance, m²/space', 25],
                      ['fireAccessRingM', 'Additional access reserve, m', 0],
                    ] as const
                  ).map(([key, label, fallback]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        step={key.includes('Fraction') ? '0.01' : '1'}
                        min={
                          key.includes('Fraction') || key === 'fireAccessRingM'
                            ? 0
                            : key === 'parkingSpaceAreaM2'
                              ? 10
                              : 3
                        }
                        max={
                          key === 'coreFraction'
                            ? 0.5
                            : key === 'permeableFraction'
                              ? 1
                              : key === 'parkingSpaceAreaM2'
                                ? 100
                                : key === 'fireAccessRingM'
                                  ? 15
                                  : 50
                        }
                        value={assumptions[key] ?? fallback}
                        onChange={(e) => updateAssumption(key, Number(e.target.value))}
                      />
                    </label>
                  ))}
                </div>
              </details>
            </section>
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
        <main className="map-panel">
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
            mappedRoads={mappedRoads}
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
                core/circulation. Allocated permeable ground: {number(design.modelledPermeableM2)}{' '}
                m².
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
            <dl className="metrics-grid legal-metrics">
              <div>
                <dt>Regulated floor area</dt>
                <dd>
                  {design?.regulatedAreaM2 == null
                    ? 'Unknown'
                    : `${number(design.regulatedAreaM2)} m²`}
                </dd>
              </div>
              <div>
                <dt>Permeable allocation</dt>
                <dd>
                  {design?.permeableAreaM2 == null
                    ? 'Unknown'
                    : `${number(design.permeableAreaM2)} m²`}
                </dd>
              </div>
            </dl>
            {design?.parking && (
              <div className="parking-summary">
                <strong>Parking reference study</strong>
                <p>
                  Count target:{' '}
                  {design.parking.requiredSpaces === null
                    ? 'Unknown'
                    : design.parking.requiredSpaces}{' '}
                  · provided:{' '}
                  {design.parking.providedSpaces === null
                    ? 'Unknown'
                    : design.parking.providedSpaces}
                  .
                </p>
                <p>
                  Reserved parking floor polygons: {number(design.parking.reservedFloorAreaM2)} m².
                  Area-based capacity estimate: {design.parking.estimatedCapacity ?? 'Unknown'}{' '}
                  spaces.
                </p>
                {design.parking.groundAllowanceM2 > 0 && (
                  <p>Ground area allowance: {number(design.parking.groundAllowanceM2)} m².</p>
                )}
                {design.parking.ramp && (
                  <p data-testid="ramp-summary">
                    Parking-level rise: {number(design.parking.ramp.riseM, 2)} m. Ramp gradient:{' '}
                    {design.parking.ramp.gradientPercent === null
                      ? 'Unknown'
                      : `${number(design.parking.ramp.gradientPercent, 2)}%`}
                    . Minimum inclined run:{' '}
                    {design.parking.ramp.minimumRunM === null
                      ? 'Unknown'
                      : `${number(design.parking.ramp.minimumRunM, 2)} m`}
                    . Intermediate landings: {design.parking.ramp.intermediateLandings}. Red ramp
                    reservation is schematic; vertical openings and turning remain unverified.
                  </p>
                )}
                {!!design.parking.plans?.length && (
                  <>
                    <p>
                      Schematic stalls placed: {design.parking.schematicSpaces}. Dimensions and
                      aisle geometry use the reference profile.
                    </p>
                    <button
                      onClick={() => {
                        setParkingPlanLevel(design.parking!.plans![0].level);
                        setMode('existing');
                        setThreeD(false);
                        controls?.view(false);
                      }}
                    >
                      Inspect parking plan
                    </button>
                    {parkingPlanLevel !== null && (
                      <label>
                        Parking level
                        <select
                          aria-label="Parking plan level"
                          value={parkingPlanLevel}
                          onChange={(e) => setParkingPlanLevel(Number(e.target.value))}
                        >
                          {design.parking.plans.map((p) => (
                            <option key={p.level} value={p.level}>
                              Level {p.level} · {p.stalls.length} stalls
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </>
                )}
                <small>
                  Schematic layout only; ramps, turning and fire access are not verified. Parking
                  levels are blue in 3D.
                </small>
              </div>
            )}
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
                Uncovered plot area; permeability and statutory open-space accounting are
                unresolved.
              </p>
            </div>
            <section className="checks-section">
              <div className="section-heading">
                <h2>Review status</h2>
                <span className="pending-tag">Incomplete</span>
              </div>
              <p className="checks-note">No overall compliance verdict</p>
              {(design?.checks ?? result?.checks)?.map((check) => (
                <details
                  data-scope={check.scope}
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
                      {check.measurementBasis === 'modelled-proxy'
                        ? 'historical candidate'
                        : 'required'}
                      : {number(check.required, 4)} {check.unit}
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
                          <p>
                            Historical candidate only; these values are not applied as legal limits.
                          </p>
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
            <button className="research-button" onClick={() => setDrawer(true)}>
              Open research & limitations
            </button>
          </div>
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
      {shareUrl && (
        <dialog
          className="share-dialog"
          aria-labelledby="share-title"
          ref={(node) => node?.showModal()}
          onCancel={() => setShareUrl('')}
        >
          <h2 id="share-title">Copy scenario link</h2>
          <p>This link contains the plot and assumptions. Legal feasibility remains unresolved.</p>
          <label htmlFor="scenario-link">Scenario URL</label>
          <textarea
            id="scenario-link"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            autoFocus
          />
          <button onClick={() => setShareUrl('')}>Close link</button>
        </dialog>
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
              This implementation combines real context, sourced historical reference constraints
              and shared area accounting. It does not establish zoning or permit feasibility.
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
              Current amendments and overlays; a verified vacant site; legal road widths; permitted
              use; applicable setbacks, height, FAR and open-space limits; access, parking,
              classification and review triggers.
            </p>
            <h3>Source register</h3>
            {sources.map((source) => (
              <article className="source-card" key={source.id}>
                <span>
                  {source.status === 'verified'
                    ? 'Verified source — read its scope'
                    : source.status === 'located'
                      ? 'Source located — applicability varies'
                      : 'Not verified'}
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
              The neighbourhood is a bundled OpenStreetMap extract under ODbL, with original source
              IDs and tags. All context heights are labelled estimates. The zone comes from BMA's
              2013 GIS; its publisher does not specify a redistribution licence. Current legal
              status is a separate check.
            </p>
            <p>
              The example is a 2,500 m² illustrative L-shaped outline near the research area. It is
              not a verified parcel or vacant-site finding. The reference envelope uses historical
              candidates and the chosen study assumptions; it is not a verified maximum legal
              envelope.
            </p>
            <p>
              Gross modelled area is not yet regulated FAR area. Uncovered ground is not a finding
              of open-space or permeability compliance. Concepts have no verified core, access or
              parking allocation.
            </p>
            <p className="drawer-version">
              Ruleset: {RULESET_VERSION} · Scenario format: v3 (v1/v2 saved scenarios are migrated)
            </p>
          </section>
        </dialog>
      )}
    </div>
  );
}
