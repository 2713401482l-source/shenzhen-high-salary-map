import fs from 'node:fs/promises';
import path from 'node:path';
import { validateJob } from './job-data.mjs';

const [id, evidenceInput] = process.argv.slice(2);
if (!id || !evidenceInput) throw new Error('Usage: node scripts/refresh-verified-evidence.mjs <verified-id> <structured-evidence-json>');

const verifiedPath = path.resolve('data/jobs/verified.json');
const verified = JSON.parse(await fs.readFile(verifiedPath, 'utf8'));
const index = verified.findIndex(row => row.id === id);
if (index < 0) throw new Error(`Verified job not found: ${id}`);
const evidence = JSON.parse(await fs.readFile(path.resolve(evidenceInput), 'utf8'));
const job = verified[index];
if (evidence.sourceUrl !== job.sourceUrl) throw new Error('Evidence URL mismatch');
if (evidence.jobId !== job.bossJobId) throw new Error('Evidence job ID mismatch');
if (evidence.jobTitle !== job.title) throw new Error('Evidence title mismatch');
if (evidence.company !== job.company) throw new Error('Evidence company mismatch');
if (evidence.salaryText !== job.salaryText) throw new Error('Evidence salary mismatch');

verified[index] = {
  ...job,
  requirementText: evidence.descriptionText || job.requirementText,
  addressText: evidence.workAddress || job.addressText,
  publishedAt: evidence.pageUpdatedAt || job.publishedAt,
  evidenceFile: path.basename(evidenceInput),
  salaryEvidence: 'boss-job-detail',
  evidenceLevel: 'boss-detail',
  verifiedAt: evidence.capturedAt || new Date().toISOString(),
};
const errors = validateJob(verified[index], 'verified');
if (errors.length) throw new Error(errors.join('; '));
await fs.writeFile(verifiedPath, `${JSON.stringify(verified, null, 2)}\n`);
console.log(`Refreshed verified evidence for ${id}.`);
