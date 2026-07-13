import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const readJson = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const [verified, candidates, taxonomy] = await Promise.all([
  readJson('data/jobs/verified.json'),
  readJson('data/jobs/candidates.json'),
  readJson('data/v3/config/taxonomy.json'),
]);

const jobs = [...verified, ...candidates];
const detailJobs = jobs.filter(job => job.status === 'verified' && job.requirementText?.trim());
const regex = value => new RegExp(value, 'i');
const roleRules = taxonomy.roleRules.map(rule => ({...rule, regex: regex(rule.pattern)}));
const skillRules = taxonomy.skillRules.map(rule => ({...rule, regex: regex(rule.pattern)}));
const salaryBands = ['30K', '50K', '100K'];

const median = values => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const countBy = values => Object.entries(values.reduce((result, value) => {
  const key = value || '未标明';
  result[key] = (result[key] ?? 0) + 1;
  return result;
}, {})).map(([name, count]) => ({name, count})).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));

const roleFor = job => roleRules.find(rule => rule.regex.test(`${job.title}\n${job.descriptionExcerpt ?? ''}`))?.name ?? '其他专业岗位';
const skillsFor = job => {
  const text = `${job.title}\n${job.requirementText ?? ''}\n${job.descriptionExcerpt ?? ''}`;
  return skillRules.filter(rule => rule.regex.test(text)).map(rule => rule.name);
};
const evidenceJob = job => ({
  id: job.id,
  title: job.title,
  company: job.company,
  salaryText: job.salaryText,
  sourceUrl: job.sourceUrl,
  capturedAt: job.capturedAt,
  evidenceLevel: job.evidenceLevel,
});

const enriched = jobs.map(job => ({
  ...job,
  normalizedRole: roleFor(job),
  salaryMid: (job.salaryMin + job.salaryMax) / 2,
  skills: job.status === 'verified' ? skillsFor(job) : [],
}));

const roleNames = [...new Set(enriched.map(job => job.normalizedRole))];
const roleSignals = roleNames.map(name => {
  const rows = enriched.filter(job => job.normalizedRole === name);
  const detailRows = rows.filter(job => job.status === 'verified');
  const companies = new Set(rows.map(job => job.company));
  const industries = new Set(rows.map(job => job.industry));
  const emergingKeyword = /Agent|大模型|强化学习|具身|VLA|VLM|世界模型/i.test(rows.map(job => job.title).join(' '));
  const qualifies = rows.length >= 3 && companies.size >= 2 && detailRows.length >= 1;
  return {
    name,
    status: qualifies && emergingKeyword ? 'emerging' : rows.length <= 2 ? 'early-signal' : 'observed-family',
    sampleCount: rows.length,
    companyCount: companies.size,
    industryCount: industries.size,
    detailCount: detailRows.length,
    salary: {
      min: Math.min(...rows.map(job => job.salaryMin)),
      max: Math.max(...rows.map(job => job.salaryMax)),
      medianMid: median(rows.map(job => job.salaryMid)),
      bands: Object.fromEntries(salaryBands.map(band => [band, rows.filter(job => job.salaryBand === band).length])),
    },
    originalTitles: [...new Set(rows.map(job => job.title))],
    topIndustries: countBy(rows.map(job => job.industry)).slice(0, 5),
    topDistricts: countBy(rows.map(job => job.district)).slice(0, 5),
    evidenceJobs: rows.sort((a, b) => b.salaryMid - a.salaryMid).map(evidenceJob),
  };
}).sort((a, b) => b.sampleCount - a.sampleCount || b.salary.medianMid - a.salary.medianMid);

const skillStats = skillRules.map(rule => {
  const rows = detailJobs.filter(job => rule.regex.test(`${job.title}\n${job.requirementText}\n${job.descriptionExcerpt ?? ''}`));
  return {
    name: rule.name,
    category: rule.category,
    count: rows.length,
    denominator: detailJobs.length,
    frequency: detailJobs.length ? Number((rows.length / detailJobs.length).toFixed(3)) : 0,
    salaryBands: Object.fromEntries(salaryBands.map(band => [band, rows.filter(job => job.salaryBand === band).length])),
    evidenceJobs: rows.map(evidenceJob),
  };
}).filter(item => item.count > 0).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));

