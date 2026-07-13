import verifiedSource from '../../data/jobs/verified.json';
import candidateSource from '../../data/jobs/candidates.json';
import demoSource from '../../data/v3/demo/page-logic-demo.json';

export type SalaryBand = '30K' | '50K' | '100K';
export type EvidenceLevel = 'boss-detail' | 'boss-listing-plus-detail' | 'boss-listing';

export type Job = {
  id: string;
  bossJobId: string;
  title: string;
  company: string;
  salaryText: string;
  salaryMin: number;
  salaryMax: number;
  salaryMonths?: number;
  salaryBand: SalaryBand;
  city: string;
  district: string;
  addressText: string;
  industry: string;
  experience: string;
  education: string;
  descriptionExcerpt: string;
  requirementText: string;
  sourceUrl: string;
  capturedAt: string;
  evidenceLevel: EvidenceLevel;
  status: 'verified' | 'candidate';
};

export type DemoRole = (typeof demoSource.roleSignals)[number];
export type DemoGrowthPath = (typeof demoSource.growthPaths)[number];

const normalizeJob = (job: (typeof verifiedSource)[number] | (typeof candidateSource)[number]): Job => ({
  ...job,
  salaryBand: job.salaryBand as SalaryBand,
  evidenceLevel: job.evidenceLevel as EvidenceLevel,
  status: job.status as 'verified' | 'candidate',
  requirementText: job.requirementText ?? '',
  capturedAt: job.capturedAt,
});

export const verifiedJobs = verifiedSource.map(normalizeJob);
export const candidateJobs = candidateSource.map(normalizeJob);
export const realJobs = [...verifiedJobs, ...candidateJobs];
export const demoData = demoSource;

export const capturedAt = realJobs
  .map(job => job.capturedAt)
  .sort()
  .at(-1) ?? '2026-07-12';

export const realEvidence = {
  total: realJobs.length,
  verified: verifiedJobs.length,
  listingObserved: candidateJobs.length,
  companies: new Set(realJobs.map(job => job.company)).size,
};

const familyRules: Array<{name: string; pattern: RegExp}> = [
  {name: '机器人与强化学习', pattern: /强化学习|机器人|具身|运动控制|运控/i},
  {name: '语音与音频', pattern: /语音|音频|声学|听器/i},
  {name: '计算机视觉', pattern: /图像|视觉|CV|ISP|多模态|图形算法/i},
  {name: '量化与金融 AI', pattern: /量化|金融|投研|交易/i},
  {name: '搜索推荐与商业化', pattern: /推荐|搜索|广告|商业化/i},
  {name: 'AI 产品与应用', pattern: /产品|Agent|大模型|AI应用|人工智能应用/i},
  {name: '通用 AI 与深度学习', pattern: /AI|ai|算法|深度学习|机器学习|NLP/i},
  {name: '用户与增长研究', pattern: /用户|增长|运营|市场/i},
];

export function getRoleFamily(job: Pick<Job, 'title' | 'descriptionExcerpt'>) {
  const haystack = `${job.title} ${job.descriptionExcerpt}`;
  return familyRules.find(rule => rule.pattern.test(haystack))?.name ?? '技术与专业岗位';
}

export type RealRoleFamily = {
  name: string;
  count: number;
  companies: number;
  salaryMin: number;
  salaryMax: number;
  salaryMedianMid: number;
  verified: number;
  jobs: Job[];
};

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export const realRoleFamilies: RealRoleFamily[] = Object.entries(
  realJobs.reduce<Record<string, Job[]>>((groups, job) => {
    const family = getRoleFamily(job);
    groups[family] = [...(groups[family] ?? []), job];
    return groups;
  }, {}),
).map(([name, jobs]) => ({
  name,
  count: jobs.length,
  companies: new Set(jobs.map(job => job.company)).size,
  salaryMin: Math.min(...jobs.map(job => job.salaryMin)),
  salaryMax: Math.max(...jobs.map(job => job.salaryMax)),
  salaryMedianMid: median(jobs.map(job => (job.salaryMin + job.salaryMax) / 2)),
  verified: jobs.filter(job => job.status === 'verified').length,
  jobs,
})).sort((a, b) => b.count - a.count);

const skillRules: Array<{name: string; pattern: RegExp}> = [
  {name: 'Python', pattern: /Python/i},
  {name: 'C++', pattern: /C\+\+/i},
  {name: '深度学习', pattern: /深度学习|TensorFlow|PyTorch|CNN|RNN|DNN/i},
  {name: '大模型与 Agent', pattern: /大模型|Agent|MCP|Function.?Calling|ReAct|CoT/i},
  {name: '强化学习', pattern: /强化学习|PPO|SAC|DDPG|DQN|GRPO|DPO/i},
  {name: '工程部署', pattern: /部署|算力|延迟|功耗|性能优化|工程化/i},
  {name: '数据与评测', pattern: /数据集|数据分析|评测|指标|实验/i},
  {name: '行业经验', pattern: /行业|医疗|金融|硬件|机器人|消费电子/i},
  {name: '跨团队协作', pattern: /协同|跨团队|对接业务|推动|项目/i},
  {name: '团队与路线责任', pattern: /主导|负责人|团队管理|技术路线|战略/i},
  {name: '语音与信号处理', pattern: /语音|音频|声学|信号处理|FFT/i},
  {name: '计算机视觉', pattern: /计算机视觉|图像|CV|多模态|ISP/i},
];

export type SkillStat = {name: string; count: number; jobs: Job[]};

export const verifiedSkillStats: SkillStat[] = skillRules.map(rule => {
  const jobs = verifiedJobs.filter(job => rule.pattern.test(`${job.title} ${job.requirementText} ${job.descriptionExcerpt}`));
  return {name: rule.name, count: jobs.length, jobs};
}).filter(skill => skill.count > 0).sort((a, b) => b.count - a.count);

export const verifiedSkillPairs = verifiedSkillStats.flatMap((left, leftIndex) =>
  verifiedSkillStats.slice(leftIndex + 1).map(right => ({
    pair: [left.name, right.name] as [string, string],
    count: verifiedJobs.filter(job => {
      const text = `${job.title} ${job.requirementText} ${job.descriptionExcerpt}`;
      const leftRule = skillRules.find(rule => rule.name === left.name)!;
      const rightRule = skillRules.find(rule => rule.name === right.name)!;
      return leftRule.pattern.test(text) && rightRule.pattern.test(text);
    }).length,
  })),
).filter(pair => pair.count > 0).sort((a, b) => b.count - a.count);

export const districtOptions = [...new Set(realJobs.map(job => job.district))].filter(Boolean).sort();
export const industryOptions = [...new Set(realJobs.map(job => job.industry))].filter(Boolean).sort();

export function salaryBandFromMid(job: Pick<Job, 'salaryMin' | 'salaryMax'>): SalaryBand {
  const middle = (job.salaryMin + job.salaryMax) / 2;
  if (middle < 40) return '30K';
  if (middle < 75) return '50K';
  return '100K';
}
