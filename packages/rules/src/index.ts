import ledgerData from './ledger.v2.json';
import type { BuildingUse, CheckResult } from '@bangkok/domain';
import { ledgerSchema, type RuleLedger } from './schema';

export { ledgerSchema, type RuleLedger } from './schema';
export { referenceProfile, referenceProfileSchema, referenceValue } from './profile';
export { coreRuleProfile, coreRuleProfileSchema } from './core';
export const ledger = ledgerSchema.parse(ledgerData);
export const RULESET_VERSION = ledger.version;
export const sources = ledger.sources;
export const rules = ledger.rules;
export type RuleFacts = Record<string, number | boolean | string | undefined | null>;

/** Legal numbers come only from a validated ledger; geometry supplies observed facts. */
export function evaluateRules(
  use: BuildingUse,
  facts: RuleFacts,
  selectedLedger: RuleLedger = ledger,
): CheckResult[] {
  const validated = ledgerSchema.parse(selectedLedger);
  const byId = new Map(validated.rules.map((rule) => [rule.id, rule]));
  const checked = new Map<string, CheckResult>();
  function evaluate(id: string): CheckResult {
    const cached = checked.get(id);
    if (cached) return cached;
    const rule = byId.get(id)!;
    const base: CheckResult = {
      id: rule.id,
      title: rule.title,
      scope: 'statutory',
      status: 'unknown',
      explanation: rule.explanation,
      sourceIds: rule.sourceIds,
      prerequisiteIds: rule.dependencies,
    };
    const save = (patch: Partial<CheckResult>) => {
      const result = { ...base, ...patch };
      checked.set(id, result);
      return result;
    };
    if (!rule.appliesTo.includes(use))
      return save({ status: 'not-applicable', explanation: `This rule does not apply to ${use}.` });
    if (rule.evidence !== 'verified' || rule.implementation !== 'implemented') return save({});
    const prerequisites = rule.dependencies.map(evaluate);
    const unresolved = prerequisites.filter((check) => check.status !== 'pass');
    if (unresolved.length)
      return save({
        explanation: `Unresolved or unsatisfied prerequisites: ${unresolved.map((check) => check.title).join(', ')}. ${rule.explanation}`,
      });
    if (rule.applicability) {
      const value = facts[rule.applicability.fact];
      if (value === undefined || value === null)
        return save({ explanation: `Applicability needs ${rule.applicability.fact}.` });
      if (value !== rule.applicability.equals)
        return save({
          status: 'not-applicable',
          explanation: `${rule.applicability.fact} does not match this rule's applicability condition.`,
        });
    }
    const missing = rule.inputs.filter(
      (input) =>
        facts[input] === undefined ||
        facts[input] === null ||
        (typeof facts[input] === 'number' && !Number.isFinite(facts[input])),
    );
    if (missing.length)
      return save({ explanation: `Missing required inputs: ${missing.join(', ')}.` });
    const value = facts[rule.inputs[0]];
    if (rule.predicate === 'evidence') {
      const evidence = rule.inputs.map((input) => facts[input]);
      if (evidence.some((fact) => typeof fact !== 'boolean'))
        return save({ explanation: 'Verified boolean evidence decisions are required.' });
      return save({ status: evidence.every((fact) => fact === true) ? 'pass' : 'fail' });
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || rule.predicate === 'review')
      return save({});
    const limit = rule.params.limit;
    // Exact unrounded comparison; geometry owns measurement tolerances.
    const pass = rule.predicate === 'at-most' ? value <= limit : value >= limit;
    return save({
      status: pass ? 'pass' : 'fail',
      actual: value,
      required: limit,
      unit: rule.paramUnits.limit,
      explanation: `${rule.interpretation} Actual ${value}; required ${rule.predicate === 'at-most' ? 'at most' : 'at least'} ${limit} ${rule.paramUnits.limit}.`,
    });
  }
  return validated.rules.map((rule) => evaluate(rule.id));
}

export function unresolvedChecks(): CheckResult[] {
  return evaluateRules('condominium', {});
}

export function complianceStatus(checks: CheckResult[]): 'unknown' | 'fail' | 'pass' {
  const statutory = checks.filter((check) => check.scope === 'statutory');
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (
    !statutory.some((check) => check.status !== 'not-applicable') ||
    statutory.some((check) => check.status === 'unknown')
  )
    return 'unknown';
  return 'pass';
}