const pairCounts = new Map();
for (const job of detailJobs) {
  const skills = skillsFor(job).sort();
  for (let left = 0; left < skills.length; left += 1) {
    for (let right = left + 1; right < skills.length; right += 1) {
      const key = `${skills[left]} + ${skills[right]}`;
      const value = pairCounts.get(key) ?? {count: 0, jobs: []};
      value.count += 1;
      value.jobs.push(job);
      pairCounts.set(key, value);
    }
  }
}
const skillPairs = [...pairCounts.entries()].map(([pair, value]) => ({
  pair,
  count: value.count,
  denominator: detailJobs.length,
  publishable: value.count >= 3,
  evidenceJobs: value.jobs.map(evidenceJob),
})).sort((a, b) => b.count - a.count || a.pair.localeCompare(b.pair, 'zh-CN'));

const companyGroups = Object.groupBy(enriched, job => job.company);
const expansionSignals = Object.entries(companyGroups).filter(([, rows]) => rows.length >= 2).map(([company, rows]) => ({
  company,
  status: 'same-snapshot-cluster',
  jobCount: rows.length,
  distinctTitles: [...new Set(rows.map(job => job.title))].length,
  capturedDates: [...new Set(rows.map(job => job.capturedAt.slice(0, 10)))],
  evidenceJobs: rows.map(evidenceJob),
})).sort((a, b) => b.jobCount - a.jobCount || a.company.localeCompare(b.company, 'zh-CN'));

const captureDates = [...new Set(enriched.map(job => job.capturedAt.slice(0, 10)))].sort();
const benchmarkCandidates = roleSignals.map(role => ({
  role: role.name,
  detailCount: role.detailCount,
  companyCount: new Set(role.evidenceJobs.filter(job => job.evidenceLevel !== 'boss-listing').map(job => job.company)).size,
  salaryBandCount: Object.values(role.salary.bands).filter(Boolean).length,
})).sort((a, b) => b.detailCount - a.detailCount || b.companyCount - a.companyCount);

const output = {
  metadata: {
    dataKind: 'real-analysis',
    generatedFromLatestCapture: enriched.map(job => job.capturedAt).sort().at(-1),
    sourceFiles: ['data/jobs/verified.json', 'data/jobs/candidates.json'],
    methodologyVersion: 'v3.1',
  },
  readiness: {
    discovery: {actual: enriched.length, target: 300, pass: enriched.length >= 300},
    detailEvidence: {actual: detailJobs.length, target: 150, pass: detailJobs.length >= 150},
    emergingRoles: {actual: roleSignals.filter(role => role.status === 'emerging').length, target: 30, pass: roleSignals.filter(role => role.status === 'emerging').length >= 30},
    benchmark: {best: benchmarkCandidates[0] ?? null, target: 50, pass: (benchmarkCandidates[0]?.detailCount ?? 0) >= 50},
    timeSeries: {actualDates: captureDates.length, targetDates: 2, pass: captureDates.length >= 2},
  },
  scope: {
    city: '深圳',
    jobs: enriched.length,
    detailJobs: detailJobs.length,
    companies: new Set(enriched.map(job => job.company)).size,
    industries: new Set(enriched.map(job => job.industry)).size,
    capturedDates: captureDates,
    warning: '当前样本明显偏 AI、算法、机器人和技术研发岗位，不代表深圳全行业高薪市场。',
  },
  roleSignals,
  skills: {denominator: detailJobs.length, stats: skillStats, pairs: skillPairs},
  expansionSignals,
  salaryBands: salaryBands.map(band => {
    const rows = enriched.filter(job => job.salaryBand === band);
    return {band, count: rows.length, detailCount: rows.filter(job => job.status === 'verified').length, medianMid: median(rows.map(job => job.salaryMid))};
  }),
  marketProfile: {
    denominator: enriched.length,
    salaryBands: salaryBands.map(name => ({name, count: enriched.filter(job => job.salaryBand === name).length})),
    industries: countBy(enriched.map(job => job.industry)),
    districts: countBy(enriched.map(job => job.district)),
    experience: countBy(enriched.map(job => job.experience)),
    education: countBy(enriched.map(job => job.education)),
    statement: '这是当前真实样本的内部结构，不代表 Boss 深圳全量岗位分布。',
  },
  benchmarkCandidates,
  timeSeries: {
    available: captureDates.length >= 2,
    dates: captureDates,
    statement: captureDates.length >= 2 ? '已具备跨日期岗位快照，可开始做同岗可比变化。' : '只有一个采集日期，不能判断薪资上涨、下降或持续扩招。',
  },
};

const outputDir = path.join(root, 'data/v3/analysis');
await fs.mkdir(outputDir, {recursive: true});
await fs.writeFile(path.join(outputDir, 'real-analysis.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Built V3 real analysis from ${enriched.length} jobs and ${detailJobs.length} detail records.`);
console.log(`Formal emerging signals: ${output.readiness.emergingRoles.actual}; best benchmark corpus: ${output.readiness.benchmark.best?.detailCount ?? 0}/50.`);
