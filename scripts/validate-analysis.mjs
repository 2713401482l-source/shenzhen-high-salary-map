import fs from 'node:fs/promises';
import path from 'node:path';

const read = async file => JSON.parse(await fs.readFile(path.resolve(file), 'utf8'));
const snapshot = await read('data/analysis/market-snapshot.json');
const analysis = await read('data/analysis/market-analysis.json');
const growth = await read('data/analysis/growth-paths.json');

const failures = [];
const checks = [];
const check = (name, condition, detail) => {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) failures.push(`${name}: ${detail}`);
};

const jobs = snapshot.jobs;
const analyzedJobs = analysis.jobs;
const expectedBands = Object.fromEntries(['30K', '50K', '100K'].map(band => [band, jobs.filter(job => job.salaryBand === band).length]));
const actualBands = Object.fromEntries(analysis.bandComparison.map(row => [row.band, row.count]));
const familyTotal = analysis.roleFamilies.reduce((sum, family) => sum + family.count, 0);
const weightedTotal = jobs.reduce((sum, job) => sum + job.analysisWeight, 0);
const familyWeightedTotal = analysis.roleFamilies.reduce((sum, family) => sum + family.weightedDemand, 0);

check('snapshot total', jobs.length === snapshot.evidence.total, `${jobs.length} vs ${snapshot.evidence.total}`);
check('analysis total', analyzedJobs.length === jobs.length, `${analyzedJobs.length} vs ${jobs.length}`);
check('family partition', familyTotal === jobs.length, `${familyTotal} vs ${jobs.length}`);
check('salary bands', JSON.stringify(actualBands) === JSON.stringify(expectedBands), `${JSON.stringify(actualBands)} vs ${JSON.stringify(expectedBands)}`);
check('analysis weight conservation', Math.abs(weightedTotal - familyWeightedTotal) < 0.02, `${weightedTotal.toFixed(2)} vs ${familyWeightedTotal.toFixed(2)}`);
check('unique job ids', new Set(analyzedJobs.map(job => job.id)).size === analyzedJobs.length, 'duplicate analyzed job id');
check('salary midpoint', analyzedJobs.every(job => job.salaryMid === (job.salaryMin + job.salaryMax) / 2), 'one or more midpoint mismatches');
check('salary boundary', analyzedJobs.every(job => job.salaryMax >= 30), 'job below 30K reach boundary');
check('direct Boss URLs', analyzedJobs.every(job => /^https:\/\/www\.zhipin\.com\/job_detail\/.+\.html/.test(job.sourceUrl)), 'one or more non-detail URLs');
check('growth family coverage', growth.paths.length === analysis.roleFamilies.length, `${growth.paths.length} vs ${analysis.roleFamilies.length}`);
check('no historical claim', analysis.scope.historicalClaim.includes('不代表历史涨跌'), analysis.scope.historicalClaim);

const lowEvidenceShare = jobs.filter(job => job.evidenceLevel === 'boss-listing').length / jobs.length;
const report = `# 分析验证报告\n\n` +
  `验证基准：${analysis.generatedAt}\n\n` +
  `结论：${failures.length ? '**暂不可发布**' : '**可带明确限制发布（Share with caveats）**'}。` +
  `当前 ${jobs.length} 条样本中，${snapshot.evidence.verified} 条达到详情页核验，` +
  `${snapshot.evidence.listingObserved} 条为 Boss 列表页观察；低证据样本占 ${(lowEvidenceShare * 100).toFixed(1)}%。` +
  `网站必须持续显示证据结构和“高薪技术样本、非深圳全行业普查”的边界。\n\n` +
  `## 自动复核\n\n` +
  checks.map(item => `- ${item.passed ? '通过' : '失败'}：${item.name}（${item.detail}）`).join('\n') +
  `\n\n## 发布限制\n\n` +
  `- 不使用“上涨、下降、增长趋势”等历史变化措辞；这里只能描述当前岗位截面。\n` +
  `- 30K / 50K / 100K 是按薪资区间中位数划分的统计档，不替代 Boss 原始薪资。\n` +
  `- 岗位族群和技能标签由规则抽取，适合发现方向，不等同于人工逐字编码。\n` +
  `- 100K 档仅 7 条，任何排序和成长路径都必须标注小样本。\n`;

await fs.writeFile(path.resolve('data/analysis/validation-report.md'), report);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Analysis validation passed with caveats: ${checks.length} checks, ${jobs.length} jobs.`);
