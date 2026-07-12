import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data/jobs');
const files = ['candidates.json', 'verified.json', 'rejected.json'];
const report = {};

for (const file of files) {
  const rows = JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
  report[file.replace('.json', '')] = {
    total: rows.length,
    salaryBands: Object.fromEntries(['30K', '50K', '100K'].map(band => [band, rows.filter(row => row.salaryBand === band).length])),
    companies: new Set(rows.map(row => row.company)).size,
    industries: new Set(rows.map(row => row.industry)).size,
    districts: new Set(rows.map(row => row.district)).size,
  };
}

console.log(JSON.stringify(report, null, 2));
