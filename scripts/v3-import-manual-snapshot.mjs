import fs from 'node:fs/promises';
import path from 'node:path';
import { validateJob } from './job-data.mjs';
import {
  parseBossJobId,
  snapshotHash,
  toCandidate,
  validateManualSnapshot,
} from './v3-collection-lib.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const inputArg = args.find(arg => !arg.startsWith('--'));
if (!inputArg) throw new Error('用法: node scripts/v3-import-manual-snapshot.mjs <snapshot.json> [--apply]');

const inputPath = path.resolve(inputArg);
const snapshot = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const errors = validateManualSnapshot(snapshot);
if (errors.length) throw new Error(`快照未通过校验:\n- ${errors.join('\n- ')}`);
if (apply && snapshot.exampleOnly) throw new Error('示例快照禁止写入正式数据');

const root = path.resolve('data');
const candidatePath = path.join(root, 'jobs/candidates.json');
const verifiedPath = path.join(root, 'jobs/verified.json');
const rejectedPath = path.join(root, 'jobs/rejected.json');
const queuePath = path.join(root, 'v3/collection/query-queue.json');
const candidates = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
const verified = JSON.parse(await fs.readFile(verifiedPath, 'utf8'));
const rejected = JSON.parse(await fs.readFile(rejectedPath, 'utf8'));
const queue = JSON.parse(await fs.readFile(queuePath, 'utf8'));
const queueItem = snapshot.kind === 'listing' ? queue.find(item => item.id === snapshot.queryId) : null;
if (snapshot.kind === 'listing' && !queueItem) throw new Error(`queryId 不在采集队列中: ${snapshot.queryId}`);
const all = [...candidates, ...verified, ...rejected];
const byId = new Map(all.map(job => [job.id, job]));
const byUrl = new Map(all.map(job => [job.sourceUrl, job]));
const byFingerprint = new Map([...candidates, ...verified].map(job => [job.duplicateFingerprint, job]));

const day = snapshot.capturedAt.slice(0, 10);
const rawRelative = `v3/collection/raw/${day}/${snapshot.kind}-${snapshotHash(snapshot)}.json`;
const rawPath = path.join(root, rawRelative);
const report = { kind: snapshot.kind, accepted: [], duplicates: [], rejected: [], rawEvidenceFile: rawRelative };

if (snapshot.kind === 'listing') {
  for (const row of snapshot.jobs) {
    const candidate = toCandidate(row, snapshot, rawRelative);
    const prior = byId.get(candidate.id) || byUrl.get(candidate.sourceUrl) || byFingerprint.get(candidate.duplicateFingerprint);
    if (prior) {
      report.duplicates.push({ title: candidate.title, company: candidate.company, existingId: prior.id });
      continue;
    }
    const jobErrors = validateJob(candidate, 'candidate');
    if (jobErrors.length) {
      report.rejected.push({ title: candidate.title, company: candidate.company, reasons: jobErrors });
      continue;
    }
    report.accepted.push(candidate);
    byId.set(candidate.id, candidate);
    byUrl.set(candidate.sourceUrl, candidate);
    byFingerprint.set(candidate.duplicateFingerprint, candidate);
  }
} else {
  const id = `boss-${parseBossJobId(snapshot.job.sourceUrl)}`;
  const candidateIndex = candidates.findIndex(job => job.id === id);
  if (candidateIndex < 0) throw new Error(`详情快照找不到对应候选岗位: ${id}。请先导入列表快照。`);
  const candidate = candidates[candidateIndex];
  if (candidate.salaryText !== snapshot.job.salaryText) throw new Error('详情页薪资与列表薪资不一致，需人工复核，已停止晋级');
  if (candidate.title !== snapshot.job.title.trim() || candidate.company !== snapshot.job.company.trim()) {
    throw new Error('详情页岗位名或公司名与候选记录不一致，需人工复核，已停止晋级');
  }
  const promoted = {
    ...candidate,
    requirementText: snapshot.job.descriptionText.trim(),
    descriptionExcerpt: candidate.descriptionExcerpt || snapshot.job.descriptionText.trim().slice(0, 180),
    verifiedAt: snapshot.capturedAt,
    status: 'verified',
    rawDetailEvidenceFile: rawRelative,
    salaryEvidence: 'boss-job-detail',
    evidenceLevel: 'boss-detail',
  };
  const jobErrors = validateJob(promoted, 'verified');
  if (jobErrors.length) throw new Error(`详情岗位未通过正式校验: ${jobErrors.join('; ')}`);
  report.accepted.push(promoted);
  report.candidateIndex = candidateIndex;
}

console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...report, accepted: report.accepted.map(job => ({ id: job.id, title: job.title, company: job.company, salaryText: job.salaryText })) }, null, 2));
if (!apply) {
  console.log('\n这是预检，没有改动文件。确认无误后追加 --apply。');
  process.exit(0);
}

await fs.mkdir(path.dirname(rawPath), { recursive: true });
try {
  await fs.writeFile(rawPath, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' });
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
}

if (snapshot.kind === 'listing') {
  candidates.push(...report.accepted);
  candidates.sort((a, b) => a.id.localeCompare(b.id));
  await fs.writeFile(candidatePath, `${JSON.stringify(candidates, null, 2)}\n`);
  queueItem.status = 'captured-manual';
  queueItem.attempts += 1;
  queueItem.discoveredJobs += report.accepted.length;
  queueItem.lastAttemptAt = snapshot.capturedAt;
  queueItem.blocker = null;
  queueItem.lastRawEvidenceFile = rawRelative;
  await fs.writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`);
} else {
  candidates.splice(report.candidateIndex, 1);
  verified.push(report.accepted[0]);
  verified.sort((a, b) => a.id.localeCompare(b.id));
  await fs.writeFile(candidatePath, `${JSON.stringify(candidates, null, 2)}\n`);
  await fs.writeFile(verifiedPath, `${JSON.stringify(verified, null, 2)}\n`);
}

console.log(`已写入不可覆盖的原始快照 ${rawRelative}，并导入 ${report.accepted.length} 条正式数据。`);
