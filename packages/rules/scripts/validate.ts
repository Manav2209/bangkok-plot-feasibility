import { readFileSync } from 'node:fs';
import { ledgerSchema } from '../src/schema.ts';
import { referenceProfileSchema } from '../src/profile-schema.ts';

const raw = JSON.parse(readFileSync(new URL('../src/ledger.v2.json', import.meta.url), 'utf8'));
const ledger = ledgerSchema.parse(raw);
referenceProfileSchema.parse(
  JSON.parse(readFileSync(new URL('../src/reference-profile.json', import.meta.url), 'utf8')),
);
console.log(
  `Validated ${ledger.version}: ${ledger.rules.length} rules, ${ledger.sources.length} sources. Legal evidence status is unchanged.`,
);
