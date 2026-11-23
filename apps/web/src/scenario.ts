import {
  legacyScenarioSchema,
  previousScenarioSchema,
  scenarioSchema,
  type Scenario,
} from '@bangkok/domain';
import { toMetric, validateRing } from '@bangkok/geometry';
import { DEMO_PLOT, demoRoad } from './demoSite';
import { RULESET_VERSION } from '@bangkok/rules';

export const STORAGE_KEY = 'bangkok-plot:scenario:v3';
const LEGACY_STORAGE_KEY = 'bangkok-plot:scenario:v1';
export const MAX_SCENARIO_LENGTH = 100_000;
export const defaultScenario = (): Scenario => ({
  version: 3,
  rulesetId: 'y7-reference',
  rulesetVersion: RULESET_VERSION as Scenario['rulesetVersion'],
  use: 'condominium',
  plot: DEMO_PLOT,
  assumptions: { setbackM: 5, floors: 4, floorHeightM: 3.2 },
  roads: [
    {
      id: 'frontage-0',
      name: 'Simple example · assumed 8 m road corridor',
      geometry: [DEMO_PLOT[0], DEMO_PLOT[1]],
      widthM: demoRoad.assumedWidthM,
      widthProvenance: 'user',
      confirmed: false,
      sourceUrl: demoRoad.sourceUrl,
    },
  ],
  frontage: [{ edgeIndex: 0, roadId: 'frontage-0' }],
  researchConstraints: true,
});

export function parseScenario(raw: unknown): Scenario {
  const legacy = legacyScenarioSchema.safeParse(raw);
  const previous = previousScenarioSchema.safeParse(raw);
  const scenario = scenarioSchema.parse(
    legacy.success || previous.success
      ? {
          ...defaultScenario(),
          ...(legacy.success ? legacy.data : previous.data),
          version: 3,
          rulesetId: 'y7-reference',
          rulesetVersion: RULESET_VERSION,
        }
      : raw,
  );
  const geometry = validateRing(scenario.plot.map(toMetric));
  if (geometry.errors.length) throw new Error(geometry.errors.join(' '));
  scenario.rulesetVersion = RULESET_VERSION as Scenario['rulesetVersion'];
  const distinctCount =
    scenario.plot.length -
    (scenario.plot[0][0] === scenario.plot.at(-1)![0] &&
    scenario.plot[0][1] === scenario.plot.at(-1)![1]
      ? 1
      : 0);
  if (
    new Set(scenario.roads.map((r) => r.id)).size !== scenario.roads.length ||
    new Set(scenario.frontage.map((f) => f.edgeIndex)).size !== scenario.frontage.length ||
    scenario.frontage.some(
      (f) => f.edgeIndex >= distinctCount || !scenario.roads.some((r) => r.id === f.roadId),
    )
  )
    throw new Error('Invalid road or frontage references.');
  if (distinctCount < scenario.plot.length) scenario.plot = scenario.plot.slice(0, -1);
  return scenario;
}

export function decodeScenario(payload: string): Scenario {
  if (!payload || payload.length > MAX_SCENARIO_LENGTH)
    throw new Error('The scenario is empty or too large.');
  return parseScenario(JSON.parse(payload));
}

export function scenarioUrl(scenario: Scenario, currentUrl: string): string {
  const payload = JSON.stringify(parseScenario(scenario));
  const fragment = new URLSearchParams({ scenario: payload }).toString();
  if (fragment.length > MAX_SCENARIO_LENGTH)
    throw new Error('This scenario is too large to share in a link.');
  const url = new URL(currentUrl);
  url.hash = fragment;
  return url.toString();
}

export function loadScenario(
  hash: string,
  storage?: Pick<Storage, 'getItem'>,
): { scenario: Scenario; message: string } {
  if (hash.length > MAX_SCENARIO_LENGTH + 1)
    return {
      scenario: defaultScenario(),
      message: 'This shared scenario is invalid or too large. The example was loaded.',
    };
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (params.has('scenario')) {
    try {
      if (hash.length > MAX_SCENARIO_LENGTH + 1 || params.getAll('scenario').length !== 1)
        throw new Error('Invalid scenario payload.');
      return {
        scenario: decodeScenario(params.get('scenario')!),
        message: 'Shared scenario loaded.',
      };
    } catch {
      // Invalid shared state never falls through to an unrelated locally saved scenario.
      return {
        scenario: defaultScenario(),
        message:
          'This shared scenario is invalid, unsupported or too large. The example was loaded; reset or draw a valid plot.',
      };
    }
  }
  try {
    const stored =
      storage?.getItem(STORAGE_KEY) ??
      storage?.getItem('bangkok-plot:scenario:v2') ??
      storage?.getItem(LEGACY_STORAGE_KEY);
    if (stored)
      return {
        scenario: decodeScenario(stored),
        message:
          'Saved scenario restored. Select Reset example to load the current simple example.',
      };
  } catch {
    return {
      scenario: defaultScenario(),
      message: 'The saved scenario could not be loaded. The example was restored.',
    };
  }
  return { scenario: defaultScenario(), message: '' };
}

export function initialScenario() {
  try {
    return loadScenario(window.location.hash, window.localStorage);
  } catch {
    return loadScenario(window.location.hash);
  }
}
