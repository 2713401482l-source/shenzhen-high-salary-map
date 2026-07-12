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
const evidence = normalizeText(await fs.readFile(path.resolve(evidenceInput), 'utf8'));
const requiredEvidence = [
  candidate.bossJobId,
  candidate.title,
  candidate.company,
  candidate.salaryText,
  '深圳',
];
const missing = requiredEvidence.filter(value => !evidence.includes(normalizeText(value)));
if (missing.length) throw new Error(`Detail evidence does not prove: ${missing.join(', ')}`);
if (!isBossJobDetailUrl(candidate.sourceUrl)) throw new Error('Source URL is not a Boss job detail URL');

const promoted = {
  ...candidate,
  requirementText: candidate.requirementText || candidate.descriptionExcerpt,
  verifiedAt: new Date().toISOString(),
  status: 'verified',
  evidenceFile: path.basename(evidenceInput),
};
const errors = validateJob(promoted, 'verified');
if (errors.length) throw new Error(errors.join('; '));

candidates.splice(index, 1);
verified.push(promoted);
verified.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(candidatePath, `${JSON.stringify(candidates, null, 2)}\n`);
await fs.writeFile(verifiedPath, `${JSON.stringify(verified, null, 2)}\n`);
console.log(`Promoted ${id} to verified.`);
