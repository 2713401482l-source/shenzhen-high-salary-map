import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data/jobs');
for (const file of ['candidates.json', 'verified.json', 'rejected.json']) {
  const filePath = path.join(root, file);
  const rows = JSON.parse(await fs.readFile(filePath, 'utf8'));
  for (const row of rows) {
    if (file === 'verified.json') {
      row.evidenceLevel = row.salaryEvidence === 'boss-job-detail' ? 'boss-detail' : 'boss-listing-plus-detail';
    } else {
      row.evidenceLevel = 'boss-listing';
    }
  }
  await fs.writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`);
}
console.log('Evidence levels backfilled.');
