import { createHash } from 'node:crypto';
import { duplicateFingerprint, isBossJobDetailUrl, salaryBandFor } from './job-data.mjs';

export const SNAPSHOT_FORMAT = 'v3-manual-boss-snapshot';
export const SNAPSHOT_KINDS = ['listing', 'detail'];

const requiredText = (value, label, errors) => {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${label} 不能为空`);
};

export function parseBossJobId(sourceUrl = '') {
  if (!isBossJobDetailUrl(sourceUrl)) return '';
  return new URL(sourceUrl).pathname.split('/').pop().replace('.html', '');
}

export function salaryFromText(value = '') {
  const normalized = String(value).replace(/\s+/g, '');
  const match = normalized.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)K(?:·(\d+)薪)?/i);
  if (!match) return null;
  return {
    min: Number(match[1]),
    max: Number(match[2]),
    months: match[3] ? Number(match[3]) : undefined,
  };
}

export function validateManualSnapshot(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return ['根节点必须是对象'];
  if (snapshot.format !== SNAPSHOT_FORMAT) errors.push(`format 必须是 ${SNAPSHOT_FORMAT}`);
  if (snapshot.version !== 1) errors.push('version 必须是 1');
  if (!SNAPSHOT_KINDS.includes(snapshot.kind)) errors.push('kind 必须是 listing 或 detail');
  if (snapshot.captureMethod !== 'manual-browser') errors.push('captureMethod 必须是 manual-browser');
  requiredText(snapshot.capturedAt, 'capturedAt', errors);
  if (snapshot.capturedAt && Number.isNaN(Date.parse(snapshot.capturedAt))) errors.push('capturedAt 不是有效时间');
  if (snapshot.city !== '深圳') errors.push('city 必须明确为深圳');
  if (snapshot.exampleOnly !== undefined && typeof snapshot.exampleOnly !== 'boolean') errors.push('exampleOnly 必须是布尔值');

  const jobs = snapshot.kind === 'detail' ? [snapshot.job] : snapshot.jobs;
  if (!Array.isArray(jobs) || !jobs.length) errors.push('快照必须至少包含 1 个岗位');
  for (const [index, job] of (Array.isArray(jobs) ? jobs : []).entries()) {
    const prefix = `jobs[${index}]`;
    if (!job || typeof job !== 'object') {
      errors.push(`${prefix} 必须是对象`);
      continue;
    }
    for (const field of ['title', 'company', 'salaryText', 'district', 'industry', 'experience', 'education', 'sourceUrl']) {
      requiredText(job[field], `${prefix}.${field}`, errors);
    }
    if (!isBossJobDetailUrl(job.sourceUrl)) errors.push(`${prefix}.sourceUrl 必须是 Boss 具体岗位详情页`);
    const salary = salaryFromText(job.salaryText);
    if (!salary) errors.push(`${prefix}.salaryText 必须保留 Boss 月薪原文，例如 25-35K·14薪`);
    if (salary && salary.max < 30) errors.push(`${prefix}.salaryText 未触达约 30K，不进入高薪样本`);
    if (!/深圳|南山|福田|宝安|龙华|龙岗|光明|坪山|罗湖|盐田|大鹏/.test(`${snapshot.city}${job.district}${job.addressText || ''}`)) {
      errors.push(`${prefix} 无法证明岗位位于深圳`);
    }
    if (snapshot.kind === 'detail') {
      requiredText(job.descriptionText, `${prefix}.descriptionText`, errors);
      if ((job.descriptionText || '').trim().length < 40) errors.push(`${prefix}.descriptionText 过短，无法支持能力分析`);
    }
  }
  if (snapshot.kind === 'listing') requiredText(snapshot.queryId, 'queryId', errors);
  if (snapshot.kind === 'detail') requiredText(snapshot.sourceUrl, 'sourceUrl', errors);
  if (snapshot.kind === 'detail' && snapshot.job?.sourceUrl !== snapshot.sourceUrl) errors.push('detail 的 sourceUrl 必须与 job.sourceUrl 一致');
  return errors;
}

export function toCandidate(job, snapshot, rawEvidenceFile) {
  const salary = salaryFromText(job.salaryText);
  const bossJobId = parseBossJobId(job.sourceUrl);
  const candidate = {
    id: `boss-${bossJobId}`,
    bossJobId,
    title: job.title.trim(),
    company: job.company.trim(),
    salaryText: job.salaryText.trim(),
    salaryMin: salary.min,
    salaryMax: salary.max,
    ...(salary.months ? { salaryMonths: salary.months } : {}),
    salaryBand: salaryBandFor(salary.min, salary.max),
    city: '深圳',
    district: job.district.trim(),
    addressText: (job.addressText || `深圳${job.district}`).trim(),
    industry: job.industry.trim(),
    experience: job.experience.trim(),
    education: job.education.trim(),
    descriptionExcerpt: (job.descriptionExcerpt || '').trim(),
    requirementText: '',
    sourceUrl: job.sourceUrl,
    sourceDiscovery: snapshot.queryId,
    capturedAt: snapshot.capturedAt,
    rawEvidenceFile,
    status: 'candidate',
    evidenceLevel: 'boss-listing',
  };
  candidate.duplicateFingerprint = duplicateFingerprint(candidate);
  return candidate;
}

export function snapshotHash(snapshot) {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex').slice(0, 12);
}
