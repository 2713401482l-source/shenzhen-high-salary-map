import fs from 'node:fs/promises';
import path from 'node:path';
import { duplicateFingerprint, validateJob } from './job-data.mjs';
import { evaluateAuthenticity, toMultiSourceJob } from './v3-authenticity-lib.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const inputArg = args.find(arg => !arg.startsWith('--'));
if (!inputArg) throw new Error('用法: node scripts/v3-import-multisource-job.mjs <job.json> [--apply]');

const snapshot = JSON.parse(await fs.readFile(path.resolve(inputArg), 'utf8'));
if (snapshot.format !== 'v3-multi-source-job' || snapshot.version !== 1) throw new Error('不是受支持的多平台岗位快照');
if (snapshot.exampleOnly) throw new Error('示例快照禁止导入');
const registry = JSON.parse(await fs.readFile('data/v3/config/source-registry.json', 'utf8'));
const policy = JSON.parse(await fs.readFile('data/v3/config/authenticity-policy.json', 'utf8'));
const source = registry.sources.find(row => row.id === snapshot.sourcePlatform);
if (!source || !source.formalSampleAllowed) throw new Error(`来源尚未获准进入正式样本: ${snapshot.sourcePlatform}`);
if (!source.allowedCaptureMethods.includes(snapshot.captureMethod)) throw new Error(`来源不允许这种采集方式: ${snapshot.captureMethod}`);
if (snapshot.captureMethod.includes('discovery')) throw new Error('搜索索引只能写入发现队列，不能导入岗位样本层');

const authenticity = evaluateAuthenticity(snapshot, policy, source);
const job = toMultiSourceJob(snapshot, authenticity);
job.duplicateFingerprint = duplicateFingerprint(job);
const jobErrors = validateJob(job, job.status);
if (jobErrors.length) throw new Error(`岗位结构未通过校验: ${jobErrors.join('; ')}`);

const targetPath = job.status === 'verified' ? 'data/jobs/verified.json' : 'data/jobs/candidates.json';
const target = JSON.parse(await fs.readFile(targetPath, 'utf8'));
const allJobs = [
  ...JSON.parse(await fs.readFile('data/jobs/verified.json', 'utf8')),
  ...JSON.parse(await fs.readFile('data/jobs/candidates.json', 'utf8')),
];
const duplicate = allJobs.find(row => row.sourceUrl === job.sourceUrl || row.duplicateFingerprint === job.duplicateFingerprint);
if (duplicate) throw new Error(`疑似重复岗位，已存在: ${duplicate.id}`);

console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', targetPath, authenticity, job: { id: job.id, title: job.title, company: job.company, salaryText: job.salaryText } }, null, 2));
if (!apply) process.exit(0);
target.push(job);
target.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(targetPath, `${JSON.stringify(target, null, 2)}\n`);
console.log(`已导入 ${job.id}；真实性状态: ${authenticity.status}，评分: ${authenticity.score}`);
