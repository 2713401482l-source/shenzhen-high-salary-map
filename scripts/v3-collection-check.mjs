import fs from 'node:fs/promises';
import path from 'node:path';
import { validateManualSnapshot } from './v3-collection-lib.mjs';

const status = JSON.parse(await fs.readFile(path.resolve('data/v3/collection/status.json'), 'utf8'));
const queue = JSON.parse(await fs.readFile(path.resolve('data/v3/collection/query-queue.json'), 'utf8'));
const plan = JSON.parse(await fs.readFile(path.resolve('data/v3/config/collection-plan.json'), 'utf8'));
const example = JSON.parse(await fs.readFile(path.resolve('data/v3/schemas/manual-snapshot.example.json'), 'utf8'));
const errors = validateManualSnapshot(example);
if (errors.length) throw new Error(`示例快照无效: ${errors.join('; ')}`);
if (!example.exampleOnly) throw new Error('示例快照必须标记 exampleOnly=true');
if (!Array.isArray(queue) || !queue.length) throw new Error('采集队列为空');
for (const band of ['30K', '50K', '100K']) {
  if (plan.salaryBandTargets?.[band] !== 240) throw new Error(`${band} 总样本目标必须为 240`);
  if (plan.verifiedDetailBandTargets?.[band] !== 80) throw new Error(`${band} 详情目标必须为 80`);
}
if (plan.targetRange?.minimum !== 600 || plan.targetRange?.preferred !== 720 || plan.targetRange?.maximum !== 800) {
  throw new Error('总样本目标范围必须为 600–800，中心目标必须为 720');
}
if (plan.lanes.reduce((sum, lane) => sum + lane.target, 0) !== plan.discoveryTarget) {
  throw new Error('岗位方向配额之和必须等于总样本目标');
}
if (new Set(queue.map(item => item.id)).size !== queue.length) throw new Error('采集队列存在重复 id');
if (status.status === 'paused-platform-risk' && status.bossAccessAllowed !== false) {
  throw new Error('平台风险暂停状态下 bossAccessAllowed 必须为 false');
}
console.log(`Collection control valid: ${queue.length} queries; Boss access ${status.bossAccessAllowed ? 'allowed' : 'paused'}; example snapshot valid.`);
