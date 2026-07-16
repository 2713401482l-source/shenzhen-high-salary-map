import fs from 'node:fs/promises';

const registry = JSON.parse(await fs.readFile('data/v3/config/source-registry.json', 'utf8'));
const policy = JSON.parse(await fs.readFile('data/v3/config/authenticity-policy.json', 'utf8'));
const sourceIds = new Set();
const failures = [];
for (const source of registry.sources) {
  if (sourceIds.has(source.id)) failures.push(`duplicate source id: ${source.id}`);
  sourceIds.add(source.id);
  if (!['A', 'B', 'C'].includes(source.trustTier)) failures.push(`invalid trust tier: ${source.id}`);
  if (!Array.isArray(source.allowedCaptureMethods) || !source.allowedCaptureMethods.length) failures.push(`missing capture methods: ${source.id}`);
  if (!Array.isArray(source.detailUrlPatterns) || !source.detailUrlPatterns.length) failures.push(`missing detail URL patterns: ${source.id}`);
}
const bossSource = registry.sources.find(source => source.id === 'boss');
if (!['paused-platform-risk', 'active-light-public-detail'].includes(bossSource?.accessStatus)) failures.push('Boss access status must be paused-platform-risk or active-light-public-detail');
if (bossSource?.accessStatus === 'active-light-public-detail' && !bossSource.allowedCaptureMethods.includes('manual-public-detail')) failures.push('Light Boss access must allow manual-public-detail capture');
if (policy.hardGates.length < 8) failures.push('authenticity policy needs all hard gates');
const totalWeight = Object.values(policy.scoreWeights).reduce((sum, value) => sum + value, 0);
if (totalWeight !== 100) failures.push(`score weights must total 100, got ${totalWeight}`);
if (policy.formalSampleThreshold < 80) failures.push('formal sample threshold must be at least 80');
if (!registry.prohibitedMethods.includes('captcha-bypass')) failures.push('captcha bypass must be prohibited');
if (!registry.prohibitedMethods.includes('human-behavior-emulation')) failures.push('human behavior emulation must be prohibited');

console.log(JSON.stringify({ sources: registry.sources.length, formalSources: registry.sources.filter(source => source.formalSampleAllowed).length, hardGates: policy.hardGates.length, formalSampleThreshold: policy.formalSampleThreshold, scoreWeightTotal: totalWeight }, null, 2));
if (failures.length) throw new Error(`来源与真实性策略校验失败:\n- ${failures.join('\n- ')}`);
console.log('多平台来源与真实性策略校验通过。');
