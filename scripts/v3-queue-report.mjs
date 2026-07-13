import fs from 'node:fs/promises';
import path from 'node:path';

const status = JSON.parse(await fs.readFile(path.resolve('data/v3/collection/status.json'), 'utf8'));
const queue = JSON.parse(await fs.readFile(path.resolve('data/v3/collection/query-queue.json'), 'utf8'));
const candidates = JSON.parse(await fs.readFile(path.resolve('data/jobs/candidates.json'), 'utf8'));
const verified = JSON.parse(await fs.readFile(path.resolve('data/jobs/verified.json'), 'utf8'));
const collectionPlan = JSON.parse(await fs.readFile(path.resolve('data/v3/config/collection-plan.json'), 'utf8'));
const gapReport = JSON.parse(await fs.readFile(path.resolve('data/v3/collection/gap-report.json'), 'utf8'));

const counts = queue.reduce((result, item) => {
  result[item.status] = (result[item.status] || 0) + 1;
  return result;
}, {});
const now = new Date();
const recoveryAt = status.expectedRecoveryAt ? new Date(status.expectedRecoveryAt) : null;
const recoveryReached = recoveryAt && now >= recoveryAt;

console.log('V3 数据采集状态');
console.log(`- 正式样本: ${candidates.length + verified.length}/${collectionPlan.discoveryTarget}`);
console.log(`- 详情核验: ${verified.length}/${collectionPlan.verifiedDetailTarget}`);
console.log(`- 薪资档缺口: ${gapReport.salaryBands.map(item => `${item.band} 总样本差 ${item.gap} / 详情差 ${item.detailGap}`).join('；')}`);
console.log(`- 单岗对标: ${gapReport.benchmark.role ?? '未确定'} ${gapReport.benchmark.detailActual}/${gapReport.benchmark.detailTarget} 条详情`);
console.log(`- 查询队列: ${queue.length}（${Object.entries(counts).map(([key, value]) => `${key} ${value}`).join('，')}）`);
console.log(`- 平台状态: ${status.status}`);

if (!status.bossAccessAllowed) {
  console.log(`- 访问闸门: 关闭。${recoveryReached ? '恢复时间已到，但仍需先做一次人工确认。' : `预计 ${status.expectedRecoveryAt} 后才可人工确认。`}`);
  console.log('- 下一步: 不输出采集链接，不进行任何 Boss 访问。');
  console.log(`- 恢复后优先方向: ${gapReport.priorityQueries.slice(0, 3).map(item => `${item.laneLabel}（${item.query}）`).join('；')}`);
  process.exit(0);
}

const next = queue.find(item => ['queued', 'blocked-salary-auth'].includes(item.status));
if (!next) {
  console.log('- 下一步: 查询队列已完成，转入详情核验。');
} else {
  console.log(`- 下一条人工查询: ${next.id} / ${next.query}`);
  console.log(`- 链接: ${next.searchUrl}`);
  console.log('- 限制: 本次只处理这一条，保存快照后重新运行校验。');
}
