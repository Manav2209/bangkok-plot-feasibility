import { describe, expect, it } from 'vitest';
import { complianceStatus, evaluateRules, ledger, ledgerSchema, type RuleLedger } from './index';

// Entirely synthetic instruments and limits, never Bangkok legal assertions.
function fixture(): RuleLedger {
  const base = {
    kind: 'aggregate' as const,
    evidence: 'verified' as const,
    implementation: 'implemented' as const,
    appliesTo: ['condominium' as const, 'office' as const],
    sourceIds: ['synthetic'],
    explanation: 'Synthetic test fixture only.',
    originalThai: 'ทดสอบ',
    interpretation: 'Synthetic limit.',
    legalVersion: 'synthetic-v1',
    clause: 'fixture',
    exceptions: [],
    effect: 'Synthetic budget.',
    boundaryCases: ['Below, at and above the synthetic threshold.'],
  };
  return {
    version: 'synthetic-test-only',
    sources: [
      {
        id: 'synthetic',
        title: 'Synthetic test instrument',
        url: 'https://example.test/fixture',
        locator: 'fixture only',
        status: 'verified',
        note: 'Invented test data, not law.',
        issuer: 'Test fixture',
        retrievedOn: '2026-11-22',
        effectiveDate: '2026-01-01',
        instrumentState: 'current',
      },
    ],
    rules: [
      {
        ...base,
        id: 'baseline',
        title: 'Synthetic evidence',
        kind: 'evidence',
        predicate: 'evidence',
        dependencies: [],
        inputs: ['baselineVerified'],
        params: {},
        paramUnits: {},
      },
      {
        ...base,
        id: 'budget',
        title: 'Synthetic area cap',
        predicate: 'at-most',
        dependencies: ['baseline'],
        inputs: ['area'],
        params: { limit: 100 },
        paramUnits: { limit: 'm²' },
      },
    ],
  };
}
describe('committed rule evidence', () => {
  it('validates the actual JSON and keeps every historical candidate unresolved', () => {
    expect(ledgerSchema.safeParse(ledger).success).toBe(true);
    const checks = evaluateRules('condominium', {
      regulatedFar: 1,
      regulatedOpenSpaceRatio: 1,
      permeableOpenSpaceRatio: 1,
    });
    expect(checks).toHaveLength(16);
    expect(checks.every((check) => check.status === 'unknown')).toBe(true);
    expect(complianceStatus(checks)).toBe('unknown');
  });
});
describe('ledger integrity', () => {
  it.each([
    'duplicate-rule',
    'duplicate-source',
    'missing-dependency',
    'missing-source',
    'cycle',
    'missing-unit',
    'nonfinite',
    'missing-thai',
    'draft',
    'missing-date',
    'unverified-implementation',
  ])('rejects %s before evaluating', (caseName) => {
    const data = fixture();
    if (caseName === 'duplicate-rule') data.rules.push(data.rules[0]);
    if (caseName === 'duplicate-source') data.sources.push(data.sources[0]);
    if (caseName === 'missing-dependency') data.rules[1].dependencies = ['missing'];
    if (caseName === 'missing-source') data.rules[1].sourceIds = ['missing'];
    if (caseName === 'cycle') data.rules[0].dependencies = ['budget'];
    if (caseName === 'missing-unit') data.rules[1].paramUnits = {};
    if (caseName === 'nonfinite') data.rules[1].params.limit = Infinity;
    if (caseName === 'missing-thai') data.rules[1].originalThai = null;
    if (caseName === 'draft') data.sources[0].instrumentState = 'draft';
    if (caseName === 'missing-date') delete data.sources[0].effectiveDate;
    if (caseName === 'unverified-implementation') data.rules[1].evidence = 'hypothesis';
    expect(() => evaluateRules('condominium', { baselineVerified: true, area: 1 }, data)).toThrow();
  });
});
describe('independent unrounded numeric checks and prerequisites', () => {
  it.each([
    [99.999, 'pass'],
    [100, 'pass'],
    [100.00001, 'fail'],
  ] as const)('compares at-most %s without UI rounding', (area, status) => {
    const check = evaluateRules('condominium', { baselineVerified: true, area }, fixture())[1];
    expect(check).toMatchObject({ status, actual: area, required: 100, unit: 'm²' });
  });
  it.each([
    [99.999, 'fail'],
    [100, 'pass'],
    [100.00001, 'pass'],
  ] as const)('compares at-least %s', (area, status) => {
    const data = fixture();
    data.rules[1].predicate = 'at-least';
    expect(evaluateRules('condominium', { baselineVerified: true, area }, data)[1].status).toBe(
      status,
    );
  });
  it.each([undefined, null, NaN, Infinity])(
    'keeps missing/invalid measurement %s unknown',
    (area) => {
      expect(
        evaluateRules('condominium', { baselineVerified: true, area }, fixture())[1].status,
      ).toBe('unknown');
    },
  );
  it('cannot pass a budget with an unknown or failed prerequisite', () => {
    for (const baselineVerified of [undefined, false]) {
      const checks = evaluateRules('condominium', { baselineVerified, area: 1 }, fixture());
      expect(checks[1].status).toBe('unknown');
      expect(complianceStatus(checks)).not.toBe('pass');
    }
  });
  it('requires every declared evidence fact to be true', () => {
    const data = fixture();
    data.rules[0].inputs.push('otherEvidence');
    const checks = evaluateRules(
      'condominium',
      { baselineVerified: true, otherEvidence: false, area: 1 },
      data,
    );
    expect(checks[0].status).toBe('fail');
    expect(checks[1].status).toBe('unknown');
  });
  it('distinguishes unknown applicability from demonstrated non-applicability', () => {
    const data = fixture();
    data.rules[1].applicability = { fact: 'hasWaterway', equals: true };
    expect(evaluateRules('condominium', { baselineVerified: true, area: 1 }, data)[1].status).toBe(
      'unknown',
    );
    expect(
      evaluateRules('condominium', { baselineVerified: true, area: 1, hasWaterway: false }, data)[1]
        .status,
    ).toBe('not-applicable');
  });
  it('uses researched applicability to distinguish building uses', () => {
    const data = fixture();
    data.rules[1].appliesTo = ['condominium'];
    expect(evaluateRules('office', { baselineVerified: true, area: 101 }, data)[1].status).toBe(
      'not-applicable',
    );
    expect(
      evaluateRules('condominium', { baselineVerified: true, area: 101 }, data)[1].status,
    ).toBe('fail');
  });
  it('independently evaluates two design facts', () => {
    const a = evaluateRules('condominium', { baselineVerified: true, area: 101 }, fixture());
    const b = evaluateRules('condominium', { baselineVerified: true, area: 99 }, fixture());
    expect(complianceStatus(a)).toBe('fail');
    expect(complianceStatus(b)).toBe('pass');
    expect(complianceStatus([])).toBe('unknown');
  });
});
