import { jobs } from '../src/data/jobs.js';

const required = ['id','title','normalizedRole','company','salaryMin','salaryMax','salaryMid','salaryBand','district','industry','experience','education','skills','sourceUrl','capturedAt'];
const ids = new Set();
for (const job of jobs) {
  for (const key of required) if (job[key] === undefined || job[key] === '') throw new Error(`${job.id || 'unknown'} missing ${key}`);
  if (ids.has(job.id)) throw new Error(`duplicate id: ${job.id}`);
  ids.add(job.id);
  const expected = job.salaryMid < 40 ? '30K' : job.salaryMid < 75 ? '50K' : '100K';
  if (job.salaryBand !== expected) throw new Error(`${job.id} band mismatch: ${job.salaryBand} vs ${expected}`);
  if (!job.sourceUrl.startsWith('https://www.zhipin.com/')) throw new Error(`${job.id} invalid source`);
}
console.log(`Validated ${jobs.length} unique jobs.`);
