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
import type { MapControls } from './map/SiteMap';
import { useCalculation } from './useCalculation';
import { useSiteData } from './useSiteData';
import { nearbyRoads } from './roads';
import { roadModels } from './roadModels';
import { imageryStudy } from './imageryStudy';
import {
  defaultScenario,
  initialScenario,
  loadScenario,
  parseScenario,
  scenarioUrl,
  STORAGE_KEY,
} from './scenario';
const defaults: DesignAssumptions = defaultScenario().assumptions;
function markEdit() {
  if (new URLSearchParams(window.location.search).has('measure'))
    performance.mark('plot-edit-start');
}

/** Owns scenario edits, persistence, calculation revisions and coordinated map state. */
export function useStudyController() {
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
  const modelRoads = useMemo(
    () => roadModels(plot, roads, frontage, design, siteData.context),
    [plot, roads, frontage, design, siteData.context],
  );
  const updatePlot = useCallback((next: Ring) => {
    if (JSON.stringify(next) === JSON.stringify(plotRef.current)) return;
    markEdit();
    history.current = [...history.current.slice(-49), plotRef.current];
    setProject((current) => ({ ...current, coreBasis: undefined }));
    if (next.length !== plotRef.current.length) {
      setFrontage([]);
      setRoads([]);
    } else setRoads((current) => current.map((road) => ({ ...road, confirmed: false })));
    plotRef.current = next;
    setPlot(next);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    function openSharedScenario() {
      if (!new URLSearchParams(window.location.hash.slice(1)).has('scenario')) return;
      const loaded = loadScenario(window.location.hash);
      const scenario = loaded.scenario;
      updatePlot(scenario.plot);
      setAssumptions(scenario.assumptions);
      setUse(scenario.use);
      setRoads(scenario.roads);
      setFrontage(scenario.frontage);
      setTransitDistanceM(scenario.transitDistanceM);
      setResearchConstraints(scenario.researchConstraints);
      setProject(scenario.project ?? {});
      setSelected('compact');
      setParkingPlanLevel(null);
      setMode('proposal');
      setThreeD(false);
      setShareUrl('');
      setStorageMessage(loaded.message);
      setRevision((value) => value + 1);
      controls?.view(false);
      requestAnimationFrame(() => controls?.fit());
    }
    window.addEventListener('hashchange', openSharedScenario);
    return () => window.removeEventListener('hashchange', openSharedScenario);
  }, [controls, updatePlot]);
  function changed() {
    markEdit();
    setRevision((n) => n + 1);
  }
  function updateProject(patch: Partial<ProjectInputs>) {
    setProject((current) => ({ ...current, ...patch }));
    changed();
  }
  function toggleFrontage(edgeIndex: number) {
    setProject((current) => ({
      ...current,
      coreBasis: current.coreBasis
        ? { ...current.coreBasis, publicRoadReferences: false }
        : undefined,
    }));
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
      setProject((current) => ({ ...current, coreBasis: undefined }));
      setRevision((current) => current + 1);
    }
  }
  function reset() {
    const sample = defaultScenario();
    updatePlot(sample.plot);
    setAssumptions(defaults);
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
    requestAnimationFrame(() => controls?.fit());
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
  function loadCoreExample() {
    reset();
    setRoads(defaultScenario().roads.map((road) => ({ ...road, confirmed: true })));
    setProject({
      coreBasis: {
        wholeSiteAndBuildings: true,
        aggregationAccountedFor: true,
        allFloorsAndCoverCounted: true,
        publicRoadReferences: true,
        matchingHeightDatum: true,
      },
    });
    setStorageMessage(
      'Declared core-rule example loaded: 8 m straight public ROW at the plot edge, level datum and one fully counted new building. These are model inputs, not verified site facts.',
    );
    setRevision((value) => value + 1);
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
  function loadImageryStudy() {
    updatePlot(imageryStudy.plot);
    setAssumptions(defaults);
    setUse('condominium');
    setRoads([]);
    setFrontage([]);
    setTransitDistanceM(undefined);
    setResearchConstraints(true);
    setProject({});
    setSelected('compact');
    setParkingPlanLevel(null);
    setMode('proposal');
    setThreeD(false);
    controls?.view(false);
    controls?.locate(imageryStudy.centre);
    setStorageMessage(
      `Dated imagery study loaded: unbuilt ground observed ${imageryStudy.label}. Road access, canal restrictions, property boundary and current condition remain unverified.`,
    );
  }

  return {
    plot,
    assumptions,
    use,
    setUse,
    roads,
    frontage,
    transitDistanceM,
    setTransitDistanceM,
    researchConstraints,
    setResearchConstraints,
    overlay,
    setOverlay,
    parkingPlanLevel,
    setParkingPlanLevel,
    project,
    activeRule,
    setActiveRule,
    inputsCollapsed,
    setInputsCollapsed,
    resultsCollapsed,
    setResultsCollapsed,
    siteData,
    mappedRoads,
    modelRoads,
    setSelected,
    mode,
    setMode,
    threeD,
    setThreeD,
    drawer,
    setDrawer,
    controls,
    setControls,
    storageMessage,
    setStorageMessage,
    shareUrl,
    setShareUrl,
    history,
    toolbarRef,
    result,
    preview,
    pending,
    error,
    design,
    updatePlot,
    changed,
    updateProject,
    toggleFrontage,
    updateRoad,
    updateAssumption,
    undo,
    reset,
    save,
    loadCoreExample,
    share,
    loadImageryStudy,
  };
}
export type StudyController = ReturnType<typeof useStudyController>;
