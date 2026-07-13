import fs from 'node:fs/promises';
import path from 'node:path';
import { validateJob } from './job-data.mjs';

const root = path.resolve('data/jobs');
const layers = [
  ['candidates.json', 'candidate'],
  ['verified.json', 'verified'],
  ['rejected.json', 'rejected'],
];
const allIds = new Map();
const allFingerprints = new Map();
let failures = 0;

for (const [file, status] of layers) {
  const records = JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
  if (!Array.isArray(records)) throw new Error(`${file} must contain an array`);
  const bandCounts = { '30K': 0, '50K': 0, '100K': 0 };
  for (const job of records) {
    bandCounts[job.salaryBand] = (bandCounts[job.salaryBand] || 0) + 1;
    const errors = validateJob(job, status);
    if (allIds.has(job.id)) errors.push(`duplicate id also in ${allIds.get(job.id)}`);
    if (status !== 'rejected' && allFingerprints.has(job.duplicateFingerprint)) errors.push(`duplicate fingerprint also in ${allFingerprints.get(job.duplicateFingerprint)}`);
    allIds.set(job.id, file);
    if (status !== 'rejected') allFingerprints.set(job.duplicateFingerprint, file);
    if (errors.length) {
      failures += 1;
      console.error(`${file}:${job.id || 'unknown'} — ${errors.join('; ')}`);
    }
  }
  console.log(`${file}: ${records.length} records | 30K ${bandCounts['30K']} | 50K ${bandCounts['50K']} | 100K ${bandCounts['100K']}`);
}

if (failures) throw new Error(`${failures} invalid record(s)`);
console.log('All job data layers are valid.');
