import fs from 'node:fs/promises';
import path from 'node:path';
import { isBossJobDetailUrl, normalizeText, validateJob } from './job-data.mjs';

const [id, evidenceInput] = process.argv.slice(2);
if (!id || !evidenceInput) throw new Error('Usage: node scripts/promote-verified-job.mjs <candidate-id> <detail-snapshot>');

const root = path.resolve('data/jobs');
const candidatePath = path.join(root, 'candidates.json');
const verifiedPath = path.join(root, 'verified.json');
const candidates = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
const verified = JSON.parse(await fs.readFile(verifiedPath, 'utf8'));
const index = candidates.findIndex(row => row.id === id);
if (index < 0) throw new Error(`Candidate not found: ${id}`);

const candidate = candidates[index];
const evidenceRaw = await fs.readFile(path.resolve(evidenceInput), 'utf8');
const evidence = normalizeText(evidenceRaw);
let structuredEvidence = null;
try { structuredEvidence = JSON.parse(evidenceRaw); } catch {}
const requiredEvidence = [
  candidate.bossJobId,
  candidate.title,
  candidate.company,
  '深圳',
];
const missing = requiredEvidence.filter(value => !evidence.includes(normalizeText(value)));
if (missing.length) throw new Error(`Detail evidence does not prove: ${missing.join(', ')}`);
if (!isBossJobDetailUrl(candidate.sourceUrl)) throw new Error('Source URL is not a Boss job detail URL');
if (!candidate.sourceDiscovery) throw new Error('Candidate is missing official Boss listing evidence for salary');
if (structuredEvidence) {
  if (structuredEvidence.sourceUrl !== candidate.sourceUrl) throw new Error('Structured detail evidence URL mismatch');
  if (structuredEvidence.salaryText !== candidate.salaryText) throw new Error('Structured detail salary does not match listing salary');
}

const descriptionBlock = evidenceRaw
  .split(/- heading "职\s*位描述" \[level=3\]/)[1]
  ?.split(/- heading "(?:竞争力分析|BOSS 安全提示|公司介绍)" \[level=3\]/)[0] ?? '';
const detailRequirements = [...descriptionBlock.matchAll(/- (?:text|generic):\s*([^\r\n]+)/g)]
  .map(match => match[1].trim())
  .filter(value => value && !value.includes('登录查看完整内容'))
  .join('\n');

const promoted = {
  ...candidate,
  requirementText: structuredEvidence?.descriptionText || detailRequirements || candidate.requirementText || candidate.descriptionExcerpt,
  verifiedAt: new Date().toISOString(),
  status: 'verified',
  evidenceFile: path.basename(evidenceInput),
  salaryEvidence: structuredEvidence ? 'boss-job-detail' : 'boss-listing-linked-by-job-id',
  evidenceLevel: structuredEvidence ? 'boss-detail' : 'boss-listing-plus-detail',
};
const errors = validateJob(promoted, 'verified');
if (errors.length) throw new Error(errors.join('; '));

candidates.splice(index, 1);
verified.push(promoted);
verified.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(candidatePath, `${JSON.stringify(candidates, null, 2)}\n`);
await fs.writeFile(verifiedPath, `${JSON.stringify(verified, null, 2)}\n`);
console.log(`Promoted ${id} to verified.`);
