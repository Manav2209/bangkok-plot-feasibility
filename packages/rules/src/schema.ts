import { z } from 'zod';

const text = z.string().trim().min(1);
const sourceSchema = z.strictObject({
  id: text,
  title: text,
  url: z.url(),
  locator: text,
  status: z.enum(['located', 'verified', 'unresolved']),
  note: text,
  issuer: text,
  retrievedOn: z.iso.date(),
  instrumentState: z.enum(['historical', 'draft', 'current', 'unknown']),
  effectiveDate: z.iso.date().optional(),
  publishedOn: z.iso.date().optional(),
});
const ruleSchema = z.strictObject({
  id: text,
  title: text,
  kind: z.enum(['evidence', 'geometric', 'aggregate', 'use', 'access', 'classification']),
  evidence: z.enum(['verified', 'hypothesis', 'unresolved']),
  implementation: z.enum(['implemented', 'unresolved']),
  appliesTo: z.array(z.enum(['condominium', 'office'])).min(1),
  sourceIds: z.array(text),
  explanation: text,
  originalThai: text.nullable(),
  interpretation: text,
  legalVersion: text.nullable(),
  clause: text.nullable(),
  dependencies: z.array(text),
  inputs: z.array(text),
  params: z.record(text, z.number()),
  paramUnits: z.record(text, text),
  predicate: z.enum(['evidence', 'at-most', 'at-least', 'review']),
  applicability: z
    .strictObject({ fact: text, equals: z.union([z.boolean(), z.number(), text]) })
    .optional(),
  exceptions: z.array(text),
  effect: text,
  boundaryCases: z.array(text).min(1),
});
export const ledgerSchema = z
  .strictObject({
    version: text,
    sources: z.array(sourceSchema),
    rules: z.array(ruleSchema).min(1),
  })
  .superRefine((ledger, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ruleIds = new Set(ledger.rules.map((rule) => rule.id));
    const sourceIds = new Set(ledger.sources.map((source) => source.id));
    if (ruleIds.size !== ledger.rules.length) issue('Rule IDs must be unique.');
    if (sourceIds.size !== ledger.sources.length) issue('Source IDs must be unique.');
    for (const rule of ledger.rules) {
      for (const id of rule.dependencies)
        if (!ruleIds.has(id)) issue(`${rule.id}: unknown dependency ${id}.`);
      for (const id of rule.sourceIds)
        if (!sourceIds.has(id)) issue(`${rule.id}: unknown source ${id}.`);
      for (const key of Object.keys(rule.params))
        if (!rule.paramUnits[key]) issue(`${rule.id}: parameter ${key} needs a unit.`);
      if (rule.evidence === 'verified') {
        if (!rule.originalThai || !rule.legalVersion || !rule.clause || !rule.sourceIds.length)
          issue(`${rule.id}: verified rules need Thai text, version, clause and sources.`);
        if (
          rule.sourceIds.some((id) => {
            const source = ledger.sources.find((entry) => entry.id === id);
            return (
              !source ||
              source.status !== 'verified' ||
              source.instrumentState !== 'current' ||
              !source.effectiveDate
            );
          })
        )
          issue(`${rule.id}: applicable, verified source evidence is required.`);
      }
      if (rule.implementation === 'implemented') {
        if (rule.evidence !== 'verified' || rule.predicate === 'review')
          issue(
            `${rule.id}: implemented statutory rules require verified evidence and an evaluator.`,
          );
        if (!rule.inputs.length) issue(`${rule.id}: implemented rules need declared inputs.`);
        if (
          ['at-most', 'at-least'].includes(rule.predicate) &&
          (rule.params.limit === undefined || !rule.paramUnits.limit)
        )
          issue(`${rule.id}: numeric evaluator needs a limit and unit.`);
      }
    }
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const byId = new Map(ledger.rules.map((rule) => [rule.id, rule]));
    function visit(id: string) {
      if (visiting.has(id)) {
        issue(`Dependency cycle at ${id}.`);
        return;
      }
      if (visited.has(id)) return;
      visiting.add(id);
      byId.get(id)?.dependencies.forEach(visit);
      visiting.delete(id);
      visited.add(id);
    }
    ruleIds.forEach(visit);
  });
export type RuleLedger = z.infer<typeof ledgerSchema>;
