import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data');
const v2Root = path.join(root, 'jobs');
const v3Root = path.join(root, 'v3');
const docsRoot = path.resolve('docs/v3');

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const candidates = await readJson(path.join(v2Root, 'candidates.json'));
const verified = await readJson(path.join(v2Root, 'verified.json'));
const rejected = await readJson(path.join(v2Root, 'rejected.json'));
const plan = await readJson(path.join(v3Root, 'config/collection-plan.json'));
const usable = [...verified, ...candidates];
let observationBatches = [];
try {
  const files = (await fs.readdir(path.join(v3Root, 'observations'))).filter(file => file.endsWith('.json'));
  observationBatches = await Promise.all(files.map(file => readJson(path.join(v3Root, 'observations', file))));
} catch {}
const observationsByQuery = new Map(observationBatches.map(batch => [batch.queryId, batch]));

const countBy = (rows, getter) => Object.fromEntries(
  [...rows.reduce((map, row) => {
    const key = getter(row) || '未标注';
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map()).entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'zh-CN')),
);

const normalizeTitle = value => String(value || '')
  .normalize('NFKC')
  .replace(/[【】()[\]（）]/g, ' ')
  .replace(/深圳|急招|高薪|资深|高级|专家|负责人|经理/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const exactDuplicates = usable.length - new Set(usable.map(row => row.id)).size;
const urlDuplicates = usable.length - new Set(usable.map(row => row.sourceUrl)).size;
const fingerprints = countBy(usable, row => row.duplicateFingerprint);
const fingerprintDuplicateGroups = Object.values(fingerprints).filter(count => count > 1).length;
const fullRequirementRows = usable.filter(row => String(row.requirementText || '').trim().length >= 80);
const captureDates = countBy(usable, row => String(row.capturedAt || '').slice(0, 10));
const evidenceLevels = countBy(usable, row => row.evidenceLevel);
const salaryBands = countBy(usable, row => row.salaryBand);
const normalizedTitleCounts = countBy(usable, row => normalizeTitle(row.title));
const strongestExactTitle = Object.entries(normalizedTitleCounts)[0] || ['无', 0];
const repeatedCompanies = Object.entries(countBy(usable, row => row.company))
  .filter(([, count]) => count >= 2)
  .map(([company, count]) => ({ company, count }));

const queryQueue = plan.lanes.flatMap(lane => lane.queries.map((query, index) => {
  const id = `${lane.id}-${String(index + 1).padStart(2, '0')}`;
  const observed = observationsByQuery.get(id);
  return {
    id,
    laneId: lane.id,
    laneLabel: lane.label,
    query,
    city: plan.city,
    targetLaneSamples: lane.target,
    searchUrl: `https://www.zhipin.com/c${plan.bossCityCode}/?query=${encodeURIComponent(query)}&industry=&position=`,
    status: observed ? (observed.accessState?.salaryVisible ? 'collected' : 'blocked-salary-auth') : 'queued',
    attempts: observed ? 1 : 0,
    discoveredJobs: observed?.observations?.length ?? 0,
    lastAttemptAt: observed?.capturedAt ?? null,
    blocker: observed?.accessState?.blocker ?? null
  };
}));

const baseline = {
  generatedAt: new Date().toISOString(),
  intendedUse: 'V3 新兴岗位发现、岗位要求拆解、单岗精准对标、扩招与薪资快照分析',
  grain: '一条记录代表一个 Boss 岗位在 V2 当前快照中的最新观察；V3 将改为同一岗位跨日期追加 observation',
  totals: {
    usableJobs: usable.length,
    verifiedDetailJobs: verified.length,
    listingOnlyJobs: candidates.length,
    rejectedJobs: rejected.length,
    fullRequirementJobs: fullRequirementRows.length,
    uniqueCompanies: new Set(usable.map(row => row.company)).size,
    uniqueRawTitles: new Set(usable.map(row => row.title)).size,
    captureDates: Object.keys(captureDates).length
  },
  distributions: {
    salaryBands,
    evidenceLevels,
    captureDates,
    industries: countBy(usable, row => row.industry),
    districts: countBy(usable, row => row.district)
  },
  integrity: {
    exactIdDuplicates: exactDuplicates,
    sourceUrlDuplicates: urlDuplicates,
    duplicateFingerprintGroups: fingerprintDuplicateGroups
  },
  expansionCandidates: repeatedCompanies,
  benchmarkReadiness: {
    strongestNormalizedTitle: strongestExactTitle[0],
    strongestNormalizedTitleCount: strongestExactTitle[1],
    requiredDetailCount: plan.benchmarkRoleDetailTarget,
    ready: strongestExactTitle[1] >= plan.benchmarkRoleDetailTarget && fullRequirementRows.length >= plan.benchmarkRoleDetailTarget
  },
  gates: {
    discoveryPool: { current: usable.length, required: plan.discoveryTarget, passed: usable.length >= plan.discoveryTarget },
    verifiedDetails: { current: verified.length, required: plan.verifiedDetailTarget, passed: verified.length >= plan.verifiedDetailTarget },
    benchmarkRole: { current: strongestExactTitle[1], required: plan.benchmarkRoleDetailTarget, passed: strongestExactTitle[1] >= plan.benchmarkRoleDetailTarget },
    timeSnapshots: { current: Object.keys(captureDates).length, required: 2, passed: Object.keys(captureDates).length >= 2 }
  },
  riskAssessment: [
    { severity: 'critical', issue: '详情证据覆盖不足', evidence: `${verified.length}/${usable.length} 条完成详情核验`, impact: '不能用全部样本计算正式能力频率' },
    { severity: 'high', issue: '样本方向偏向 AI、算法与技术研发', evidence: '现有采集来自有限搜索批次', impact: '不能代表行业不限的深圳高薪市场' },
    { severity: 'high', issue: '缺少时间序列', evidence: `当前只有 ${Object.keys(captureDates).length} 个采集日期`, impact: '不能判断薪资涨跌或持续扩招' },
    { severity: 'high', issue: '精准对标样本不足', evidence: `当前最集中同名方向仅 ${strongestExactTitle[1]} 条，目标为 ${plan.benchmarkRoleDetailTarget} 条完整要求`, impact: '不能生成可信的单岗学习优先级' }
  ]
};

await fs.mkdir(path.join(v3Root, 'collection'), { recursive: true });
await fs.mkdir(path.join(v3Root, 'quality'), { recursive: true });
await fs.mkdir(path.join(v3Root, 'observations'), { recursive: true });
await fs.mkdir(path.join(v3Root, 'normalized'), { recursive: true });
await fs.writeFile(path.join(v3Root, 'collection/query-queue.json'), `${JSON.stringify(queryQueue, null, 2)}\n`);
await fs.writeFile(path.join(v3Root, 'quality/baseline.json'), `${JSON.stringify(baseline, null, 2)}\n`);

const pct = (value, total) => total ? `${(value / total * 100).toFixed(1)}%` : '0.0%';
const markdown = `# V3 数据质量启动基线

生成时间：${baseline.generatedAt}

## 结论

现有 ${usable.length} 条岗位可作为“发现层”起点，但只有 ${verified.length} 条完成详情核验（${pct(verified.length, usable.length)}），不足以支撑行业不限的能力频率、50+ 同岗精准对标或历史薪资趋势。V3 必须先扩展发现范围，并把完整岗位要求单独作为分析分母。

## 当前规模

| 指标 | 当前 | V3 门槛 | 状态 |
| --- | ---: | ---: | --- |
| 去重后可观察岗位 | ${usable.length} | ${plan.discoveryTarget} | ${baseline.gates.discoveryPool.passed ? '通过' : '未通过'} |
| 详情核验岗位 | ${verified.length} | ${plan.verifiedDetailTarget} | ${baseline.gates.verifiedDetails.passed ? '通过' : '未通过'} |
| 可用于完整要求分析 | ${fullRequirementRows.length} | 按具体结论披露 | 仅限小样本 |
| 最集中同名方向 | ${strongestExactTitle[1]} | ${plan.benchmarkRoleDetailTarget} | ${baseline.gates.benchmarkRole.passed ? '通过' : '未通过'} |
| 不同采集日期 | ${Object.keys(captureDates).length} | 2+ | ${baseline.gates.timeSnapshots.passed ? '通过' : '未通过'} |

## 薪资与证据

- 薪资档：${Object.entries(salaryBands).map(([name, count]) => `${name} ${count} 条`).join('；')}。
- 证据等级：${Object.entries(evidenceLevels).map(([name, count]) => `${name} ${count} 条`).join('；')}。
- 完成详情核验的记录可以进入能力分析；只有列表页的记录只能参加岗位发现与候选方向排序。

## 质量风险

${baseline.riskAssessment.map(item => `- **${item.severity.toUpperCase()}｜${item.issue}**：${item.evidence}。影响：${item.impact}。`).join('\n')}

## 已建立的采集入口

已把 ${plan.lanes.length} 个市场方向拆成 ${queryQueue.length} 个 Boss 深圳关键词查询。采集时按批次追加原始观察；遇到验证后停止连续访问，不绕过平台限制。
`;

await fs.writeFile(path.join(docsRoot, 'DATA-BASELINE.md'), markdown);
console.log(`V3 foundation built: ${queryQueue.length} queries, ${usable.length} baseline jobs, ${verified.length} verified details.`);
