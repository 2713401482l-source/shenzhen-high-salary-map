import fs from 'node:fs/promises';
import path from 'node:path';

const readJson = async file => JSON.parse(await fs.readFile(path.resolve(file), 'utf8'));
const [plan, queue, status, analysis, candidates, verified] = await Promise.all([
  readJson('data/v3/config/collection-plan.json'),
  readJson('data/v3/collection/query-queue.json'),
  readJson('data/v3/collection/status.json'),
  readJson('data/v3/analysis/real-analysis.json'),
  readJson('data/jobs/candidates.json'),
  readJson('data/jobs/verified.json'),
]);

const jobs = [...verified, ...candidates];
const queryById = new Map(queue.map(item => [item.id, item]));
const assignedJobs = jobs.filter(job => queryById.has(job.sourceDiscovery));
const countBy = (rows, field, value) => rows.filter(row => row[field] === value).length;

const bandStatus = ['30K', '50K', '100K'].map(band => {
  const actual = countBy(jobs, 'salaryBand', band);
  const detailActual = countBy(verified, 'salaryBand', band);
  const target = plan.salaryBandTargets[band];
  const detailTarget = plan.verifiedDetailBandTargets[band];
  return {
    band,
    actual,
    target,
    gap: Math.max(0, target - actual),
    detailActual,
    detailTarget,
    detailGap: Math.max(0, detailTarget - detailActual),
  };
});

const laneStatus = plan.lanes.map(lane => {
  const queryIds = new Set(queue.filter(item => item.laneId === lane.id).map(item => item.id));
  const rows = assignedJobs.filter(job => queryIds.has(job.sourceDiscovery));
  const queryItems = queue.filter(item => item.laneId === lane.id);
  return {
    id: lane.id,
    label: lane.label,
    actual: rows.length,
    target: lane.target,
    gap: Math.max(0, lane.target - rows.length),
    queriesCaptured: queryItems.filter(item => item.status === 'captured-manual').length,
    queriesTotal: queryItems.length,
  };
}).sort((a, b) => (a.actual / a.target) - (b.actual / b.target) || b.gap - a.gap);

const priorityQueries = laneStatus.flatMap(lane => {
  const next = queue.find(item => item.laneId === lane.id && ['queued', 'blocked-salary-auth'].includes(item.status));
  return next ? [{id: next.id, laneId: lane.id, laneLabel: lane.label, query: next.query, reason: `${lane.label}当前新队列归档 ${lane.actual}/${lane.target} 条`}] : [];
}).slice(0, 10);

const benchmark = analysis.readiness.benchmark.best;
const output = {
  metadata: {
    dataKind: 'collection-gap-report',
    generatedFromLatestCapture: analysis.metadata.generatedFromLatestCapture,
    bossAccessAllowed: status.bossAccessAllowed,
    sourceFiles: [
      'data/v3/config/collection-plan.json',
      'data/v3/collection/query-queue.json',
      'data/jobs/candidates.json',
      'data/jobs/verified.json',
      'data/v3/analysis/real-analysis.json'
    ]
  },
  totals: {
    discovery: {actual: jobs.length, target: plan.discoveryTarget, gap: Math.max(0, plan.discoveryTarget - jobs.length)},
    detailEvidence: {actual: verified.length, target: plan.verifiedDetailTarget, gap: Math.max(0, plan.verifiedDetailTarget - verified.length)},
    assignedToV3Queue: assignedJobs.length,
    legacyUnassigned: jobs.length - assignedJobs.length,
  },
  salaryBands: bandStatus,
  lanes: laneStatus,
  benchmark: {
    role: benchmark?.role ?? null,
    detailActual: benchmark?.detailCount ?? 0,
    detailTarget: plan.benchmarkRoleDetailTarget,
    detailGap: Math.max(0, plan.benchmarkRoleDetailTarget - (benchmark?.detailCount ?? 0)),
    currentFamilyJobs: analysis.roleSignals.find(role => role.name === benchmark?.role)?.sampleCount ?? 0,
  },
  priorityQueries,
  publicationBlockers: [
    ...bandStatus.filter(item => item.gap > 0).map(item => `${item.band} 总样本还差 ${item.gap} 条`),
    ...bandStatus.filter(item => item.detailGap > 0).map(item => `${item.band} 详情证据还差 ${item.detailGap} 条`),
    `单岗对标“${benchmark?.role ?? '未确定'}”还差 ${Math.max(0, plan.benchmarkRoleDetailTarget - (benchmark?.detailCount ?? 0))} 条详情证据`,
    analysis.timeSeries.available ? null : '还缺至少一个不同日期的可比快照，不能判断薪资变化或持续扩招',
  ].filter(Boolean),
};

await fs.writeFile(path.resolve('data/v3/collection/gap-report.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Gap report: ${output.totals.discovery.actual}/${output.totals.discovery.target} jobs, ${output.totals.detailEvidence.actual}/${output.totals.detailEvidence.target} details, ${output.publicationBlockers.length} blockers.`);
