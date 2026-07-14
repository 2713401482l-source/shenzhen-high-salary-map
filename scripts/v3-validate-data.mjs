import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data/v3');
const plan = JSON.parse(await fs.readFile(path.join(root, 'config/collection-plan.json'), 'utf8'));
const queue = JSON.parse(await fs.readFile(path.join(root, 'collection/query-queue.json'), 'utf8'));
const observationDir = path.join(root, 'observations');
const observationFiles = (await fs.readdir(observationDir)).filter(file => file.endsWith('.json')).sort();
const demo = JSON.parse(await fs.readFile(path.join(root, 'demo/page-logic-demo.json'), 'utf8'));
const allowedStatuses = new Set(['queued', 'collected', 'captured-manual', 'blocked-salary-auth', 'blocked-verification', 'exhausted']);
const queryIds = new Set();
const globalObservationIds = new Set();
let failures = 0;
let observations = 0;
let salaryVisible = 0;
let detailVisible = 0;
let demoRoles = 0;

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
  if (!Array.isArray(batch.observations)) fail(`${file}: observations must be an array`);
  if (Array.isArray(batch.observations) && !batch.observations.length && batch.resultSummary?.eligibleHighSalaryListings !== 0) {
    fail(`${file}: an empty observation batch must explicitly record zero eligible high-salary listings`);
  }
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

if (demo.metadata?.dataKind !== 'demo') fail('demo file must declare metadata.dataKind=demo');
if (demo.metadata?.excludedFromFormalStats !== true) fail('demo file must be excluded from formal statistics');
if (!Array.isArray(demo.roleSignals) || !demo.roleSignals.length) fail('demo roleSignals must be a non-empty array');
const demoIds = new Set();
for (const role of demo.roleSignals || []) {
  demoRoles += 1;
  if (demoIds.has(role.id)) fail(`duplicate demo role id ${role.id}`);
  demoIds.add(role.id);
  if (!role.name || !role.lane || !Array.isArray(role.skillCombo)) fail(`incomplete demo role ${role.id}`);
  if ('sourceUrl' in role || 'company' in role) fail(`demo role must not contain a source URL or company: ${role.id}`);
}

console.log(JSON.stringify({
  queries: queue.length,
  queued: queue.filter(row => row.status === 'queued').length,
  blockedSalaryAuth: queue.filter(row => row.status === 'blocked-salary-auth').length,
  observationBatches: observationFiles.length,
  observations,
  salaryVisible,
  detailVisible,
  demoRoles,
  demoExcludedFromFormalStats: demo.metadata?.excludedFromFormalStats === true
}, null, 2));

if (failures) throw new Error(`${failures} V3 data validation failure(s)`);
console.log('V3 collection data is internally consistent.');
