import fs from 'node:fs/promises';
import path from 'node:path';

const input = JSON.parse(await fs.readFile(path.resolve('data/analysis/market-snapshot.json'), 'utf8'));
const jobs = input.jobs;

const roleRules = [
  ['强化学习与机器人控制', /强化学习|运动控制|运控|具身|VLA|VLM|世界模型|机器人|SLAM|planning|无人机/i],
  ['AI Agent与大模型', /Agent|大模型|AI Coding|AI搜索|RAG|知识图谱/i],
  ['视觉、图像与图形', /图像|图形|视觉|几何算法|有限单元/i],
  ['语音、音频与行业信号', /语音|音频|声学|呼吸算法|BMS|信号处理/i],
  ['量化与金融AI', /量化|金融|投资|基金/i],
  ['AI工程化与部署', /部署|嵌入式|iOS|算法实现|应用开发|软件算法|java开发|测试开发/i],
  ['科研与研究岗位', /研究员|博后|博士|科研/i],
  ['用户研究与体验', /用户体验|用户研究/i],
  ['通用AI与深度学习', /AI|算法|深度学习|机器学习/i],
];

const titleRoleRules = [
  ['用户研究与体验', /用户体验|用户研究/],
  ['量化与金融AI', /量化|金融AI/],
  ['语音、音频与行业信号', /语音|音频|声学|呼吸算法|BMS|信号处理/i],
  ['视觉、图像与图形', /图像|图形|视觉|几何算法|有限单元/i],
  ['科研与研究岗位', /研究员|博后|博士/],
  ['强化学习与机器人控制', /强化学习|运动控制|运控|具身|VLA|VLM|世界模型|机器人|SLAM|planning|无人机/i],
  ['AI Agent与大模型', /Agent|大模型|AI Coding|AI搜索|RAG|知识图谱/i],
  ['AI工程化与部署', /部署|嵌入式|iOS|算法实现|软件算法|java开发|测试开发/i],
];

