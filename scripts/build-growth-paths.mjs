import fs from 'node:fs/promises';
import path from 'node:path';

const analysis = JSON.parse(await fs.readFile(path.resolve('data/analysis/market-analysis.json'), 'utf8'));
const jobs = analysis.jobs;
const bands = ['30K', '50K', '100K'];

const countValues = values => Object.entries(values.reduce((acc, value) => {
  acc[value] = (acc[value] || 0) + 1;
  return acc;
}, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
const top = (values, limit = 6) => countValues(values).slice(0, limit).map(([name, count]) => ({ name, count }));
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const paths = analysis.roleFamilies.map(family => {
  const familyJobs = jobs.filter(job => job.roleFamily === family.name);
  const stages = bands.map(band => {
    const rows = familyJobs.filter(job => job.salaryBand === band);
    return {
      band,
      count: rows.length,
      verified: rows.filter(job => job.analysisStatus === 'verified').length,
      salaryMedianMid: median(rows.map(job => job.salaryMid)),
      representativeJobs: [...rows].sort((a, b) => b.salaryMid - a.salaryMid).slice(0, 4).map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        salaryText: job.salaryText,
        evidenceLevel: job.evidenceLevel,
      })),
      topSkills: top(rows.flatMap(job => job.extractedSkills), 8),
      experience: top(rows.map(job => job.experience), 4),
      education: top(rows.map(job => job.education), 4),
      leadershipSignals: rows.filter(job => job.extractedSkills.includes('主导与决策') || job.extractedSkills.includes('团队管理')).length,
    };
  });
  const observedStages = stages.filter(stage => stage.count > 0);
  const transitions = [];
  for (let index = 0; index < stages.length - 1; index += 1) {
    const from = stages[index];
    const to = stages[index + 1];
    if (!from.count || !to.count) continue;
    const fromSkills = new Set(from.topSkills.map(item => item.name));
    const addedSkills = to.topSkills.map(item => item.name).filter(skill => !fromSkills.has(skill));
    transitions.push({
      from: from.band,
      to: to.band,
      addedSkills,
      leadershipSignalChange: Number((to.leadershipSignals / to.count - from.leadershipSignals / from.count).toFixed(2)),
      interpretation: addedSkills.length
        ? `更高档位样本新增强调：${addedSkills.slice(0, 4).join('、')}`
        : '更高档位主要体现为同类能力的经验深度、负责范围和决策责任增加。',
    });
  }
  const missingBands = stages.filter(stage => stage.count === 0).map(stage => stage.band);
  return {
    roleFamily: family.name,
    sampleCount: familyJobs.length,
    verifiedCount: familyJobs.filter(job => job.analysisStatus === 'verified').length,
    status: familyJobs.length >= 4 && observedStages.length >= 2 ? 'publishable-with-caveat' : 'observation-only',
    missingBands,
    stages,
    transitions,
    caveat: missingBands.length
      ? `当前样本未覆盖${missingBands.join('、')}阶段，不能把路线解释为必然晋升关系。`
      : '三个薪资阶段均有样本，但仍是横截面观察，不代表个人必然晋升路径。',
  };
}).sort((a, b) => b.sampleCount - a.sampleCount);

const output = {
  generatedAt: new Date().toISOString(),
  methodology: '按岗位方向比较不同薪资档的能力、经验、学历和领导责任信号；路线表示市场样本差异，不表示个人必然晋升。',
  publishablePaths: paths.filter(path => path.status === 'publishable-with-caveat').length,
  paths,
};

await fs.writeFile(path.resolve('data/analysis/growth-paths.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Built ${output.publishablePaths} publishable paths from ${paths.length} observed role families.`);
