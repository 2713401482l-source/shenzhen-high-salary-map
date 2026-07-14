import fs from 'node:fs/promises';
import { isDirectJobDetailUrl } from './job-data.mjs';

const analysis = JSON.parse(await fs.readFile('data/v3/analysis/real-analysis.json', 'utf8'));
const verified = JSON.parse(await fs.readFile('data/jobs/verified.json', 'utf8'));
const candidates = JSON.parse(await fs.readFile('data/jobs/candidates.json', 'utf8'));
const jobs = [...verified, ...candidates];
const formalJobs = verified.filter(job => {
  if (!job.authenticity) return false;
  return job.authenticity.status === 'verified' && job.analysisEligibility?.formalSample === true;
});
const failures = [];
const fail = message => failures.push(message);

if (analysis.metadata?.dataKind !== 'real-analysis') fail('analysis must declare dataKind=real-analysis');
if (analysis.scope?.jobs !== formalJobs.length) fail('analysis job count does not match authenticity-gated formal jobs');
if (analysis.scope?.discoveryJobs !== jobs.length) fail('analysis discovery count does not match source files');
if (analysis.scope?.detailJobs !== formalJobs.length) fail('detail denominator does not match formal jobs');
if (analysis.skills?.denominator !== formalJobs.length) fail('skill denominator must use authenticity-gated detail jobs only');
if (analysis.readiness?.benchmark?.target !== 50) fail('benchmark target must remain 50 detail jobs');
if (analysis.readiness?.discovery?.target < 300) fail('discovery target must remain at least 300 jobs');
if (analysis.timeSeries?.available !== (analysis.scope.capturedDates.length >= 2)) fail('time-series eligibility mismatch');
if (analysis.marketProfile?.denominator !== formalJobs.length) fail('market profile denominator does not match formal jobs');
for (const dimension of ['salaryBands', 'industries', 'districts', 'experience', 'education']) {
  const total = (analysis.marketProfile?.[dimension] ?? []).reduce((sum, item) => sum + item.count, 0);
  if (total !== formalJobs.length) fail(`market profile ${dimension} does not sum to formal jobs`);
}

const realIds = new Set(jobs.map(job => job.id));
for (const role of analysis.roleSignals ?? []) {
  if (role.status === 'emerging' && (role.sampleCount < 3 || role.companyCount < 2 || role.detailCount < 1)) fail(`emerging threshold violation: ${role.name}`);
  for (const evidence of role.evidenceJobs ?? []) {
    if (!realIds.has(evidence.id)) fail(`unknown role evidence job: ${evidence.id}`);
    if (!isDirectJobDetailUrl(evidence.sourceUrl)) fail(`invalid role evidence URL: ${evidence.id}`);
  }
}

for (const skill of analysis.skills?.stats ?? []) {
  if (skill.denominator !== formalJobs.length) fail(`skill denominator mismatch: ${skill.name}`);
  if (skill.evidenceJobs.some(job => !formalJobs.some(source => source.id === job.id))) fail(`skill uses non-formal evidence: ${skill.name}`);
}

for (const pair of analysis.skills?.pairs ?? []) {
  if (pair.publishable !== (pair.count >= 3)) fail(`skill pair threshold mismatch: ${pair.pair}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  throw new Error(`${failures.length} V3 analysis validation failure(s)`);
}

console.log(JSON.stringify({
  jobs: analysis.scope.jobs,
  detailJobs: analysis.scope.detailJobs,
  emergingSignals: analysis.readiness.emergingRoles.actual,
  benchmarkBest: analysis.readiness.benchmark.best,
  capturedDates: analysis.scope.capturedDates,
  marketProfileDimensions: 5,
}, null, 2));
console.log('V3 real analysis is traceable and respects publication thresholds.');