const skillRules = [
  ['强化学习', /强化学习/], ['机器人控制', /机器人|运动控制|运控/], ['具身智能', /具身|VLA|VLM|世界模型/],
  ['大模型', /大模型|LLM/i], ['AI Agent', /Agent/i], ['深度学习', /深度学习|CNN|RNN|DNN/],
  ['Transformer', /Transformer/i], ['计算机视觉', /计算机视觉|图像|视觉/], ['图形与几何', /图形|几何算法|有限单元/],
  ['语音与音频', /语音|音频|声学/], ['NLP', /NLP|自然语言/], ['SLAM', /SLAM/i],
  ['Python', /Python/i], ['C++', /C\+\+/], ['Java', /Java/i], ['TensorFlow/PyTorch', /TensorFlow|PyTorch/i],
  ['模型训练与调优', /训练|微调|调优|性能评估/], ['工程部署', /部署|工程化|落地/], ['嵌入式', /嵌入式|BLE/],
  ['数据与数据集', /数据集|数据处理|数据分析|数据挖掘/], ['量化研究', /量化|回测/],
  ['医疗行业经验', /医疗|医学|临床|助听器|基因/], ['金融行业经验', /金融|投资|基金|风控/],
  ['游戏行业经验', /游戏/], ['智能硬件经验', /智能硬件|消费电子|硬件/],
  ['主导与决策', /负责人|主导|专家|架构师|联创/], ['团队管理', /团队|组长|经理|管理/],
  ['用户研究', /用户体验|用户研究|用户需求/],
];

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const countValues = values => Object.entries(values.reduce((acc, value) => {
  acc[value] = (acc[value] || 0) + 1;
  return acc;
}, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
const topValues = (values, limit = 6) => countValues(values).slice(0, limit).map(([name, count]) => ({ name, count }));

const enriched = jobs.map(job => {
  const text = `${job.title}\n${job.descriptionExcerpt || ''}\n${job.requirementText || ''}\n${job.industry}`;
  // Prefer the explicit job title. Requirements often mention adjacent techniques and
  // can otherwise pull a role into the wrong family (for example an Agent role that
  // merely mentions VLM being classified as robotics).
  const roleFamily = titleRoleRules.find(([, regex]) => regex.test(job.title))?.[0]
    ?? roleRules.find(([, regex]) => regex.test(text))?.[0]
    ?? '其他新兴与稀缺岗位';
  const skills = skillRules.filter(([, regex]) => regex.test(text)).map(([name]) => name);
  return { ...job, roleFamily, extractedSkills: skills, salaryMid: (job.salaryMin + job.salaryMax) / 2 };
});

const familyNames = [...new Set(enriched.map(job => job.roleFamily))];
const roleFamilies = familyNames.map(name => {
  const rows = enriched.filter(job => job.roleFamily === name);
  const skillRows = rows.flatMap(job => job.extractedSkills);
  return {
    name,
    count: rows.length,
    weightedDemand: Number(rows.reduce((sum, job) => sum + job.analysisWeight, 0).toFixed(2)),
    evidence: {
      verified: rows.filter(job => job.analysisStatus === 'verified').length,
      listingObserved: rows.filter(job => job.analysisStatus === 'listing-observed').length,
    },
    salary: {
      medianMid: median(rows.map(job => job.salaryMid)),
      medianMin: median(rows.map(job => job.salaryMin)),
      medianMax: median(rows.map(job => job.salaryMax)),
      highestMax: Math.max(...rows.map(job => job.salaryMax)),
    },
    salaryBands: Object.fromEntries(['30K', '50K', '100K'].map(band => [band, rows.filter(job => job.salaryBand === band).length])),
    topSkills: topValues(skillRows, 8),
    topIndustries: topValues(rows.map(job => job.industry), 5),
    topDistricts: topValues(rows.map(job => job.district), 5),
    experience: topValues(rows.map(job => job.experience), 5),
    education: topValues(rows.map(job => job.education), 5),
    representativeJobs: [...rows].sort((a, b) => b.salaryMid - a.salaryMid).slice(0, 5).map(job => ({
      id: job.id, title: job.title, company: job.company, salaryText: job.salaryText, evidenceLevel: job.evidenceLevel,
    })),
  };
}).sort((a, b) => b.weightedDemand - a.weightedDemand || b.salary.medianMid - a.salary.medianMid);

const skillStats = skillRules.map(([skill]) => {
  const rows = enriched.filter(job => job.extractedSkills.includes(skill));
  return {
    skill,
    count: rows.length,
    weightedCount: Number(rows.reduce((sum, job) => sum + job.analysisWeight, 0).toFixed(2)),
    salaryMedianMid: median(rows.map(job => job.salaryMid)),
    bands: Object.fromEntries(['30K', '50K', '100K'].map(band => [band, rows.filter(job => job.salaryBand === band).length])),
  };
}).filter(row => row.count > 0).sort((a, b) => b.weightedCount - a.weightedCount);

const pairs = new Map();
for (const job of enriched) {
  for (let i = 0; i < job.extractedSkills.length; i += 1) {
    for (let j = i + 1; j < job.extractedSkills.length; j += 1) {
      const key = [job.extractedSkills[i], job.extractedSkills[j]].sort().join(' + ');
      pairs.set(key, (pairs.get(key) || 0) + job.analysisWeight);
    }
  }
}
const skillCooccurrence = [...pairs.entries()]
  .map(([pair, weightedCount]) => ({ pair, weightedCount: Number(weightedCount.toFixed(2)) }))
  .sort((a, b) => b.weightedCount - a.weightedCount)
  .slice(0, 30);

const companyCounts = countValues(enriched.map(job => job.company));
const expansionSignals = companyCounts.filter(([, count]) => count >= 2).map(([company, count]) => ({
  company,
  count,
  jobs: enriched.filter(job => job.company === company).map(job => job.title),
}));

const bandComparison = ['30K', '50K', '100K'].map(band => {
  const rows = enriched.filter(job => job.salaryBand === band);
  return {
    band,
    count: rows.length,
    verified: rows.filter(job => job.analysisStatus === 'verified').length,
    salaryMedianMid: median(rows.map(job => job.salaryMid)),
    topSkills: topValues(rows.flatMap(job => job.extractedSkills), 10),
    experience: topValues(rows.map(job => job.experience), 5),
    education: topValues(rows.map(job => job.education), 5),
  };
});

const analysis = {
  generatedAt: new Date().toISOString(),
  scope: input.scope,
  evidence: input.evidence,
  limitations: input.limitations,
  coverageWarning: '样本明显偏向AI、算法、机器人和技术研发岗位；本结果是可访问Boss高薪技术样本的截面，不是深圳全行业普查。',
  headlineMetrics: {
    jobs: enriched.length,
    companies: new Set(enriched.map(job => job.company)).size,
    industries: new Set(enriched.map(job => job.industry)).size,
    districts: new Set(enriched.map(job => job.district)).size,
    roleFamilies: roleFamilies.length,
    skills: skillStats.length,
  },
  roleFamilies,
  skillStats,
  skillCooccurrence,
  expansionSignals,
  bandComparison,
  jobs: enriched,
};

await fs.writeFile(path.resolve('data/analysis/market-analysis.json'), `${JSON.stringify(analysis, null, 2)}\n`);
console.log(`Analyzed ${enriched.length} jobs into ${roleFamilies.length} observed role families and ${skillStats.length} skills.`);
