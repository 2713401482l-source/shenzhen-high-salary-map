import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data/v3');
const plan = JSON.parse(await fs.readFile(path.join(root, 'config/collection-plan.json'), 'utf8'));
const queue = JSON.parse(await fs.readFile(path.join(root, 'collection/query-queue.json'), 'utf8'));
const observationDir = path.join(root, 'observations');
const observationFiles = (await fs.readdir(observationDir)).filter(file => file.endsWith('.json')).sort();
const allowedStatuses = new Set(['queued', 'collected', 'blocked-salary-auth', 'blocked-verification', 'exhausted']);
const queryIds = new Set();
const globalObservationIds = new Set();
let failures = 0;
let observations = 0;
let salaryVisible = 0;
let detailVisible = 0;

const fail = message => {
  failures += 1;
  console.error(`FAIL: ${message}`);
};

if (plan.city !== '深圳') fail('collection plan city must be 深圳');
if (plan.discoveryTarget < 300) fail('discovery target must be at least 300');
if (plan.emergingRoleTarget < 30) fail('emerging role target must be at least 30');
if (plan.benchmarkRoleDetailTarget < 50) fail('benchmark role detail target must be at least 50');

for (const row of queue) {
  if (queryIds.has(row.id)) fail(`duplicate query id ${row.id}`);
  queryIds.add(row.id);
  if (!allowedStatuses.has(row.status)) fail(`invalid query status ${row.id}: ${row.status}`);
  if (!row.searchUrl.startsWith(`https://www.zhipin.com/c${plan.bossCityCode}/`)) fail(`query URL is not Shenzhen public route: ${row.id}`);
}

for (const file of observationFiles) {
  const batch = JSON.parse(await fs.readFile(path.join(observationDir, file), 'utf8'));
  if (!queryIds.has(batch.queryId)) fail(`${file}: unknown queryId ${batch.queryId}`);
  if (batch.city !== '深圳') fail(`${file}: city must be 深圳`);
  if (!Array.isArray(batch.observations) || !batch.observations.length) fail(`${file}: observations must be a non-empty array`);
  if (!batch.accessState || typeof batch.accessState.salaryVisible !== 'boolean') fail(`${file}: missing accessState.salaryVisible`);
  if (!batch.analysisEligibility) fail(`${file}: missing analysisEligibility`);

  const localIds = new Set();
  for (const row of batch.observations || []) {
    observations += 1;
    if (localIds.has(row.bossJobId)) fail(`${file}: duplicate bossJobId ${row.bossJobId}`);
    localIds.add(row.bossJobId);
    const observationKey = `${batch.snapshotId}:${row.bossJobId}`;
    if (globalObservationIds.has(observationKey)) fail(`${file}: duplicate snapshot observation ${observationKey}`);
    globalObservationIds.add(observationKey);
    if (!row.sourceUrl?.startsWith(`https://www.zhipin.com/job_detail/${row.bossJobId}.html`)) fail(`${file}: invalid detail URL for ${row.bossJobId}`);
    if (!row.title || !row.company || !row.location?.includes('深圳')) fail(`${file}: incomplete discovery fields for ${row.bossJobId}`);
    if (row.salaryText) salaryVisible += 1;
    if (row.descriptionText) detailVisible += 1;
  }

  if (!batch.accessState.salaryVisible && batch.analysisEligibility.salaryAnalysis) {
    fail(`${file}: salary analysis cannot be enabled while salary is hidden`);
  }
  if (!batch.accessState.salaryVisible && batch.analysisEligibility.benchmarkCorpus) {
    fail(`${file}: benchmark corpus cannot be enabled while salary is hidden`);
  }
}

console.log(JSON.stringify({
  queries: queue.length,
  queued: queue.filter(row => row.status === 'queued').length,
  blockedSalaryAuth: queue.filter(row => row.status === 'blocked-salary-auth').length,
  observationBatches: observationFiles.length,
  observations,
  salaryVisible,
  detailVisible
}, null, 2));

if (failures) throw new Error(`${failures} V3 data validation failure(s)`);
console.log('V3 collection data is internally consistent.');

