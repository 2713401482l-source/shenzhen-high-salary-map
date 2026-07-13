import fs from 'node:fs/promises';
import path from 'node:path';

const jobRoot = path.resolve('data/jobs');
const outputRoot = path.resolve('data/analysis');
const verified = JSON.parse(await fs.readFile(path.join(jobRoot, 'verified.json'), 'utf8'));
const candidates = JSON.parse(await fs.readFile(path.join(jobRoot, 'candidates.json'), 'utf8'));
const weights = {
  'boss-detail': 1,
  'boss-listing-plus-detail': 0.9,
  'boss-listing': 0.55,
};

const jobs = [...verified, ...candidates].map(job => ({
  ...job,
  analysisWeight: weights[job.evidenceLevel] ?? 0,
  analysisStatus: job.status === 'verified' ? 'verified' : 'listing-observed',
}));
const countBy = key => Object.fromEntries([...new Set(jobs.map(job => job[key]))].sort().map(value => [value, jobs.filter(job => job[key] === value).length]));

const snapshot = {
  generatedAt: new Date().toISOString(),
  scope: {
    city: '深圳',
    salaryBoundary: '岗位薪资上限至少触达30K/月；薪资档位按区间中位数互斥归档',
    historicalClaim: '当前公开岗位横截面，不代表历史涨跌',
  },
  evidence: {
    total: jobs.length,
    verified: verified.length,
    listingObserved: candidates.length,
    levels: countBy('evidenceLevel'),
    salaryBands: countBy('salaryBand'),
  },
  limitations: [
    'Boss安全验证限制了连续详情页核验，未核验列表样本以较低权重参与探索性分析。',
    '样本来自当前可访问的公开岗位页面，不能代表深圳全部招聘市场。',
    '样本目前偏向算法、AI及技术岗位，岗位方向结论必须展示覆盖偏差。',
  ],
  jobs,
};

await fs.mkdir(outputRoot, { recursive: true });
await fs.writeFile(path.join(outputRoot, 'market-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Analysis snapshot frozen with ${jobs.length} jobs (${verified.length} verified, ${candidates.length} listing-observed).`);
