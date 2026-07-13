import fs from 'node:fs/promises';

const analysis = JSON.parse(await fs.readFile('data/v3/analysis/real-analysis.json', 'utf8'));
const verified = JSON.parse(await fs.readFile('data/jobs/verified.json', 'utf8'));
const candidates = JSON.parse(await fs.readFile('data/jobs/candidates.json', 'utf8'));
const jobs = [...verified, ...candidates];
const failures = [];
const fail = message => failures.push(message);

if (analysis.metadata?.dataKind !== 'real-analysis') fail('analysis must declare dataKind=real-analysis');
if (analysis.scope?.jobs !== jobs.length) fail('analysis job count does not match source files');
if (analysis.scope?.detailJobs !== verified.length) fail('detail denominator does not match verified jobs');
if (analysis.skills?.denominator !== verified.length) fail('skill denominator must use verified detail jobs only');
if (analysis.readiness?.benchmark?.target !== 50) fail('benchmark target must remain 50 detail jobs');
if (analysis.readiness?.discovery?.target < 300) fail('discovery target must remain at least 300 jobs');
if (analysis.timeSeries?.available !== (analysis.scope.capturedDates.length >= 2)) fail('time-series eligibility mismatch');

const realIds = new Set(jobs.map(job => job.id));
for (const role of analysis.roleSignals ?? []) {
  if (role.status === 'emerging' && (role.sampleCount < 3 || role.companyCount < 2 || role.detailCount < 1)) fail(`emerging threshold violation: ${role.name}`);
  for (const evidence of role.evidenceJobs ?? []) {
    if (!realIds.has(evidence.id)) fail(`unknown role evidence job: ${evidence.id}`);
    if (!evidence.sourceUrl?.startsWith('https://www.zhipin.com/job_detail/')) fail(`invalid role evidence URL: ${evidence.id}`);
  }
}

for (const skill of analysis.skills?.stats ?? []) {
  if (skill.denominator !== verified.length) fail(`skill denominator mismatch: ${skill.name}`);
  if (skill.evidenceJobs.some(job => !verified.some(source => source.id === job.id))) fail(`skill uses non-detail evidence: ${skill.name}`);
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
}, null, 2));
console.log('V3 real analysis is traceable and respects publication thresholds.');
