import { describe, expect, it } from 'vitest';
import { coreRuleProfile, coreRuleProfileSchema } from './core';

describe('core rule evidence integrity', () => {
  it('requires known parameter/source references and unique rule identities', () => {
    expect(coreRuleProfile.rules).toHaveLength(10);
    expect(coreRuleProfileSchema.safeParse(coreRuleProfile).success).toBe(true);
    const missingParameter = structuredClone(coreRuleProfile);
    missingParameter.rules[0].parameterKeys = ['invented-limit'];
    expect(coreRuleProfileSchema.safeParse(missingParameter).success).toBe(false);
    const missingSource = structuredClone(coreRuleProfile);
    missingSource.rules[0].sourceIds = ['invented-source'];
    expect(coreRuleProfileSchema.safeParse(missingSource).success).toBe(false);
    const duplicated = structuredClone(coreRuleProfile);
    duplicated.rules.push(duplicated.rules[0]);
    expect(coreRuleProfileSchema.safeParse(duplicated).success).toBe(false);
  });
});
