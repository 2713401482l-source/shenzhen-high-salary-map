import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data/jobs');
const candidatePath = path.join(root, 'candidates.json');
const rejectedPath = path.join(root, 'rejected.json');
const candidates = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
const rejected = JSON.parse(await fs.readFile(rejectedPath, 'utf8'));
const keep = [];
let count = 0;

for (const candidate of candidates) {
  if (candidate.salaryMax < 30) {
    rejected.push({
      ...candidate,
      status: 'rejected',
      rejectionReason: '薪资上限未触达约30K，不符合高薪样本边界',
      rejectedAt: new Date().toISOString(),
    });
    count += 1;
  } else {
    keep.push(candidate);
  }
}

rejected.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(candidatePath, `${JSON.stringify(keep, null, 2)}\n`);
await fs.writeFile(rejectedPath, `${JSON.stringify(rejected, null, 2)}\n`);
console.log(`Rejected ${count} candidates below the approximately 30K boundary.`);
