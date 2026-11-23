import { describe, expect, it } from 'vitest';
import { toGeographic } from '@bangkok/geometry';
import {
  decodeScenario,
  defaultScenario,
  loadScenario,
  MAX_SCENARIO_LENGTH,
  parseScenario,
  scenarioUrl,
} from './scenario';

describe('versioned, validated scenarios', () => {
  it('preserves the core basis and migrates older links without inventing declarations', () => {
    const scenario = defaultScenario();
    scenario.project = {
      coreBasis: {
        wholeSiteAndBuildings: true,
        aggregationAccountedFor: true,
        allFloorsAndCoverCounted: true,
        publicRoadReferences: true,
        matchingHeightDatum: false,
        officeOperationAreaM2: 1500,
      },
    };
    expect(
      loadScenario(new URL(scenarioUrl(scenario, 'https://example.test')).hash).scenario.project,
    ).toEqual(scenario.project);
    const old = { ...defaultScenario(), rulesetVersion: 'research-preview.5' };
    expect(parseScenario(old).rulesetVersion).toBe('research-preview.6');
    expect(parseScenario(old).project?.coreBasis).toBeUndefined();
    expect(() =>
      parseScenario({ ...scenario, project: { coreBasis: { legalApproval: true } } }),
    ).toThrow();
    expect(() =>
      parseScenario({ ...scenario, project: { coreBasis: { officeOperationAreaM2: 0 } } }),
    ).toThrow();
  });
  it('round trips optional project assertions without promoting them to legal evidence', () => {
    const scenario = defaultScenario();
    scenario.project = {
      residentialUnits: 50,
      residentialUnitsOver60M2: 20,
      parkingSpaces: 50,
      parkingLocation: 'within-building',
      accessRoadWidthM: 6,
      routeConnectedToPublicRoad: true,
    };
    expect(
      loadScenario(new URL(scenarioUrl(scenario, 'https://example.test')).hash).scenario.project,
    ).toEqual(scenario.project);
  });
  it('rejects inconsistent unit counts and forged legal-approval fields', () => {
    const scenario = defaultScenario();
    scenario.project = { residentialUnits: 10, residentialUnitsOver60M2: 11 };
    expect(() => parseScenario(scenario)).toThrow();
    expect(() =>
      parseScenario({ ...defaultScenario(), project: { legalApproval: true } }),
    ).toThrow();
  });
  it('round trips a shared scenario without browser storage', () => {
    const scenario = defaultScenario();
    scenario.assumptions.floors = 4;
    const url = scenarioUrl(scenario, 'https://example.test/tool?view=1#old');
    expect(loadScenario(new URL(url).hash).scenario).toEqual(scenario);
    expect(new URL(url).pathname).toBe('/tool');
  });
  it('loads a shared scenario ahead of an unrelated local save', () => {
    const shared = defaultScenario();
    shared.assumptions.floors = 4;
    const local = defaultScenario();
    local.assumptions.floors = 8;
    const result = loadScenario(new URL(scenarioUrl(shared, 'https://example.test')).hash, {
      getItem: () => JSON.stringify(local),
    });
    expect(result.scenario.assumptions.floors).toBe(4);
  });
  it('rejects an invalid shared payload without exposing unrelated local state', () => {
    const result = loadScenario('#scenario=broken', {
      getItem: () => {
        throw new Error('must not read local state');
      },
    });
    expect(result.scenario).toEqual(defaultScenario());
    expect(result.message).toContain('invalid');
  });
  it('migrates the original browser-local format', () => {
    const { plot, assumptions } = defaultScenario();
    assumptions.floors = 4;
    const migrated = decodeScenario(JSON.stringify({ version: 1, plot, assumptions }));
    expect(migrated).toMatchObject({ version: 3, use: 'condominium', assumptions: { floors: 4 } });
  });
  it('preserves nested ramp inputs through the versioned share format', () => {
    const s = defaultScenario();
    s.project = {
      parkingSpaces: 50,
      parkingLocation: 'within-building',
      ramp: {
        kind: 'straight',
        horizontalRunM: 21.4,
        clearWidthM: 6,
        clearHeightM: 2.4,
        entranceOffsetM: 6,
      },
    };
    const result = parseScenario(JSON.parse(JSON.stringify(s)));
    expect(result.project).toEqual(s.project);
    expect(result.rulesetVersion).toBe('research-preview.6');
  });
  it('rejects invalid runs and injected ramp approval flags', () => {
    const s = defaultScenario();
    s.project = { ramp: { horizontalRunM: 0 } };
    expect(() => parseScenario(s)).toThrow();
    s.project = { ramp: { horizontalRunM: 22, ...{ legalApproval: true } } };
    expect(() => parseScenario(s)).toThrow();
  });
  it.each([
    'version',
    'unknown-field',
    'coordinates',
    'nan',
    'floors',
    'self-crossing',
    'too-few',
    'too-many',
  ])('rejects %s', (caseName) => {
    const scenario = structuredClone(defaultScenario());
    const raw: Record<string, unknown> = scenario;
    if (caseName === 'version') raw.version = 99;
    if (caseName === 'unknown-field') raw.secret = 'unsupported';
    if (caseName === 'coordinates') scenario.plot[0] = [0, 0];
    if (caseName === 'nan') scenario.plot[0][0] = NaN;
    if (caseName === 'floors') scenario.assumptions.floors = 1.5;
    if (caseName === 'self-crossing')
      scenario.plot = [
        [0, 0],
        [30, 30],
        [0, 30],
        [30, 0],
      ].map((p) => toGeographic(p as [number, number]));
    if (caseName === 'too-few') scenario.plot = scenario.plot.slice(0, 2);
    if (caseName === 'too-many')
      scenario.plot = Array.from({ length: 1001 }, () => scenario.plot[0]);
    expect(() => parseScenario(raw)).toThrow();
  });
  it('bounds payload size and rejects duplicate scenario parameters', () => {
    expect(() => decodeScenario(' '.repeat(MAX_SCENARIO_LENGTH + 1))).toThrow();
    expect(loadScenario('#scenario={}&scenario={}').message).toContain('invalid');
  });
  it('handles unavailable local storage and malformed JSON', () => {
    expect(
      loadScenario('', {
        getItem: () => {
          throw new Error('storage denied');
        },
      }).scenario,
    ).toEqual(defaultScenario());
    expect(loadScenario('', { getItem: () => '{broken' }).message).toContain('could not be loaded');
  });
});
