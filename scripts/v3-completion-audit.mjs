import fs from 'node:fs/promises';
import { isDirectJobDetailUrl } from './job-data.mjs';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));

const [candidates, verified, analysis, gapReport, collectionStatus] = await Promise.all([
  readJson('data/jobs/candidates.json'),
  readJson('data/jobs/verified.json'),
  readJson('data/v3/analysis/real-analysis.json'),
  readJson('data/v3/collection/gap-report.json'),
  readJson('data/v3/collection/status.json'),
]);

const allJobs = [...verified, ...candidates];
const requiredFields = [
  'id', 'title', 'company', 'salaryText', 'salaryMin', 'salaryMax',
  'salaryBand', 'city', 'district', 'industry', 'experience', 'education',
  'descriptionExcerpt', 'sourceUrl', 'capturedAt', 'evidenceLevel',
];

const missingByField = Object.fromEntries(requiredFields.map(field => [
  field,
  allJobs.filter(job => job[field] === null || job[field] === undefined || job[field] === '').length,
]));

const duplicateCount = field => allJobs.length - new Set(allJobs.map(job => job[field])).size;
const expectedBand = job => {
  const midpoint = (job.salaryMin + job.salaryMax) / 2;
  if (midpoint < 40) return '30K';
  if (midpoint < 75) return '50K';
  return '100K';
};

const structuralQuality = {
  missingByField,
  duplicates: {
    id: duplicateCount('id'),
    duplicateFingerprint: duplicateCount('duplicateFingerprint'),
    sourceUrl: duplicateCount('sourceUrl'),
  },
  nonShenzhen: allJobs.filter(job => job.city !== '深圳').length,
  salaryBandMismatch: allJobs.filter(job => expectedBand(job) !== job.salaryBand).length,
  invalidSourceUrls: allJobs.filter(job => !isDirectJobDetailUrl(job.sourceUrl)).length,
};

const structuralPass = Object.values(missingByField).every(value => value === 0)
  && Object.values(structuralQuality.duplicates).every(value => value === 0)
  && structuralQuality.nonShenzhen === 0
  && structuralQuality.salaryBandMismatch === 0
  && structuralQuality.invalidSourceUrls === 0;

const salaryBands = gapReport.salaryBands.map(item => ({
  band: item.band,
  discovery: {actual: item.actual, target: item.target, pass: item.actual >= item.target},
  detailEvidence: {actual: item.detailActual, target: item.detailTarget, pass: item.detailActual >= item.detailTarget},
}));

const requirements = {
  salaryBands,
  emergingRoles: analysis.readiness.emergingRoles,
  benchmark: analysis.readiness.benchmark,
  timeSeries: analysis.readiness.timeSeries,
};

const blockers = [
  ...salaryBands.flatMap(item => [
    item.discovery.pass ? null : `${item.band} 真实岗位还差 ${item.discovery.target - item.discovery.actual} 条`,
    item.detailEvidence.pass ? null : `${item.band} 详情证据还差 ${item.detailEvidence.target - item.detailEvidence.actual} 条`,
  ]),
  requirements.emergingRoles.pass ? null : `新兴岗位方向还差 ${requirements.emergingRoles.target - requirements.emergingRoles.actual} 个`,
  requirements.benchmark.pass ? null : `单岗对标还差 ${requirements.benchmark.target - (requirements.benchmark.best?.detailCount ?? 0)} 条同岗详情`,
  requirements.timeSeries.pass ? null : `可比时间快照还差 ${requirements.timeSeries.targetDates - requirements.timeSeries.actualDates} 个日期`,
].filter(Boolean);

const report = {
  metadata: {
    dataKind: 'v3-completion-audit',
    latestCapture: analysis.metadata.generatedFromLatestCapture,
    collectionStatus: collectionStatus.status,
    bossAccessAllowed: collectionStatus.bossAccessAllowed,
  },
  dataset: {
    grain: 'one public job posting per source-specific job id; cross-platform duplicates are resolved separately',
    totalJobs: allJobs.length,
    listingObservations: candidates.length,
    detailVerified: verified.length,
    companies: analysis.scope.companies,
    captureDates: analysis.scope.capturedDates,
  },
  structuralQuality: {...structuralQuality, pass: structuralPass},
  requirements,
  complete: structuralPass && blockers.length === 0,
  blockers,
};

await fs.writeFile('data/v3/quality/completion-audit.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  structuralPass,
  totalJobs: report.dataset.totalJobs,
  detailVerified: report.dataset.detailVerified,
  salaryBands: report.requirements.salaryBands,
  blockers: blockers.length,
  complete: report.complete,
}, null, 2));

if (!structuralPass) throw new Error('V3 completion audit found structural data-quality failures.');
