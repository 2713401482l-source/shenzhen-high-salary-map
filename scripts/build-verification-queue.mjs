import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data/jobs');
const candidates = JSON.parse(await fs.readFile(path.join(root, 'candidates.json'), 'utf8'));
const verified = JSON.parse(await fs.readFile(path.join(root, 'verified.json'), 'utf8'));
const rejected = JSON.parse(await fs.readFile(path.join(root, 'rejected.json'), 'utf8'));
const completed = new Set([...verified, ...rejected].map(row => row.id));
const verifiedCounts = Object.fromEntries(['30K', '50K', '100K'].map(band => [band, verified.filter(row => row.salaryBand === band).length]));

const completeness = job => [
  job.company, job.salaryText, job.addressText, job.industry,
  job.experience, job.education, job.descriptionExcerpt,
].filter(value => value && value !== '待核验').length;

const queue = candidates
  .filter(job => !completed.has(job.id))
  .map(job => ({
    id: job.id,
    sourceUrl: job.sourceUrl,
    title: job.title,
    company: job.company,
    salaryText: job.salaryText,
    salaryBand: job.salaryBand,
    industry: job.industry,
    district: job.district,
    priorityScore:
      (100 - verifiedCounts[job.salaryBand]) * 10 +
      completeness(job) * 5 +
      (job.salaryBand === '100K' ? 100 : 0),
  }))
  .sort((a, b) => b.priorityScore - a.priorityScore || a.id.localeCompare(b.id));

await fs.writeFile(path.join(root, 'verification-queue.json'), `${JSON.stringify(queue, null, 2)}\n`);
console.log(`Verification queue: ${queue.length} jobs.`);
console.log(`Top priorities: ${queue.slice(0, 5).map(row => `${row.salaryBand} ${row.title}`).join(' | ')}`);
