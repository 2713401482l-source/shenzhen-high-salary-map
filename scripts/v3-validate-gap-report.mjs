import fs from 'node:fs/promises';

const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const [report, plan, candidates, verified, queue] = await Promise.all([
  read('data/v3/collection/gap-report.json'),
  read('data/v3/config/collection-plan.json'),
  read('data/jobs/candidates.json'),
  read('data/jobs/verified.json'),
  read('data/v3/collection/query-queue.json'),
]);
const jobs = [...verified, ...candidates];
const failures = [];
const fail = message => failures.push(message);

if (report.metadata?.dataKind !== 'collection-gap-report') fail('gap report dataKind mismatch');
if (report.totals?.discovery?.actual !== jobs.length) fail('discovery actual mismatch');
if (report.totals?.discovery?.target !== plan.discoveryTarget) fail('discovery target mismatch');
if (report.totals?.detailEvidence?.actual !== verified.length) fail('detail actual mismatch');
if (report.totals?.detailEvidence?.target !== plan.verifiedDetailTarget) fail('detail target mismatch');
for (const band of report.salaryBands ?? []) {
  const actual = jobs.filter(job => job.salaryBand === band.band).length;
  const detailActual = verified.filter(job => job.salaryBand === band.band).length;
  if (band.actual !== actual || band.detailActual !== detailActual) fail(`${band.band} counts mismatch`);
  if (band.gap !== Math.max(0, band.target - actual)) fail(`${band.band} discovery gap mismatch`);
  if (band.detailGap !== Math.max(0, band.detailTarget - detailActual)) fail(`${band.band} detail gap mismatch`);
}
const queueIds = new Set(queue.map(item => item.id));
for (const item of report.priorityQueries ?? []) {
  if (!queueIds.has(item.id)) fail(`unknown priority query: ${item.id}`);
  if ('searchUrl' in item) fail(`priority query must not embed a Boss URL: ${item.id}`);
}
if (failures.length) {
  failures.forEach(message => console.error(`FAIL: ${message}`));
  throw new Error(`${failures.length} collection gap validation failure(s)`);
}
console.log(JSON.stringify({bands: report.salaryBands, benchmark: report.benchmark, blockers: report.publicationBlockers.length}, null, 2));
console.log('Collection gap report is consistent with the real data layers.');
