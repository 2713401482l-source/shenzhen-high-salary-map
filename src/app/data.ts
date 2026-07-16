import verifiedSource from '../../data/jobs/verified.json';
import candidateSource from '../../data/jobs/candidates.json';
import demoSource from '../../data/v3/demo/page-logic-demo.json';
import realAnalysisSource from '../../data/v3/analysis/real-analysis.json';
import officialSourcesSource from '../../data/v3/sources/official-sources.json';
import collectionGapReportSource from '../../data/v3/collection/gap-report.json';

export type SalaryBand = '30K' | '50K' | '100K';
export type EvidenceLevel = 'boss-detail' | 'boss-listing-plus-detail' | 'boss-listing' | 'government-detail' | 'employer-detail' | 'public-platform-detail' | 'licensed-api-detail' | 'public-index-probable';

export type Job = {
  id: string;
  bossJobId?: string;
  sourcePlatform?: string;
  title: string;
  company: string;
  salaryText: string;
  salaryMin: number;
  salaryMax: number;
  salaryMonths?: number;
  salaryBand: SalaryBand;
  city: string;
  district: string;
  addressText: string;
  industry: string;
  experience: string;
  education: string;
  descriptionExcerpt: string;
  requirementText: string;
  sourceUrl: string;
  capturedAt: string;
  evidenceLevel: EvidenceLevel;
  status: 'verified' | 'candidate';
  sourceVisibility?: 'visible' | 'hidden';
  authenticity?: {status?: string};
};

export type DemoRole = (typeof demoSource.roleSignals)[number];
export type DemoGrowthPath = (typeof demoSource.growthPaths)[number];

const normalizeJob = (job: (typeof verifiedSource)[number] | (typeof candidateSource)[number]): Job => ({
  ...job,
  salaryBand: job.salaryBand as SalaryBand,
  evidenceLevel: job.evidenceLevel as EvidenceLevel,
  status: job.status as 'verified' | 'candidate',
  sourceVisibility: ('sourceVisibility' in job ? job.sourceVisibility : undefined) as 'visible' | 'hidden' | undefined,
  requirementText: job.requirementText ?? '',
  capturedAt: job.capturedAt,
});

export const verifiedJobs = verifiedSource.map(normalizeJob);
export const candidateJobs = candidateSource.map(normalizeJob);
export const probableJobs = candidateJobs.filter(job => job.authenticity?.status === 'probable');
export const realJobs = [...verifiedJobs, ...candidateJobs];
export const demoData = demoSource;
export const realAnalysis = realAnalysisSource;
export const officialSources = officialSourcesSource;
export const collectionGapReport = collectionGapReportSource;

export const capturedAt = realJobs
  .map(job => job.capturedAt)
  .sort()
  .at(-1) ?? '2026-07-12';

export const realEvidence = {
  total: realAnalysis.scope.jobs,
  discoveryTotal: realJobs.length,
  verified: realAnalysis.scope.detailJobs,
  probable: probableJobs.length,
  listingObserved: realAnalysis.scope.jobs - realAnalysis.scope.detailJobs,
  companies: realAnalysis.scope.companies,
};

export type RealRoleFamily = {
  name: string;
  status: 'emerging' | 'early-signal' | 'observed-family';
  count: number;
  companies: number;
  industries: number;
  salaryMin: number;
  salaryMax: number;
  salaryMedianMid: number;
  verified: number;
  jobs: Job[];
};

const jobsById = new Map(realJobs.map(job => [job.id, job]));

export const realRoleFamilies: RealRoleFamily[] = realAnalysis.roleSignals.map(role => ({
  name: role.name,
  status: role.status as RealRoleFamily['status'],
  count: role.sampleCount,
  companies: role.companyCount,
  industries: role.industryCount,
  salaryMin: role.salary.min,
  salaryMax: role.salary.max,
  salaryMedianMid: role.salary.medianMid,
  verified: role.detailCount,
  jobs: role.evidenceJobs.map(evidence => jobsById.get(evidence.id)).filter((job): job is Job => Boolean(job)),
}));

export type SkillStat = {name: string; count: number; jobs: Job[]};

export const verifiedSkillStats: SkillStat[] = realAnalysis.skills.stats.map(skill => ({
  name: skill.name,
  count: skill.count,
  jobs: skill.evidenceJobs.map(evidence => jobsById.get(evidence.id)).filter((job): job is Job => Boolean(job)),
}));

export const verifiedSkillPairs = realAnalysis.skills.pairs.map(item => ({
  pair: item.pair.split(' + ') as [string, string],
  count: item.count,
  publishable: item.publishable,
  jobs: item.evidenceJobs.map(evidence => jobsById.get(evidence.id)).filter((job): job is Job => Boolean(job)),
}));

export type ExpansionSignal = {
  company: string;
  jobCount: number;
  distinctTitles: number;
  evidenceJobs: Array<{id: string; title: string; salaryText: string; sourceUrl: string}>;
};

const SOURCE_LABELS: Record<string, string> = {
  boss: 'Boss直聘',
  iucai: '深i人才',
  'guangdong-public': '广东公共招聘',
  liepin: '猎聘',
  zhaopin: '智联招聘',
  'employer-career': '企业官网',
  'licensed-api': '授权数据接口',
};

export function sourceLabelFor(job: Pick<Job, 'sourcePlatform'>): string {
  return SOURCE_LABELS[job.sourcePlatform || 'boss'] || job.sourcePlatform || '公开招聘平台';
}

export function isProbableJob(job: Pick<Job, 'authenticity'>): boolean {
  return job.authenticity?.status === 'probable';
}

export const realExpansionSignals = realAnalysisSource.expansionSignals as ExpansionSignal[];

export const districtOptions = [...new Set(realJobs.map(job => job.district))].filter(Boolean).sort();
export const industryOptions = [...new Set(realJobs.map(job => job.industry))].filter(Boolean).sort();

export function salaryBandFromMid(job: Pick<Job, 'salaryMin' | 'salaryMax'>): SalaryBand {
  const middle = (job.salaryMin + job.salaryMax) / 2;
  if (middle < 40) return '30K';
  if (middle < 75) return '50K';
  return '100K';
}
