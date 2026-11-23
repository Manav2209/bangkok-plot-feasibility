import { z } from 'zod';
import data from './core-profile.json';
import ledger from './ledger.v2.json';
import { referenceProfile } from './profile';

const text = z.string().min(1);
export const coreRuleProfileSchema = z
  .strictObject({
    id: z.literal('y7-base-controls'),
    version: text,
    reviewedOn: z.iso.date(),
    scope: text,
    baselineUrl: z.url(),
    rules: z
      .array(
        z.strictObject({
          id: text,
          title: text,
          parameterKeys: z.array(text).min(1),
          sourceIds: z.array(text).min(1),
          url: z.url(),
          clause: text,
          thai: text,
          interpretation: text,
        }),
      )
      .min(1),
  })
  .superRefine((profile, ctx) => {
    const ids = new Set<string>();
    for (const rule of profile.rules) {
      if (ids.has(rule.id)) ctx.addIssue({ code: 'custom', message: 'Duplicate core rule.' });
      ids.add(rule.id);
      for (const key of rule.parameterKeys)
        if (!(key in referenceProfile.params))
          ctx.addIssue({ code: 'custom', message: `Missing core parameter ${key}.` });
      for (const id of rule.sourceIds)
        if (!ledger.sources.some((source) => source.id === id))
          ctx.addIssue({ code: 'custom', message: `Missing core source ${id}.` });
    }
  });
export const coreRuleProfile = coreRuleProfileSchema.parse(data);
