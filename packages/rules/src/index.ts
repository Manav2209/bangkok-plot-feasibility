import type { CheckResult, RuleDefinition, SourceReference } from '@bangkok/domain';

export const RULESET_VERSION = 'research-preview.1';
export const sources: SourceReference[] = [
  {
    id: 'bma-2013',
    title: 'Bangkok comprehensive plan, B.E. 2556 (2013)',
    url: 'https://webportal.bangkok.go.th/public/user_files_editor/76/law/tk10.pdf',
    locator: 'Gazette 16 May 2013; clauses 1–4, printed pages 1–2',
    status: 'located',
    note: 'Official hosted text located. Current applicability, amendments, zone parameters and all building-control conditions remain unverified.',
  },
  {
    id: 'phra-khanong-map',
    title: 'BMA Phra Khanong district map (2013)',
    url: 'https://webportal.bangkok.go.th/public/user_files_editor/354/DISTRICT_CPD/2556/1009.pdf',
    locator: 'Candidate district map from the plan; boundary not digitized',
    status: 'unresolved',
    note: 'The illustrative plot has not been matched to an authoritative zoning or cadastral boundary.',
  },
];

export const rules: RuleDefinition[] = [
  {
    id: 'assumed-setback',
    title: 'Uniform boundary inset',
    status: 'assumption',
    sourceIds: [],
    explanation:
      'User-selected geometric experiment. Applied equally to every edge; it is not a sourced Bangkok setback.',
  },
  {
    id: 'legal-version',
    title: 'Applicable legal version',
    status: 'unresolved',
    sourceIds: ['bma-2013'],
    explanation:
      'Check enacted instruments, amendments and continued application. A located historical regulation is insufficient.',
  },
  {
    id: 'site-evidence',
    title: 'Zone, parcel and vacancy',
    status: 'unresolved',
    sourceIds: ['phra-khanong-map'],
    explanation:
      'The sample boundary is illustrative. Zone membership, ownership boundaries, dated vacancy evidence and overlays need verification.',
  },
  {
    id: 'far-osr',
    title: 'FAR and open-space requirements',
    status: 'unresolved',
    sourceIds: ['bma-2013'],
    explanation:
      'Clause 4 defines the ratios. Zone limits, floor-area inclusions and exclusions, and application to this site need research.',
  },
  {
    id: 'roads-height',
    title: 'Roads, setbacks and height',
    status: 'unresolved',
    sourceIds: [],
    explanation:
      'No verified road right-of-way, frontage, road-dependent height rule or waterway restriction is available.',
  },
  {
    id: 'use-access',
    title: 'Use, access, parking and review',
    status: 'unresolved',
    sourceIds: [],
    explanation:
      'Condominium permission, building classification, fire access, parking and environmental review remain unevaluated.',
  },
];

export function unresolvedChecks(): CheckResult[] {
  return rules
    .filter((rule) => rule.status === 'unresolved')
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      status: 'unknown',
      explanation: rule.explanation,
      sourceIds: rule.sourceIds,
    }));
}
