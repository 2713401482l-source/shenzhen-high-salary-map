import fs from 'node:fs/promises';
import path from 'node:path';

const [id, ...reasonParts] = process.argv.slice(2);
const rejectionReason = reasonParts.join(' ').trim();
if (!id || !rejectionReason) throw new Error('Usage: node scripts/reject-candidate.mjs <candidate-id> <reason>');

const root = path.resolve('data/jobs');
const candidatePath = path.join(root, 'candidates.json');
const rejectedPath = path.join(root, 'rejected.json');
const candidates = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
const rejected = JSON.parse(await fs.readFile(rejectedPath, 'utf8'));
const index = candidates.findIndex(row => row.id === id);
if (index < 0) throw new Error(`Candidate not found: ${id}`);

const [candidate] = candidates.splice(index, 1);
rejected.push({
  ...candidate,
  status: 'rejected',
  rejectionReason,
  rejectedAt: new Date().toISOString(),
});
rejected.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(candidatePath, `${JSON.stringify(candidates, null, 2)}\n`);
await fs.writeFile(rejectedPath, `${JSON.stringify(rejected, null, 2)}\n`);
console.log(`Rejected ${id}: ${rejectionReason}`);
