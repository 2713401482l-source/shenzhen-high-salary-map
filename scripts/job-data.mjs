import { createHash } from 'node:crypto';

export const DATA_LEVELS = ['candidate', 'verified', 'possibly-offline', 'rejected'];
export const SALARY_BANDS = ['30K', '50K', '100K'];
export const EVIDENCE_LEVELS = [
  'boss-listing',
  'boss-listing-plus-detail',
  'boss-detail',
  'government-detail',
  'employer-detail',
  'public-platform-detail',
  'licensed-api-detail',
];

export const SOURCE_PLATFORMS = [
  'boss',
  'iucai',
  'guangdong-public',
  'liepin',
  'zhaopin',
  'job5156',
  'employer-career',
  'licensed-api',
];

export function normalizeText(value = '') {
  return String(value).normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function normalizedCompany(value = '') {
  return normalizeText(value)
    .replace(/（[^）]*）|\([^)]*\)/g, '')
    .replace(/有限责任公司|股份有限公司|有限公司|集团/g, '')
    .toLowerCase();
}

export function duplicateFingerprint(job) {
  const source = [
    normalizedCompany(job.company),
    normalizeText(job.title).toLowerCase(),
    normalizeText(job.district).toLowerCase(),
    normalizeText(job.salaryText).toLowerCase(),
  ].join('|');
  return createHash('sha256').update(source).digest('hex').slice(0, 20);
}

export function salaryBandFor(min, max) {
  const mid = (Number(min) + Number(max)) / 2;
  if (mid < 40) return '30K';
  if (mid < 75) return '50K';
  return '100K';
}

export function isBossJobDetailUrl(value = '') {
  try {
    const url = new URL(value);
    if (url.hostname !== 'www.zhipin.com') return false;
    return /^\/job_detail\/[a-zA-Z0-9~_-]+\.html$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function sourcePlatformFor(job) {
  if (job.sourcePlatform) return job.sourcePlatform;
  return isBossJobDetailUrl(job.sourceUrl) ? 'boss' : '';
}

export function isDirectJobDetailUrl(value = '') {
  try {
    const url = new URL(value);
    if (!['https:'].includes(url.protocol)) return false;
    const pathname = url.pathname.toLowerCase();
    return !['', '/'].includes(pathname) && !/(\/search|\/jobs?$|\/zhaopin\/?$|\/main\/?$)/.test(pathname);
  } catch {
    return false;
  }
}

export function validateJob(job, expectedStatus) {
  const errors = [];
  const common = [
    'id', 'title', 'company', 'salaryText', 'salaryMin', 'salaryMax',
    'salaryBand', 'district', 'industry', 'experience', 'education',
    'sourceUrl', 'capturedAt', 'status', 'duplicateFingerprint',
    'evidenceLevel',
  ];
  for (const key of common) {
    if (job[key] === undefined || job[key] === null || job[key] === '') errors.push(`missing ${key}`);
  }
  if (!DATA_LEVELS.includes(job.status)) errors.push(`invalid status ${job.status}`);
  if (!EVIDENCE_LEVELS.includes(job.evidenceLevel)) errors.push(`invalid evidenceLevel ${job.evidenceLevel}`);
  if (expectedStatus && job.status !== expectedStatus) errors.push(`expected status ${expectedStatus}`);
  if (!SALARY_BANDS.includes(job.salaryBand)) errors.push(`invalid salaryBand ${job.salaryBand}`);
  if (Number(job.salaryMin) <= 0 || Number(job.salaryMax) < Number(job.salaryMin)) errors.push('invalid salary range');
  if (job.salaryBand !== salaryBandFor(job.salaryMin, job.salaryMax)) errors.push('salaryBand mismatch');
  if (!/深圳|南山|福田|宝安|龙华|龙岗|光明|坪山|罗湖|盐田|大鹏/.test(`${job.city || ''}${job.district || ''}${job.addressText || ''}`)) errors.push('Shenzhen location not established');
  if (job.duplicateFingerprint !== duplicateFingerprint(job)) errors.push('duplicateFingerprint mismatch');
  if (job.status === 'verified') {
    if (!job.verifiedAt) errors.push('verified job missing verifiedAt');
    const sourcePlatform = sourcePlatformFor(job);
    if (!SOURCE_PLATFORMS.includes(sourcePlatform)) errors.push(`unsupported sourcePlatform ${sourcePlatform}`);
    if (sourcePlatform === 'boss' && !isBossJobDetailUrl(job.sourceUrl)) errors.push('Boss verified source is not a Boss job detail URL');
    if (sourcePlatform !== 'boss' && !isDirectJobDetailUrl(job.sourceUrl)) errors.push('verified source is not a specific HTTPS job detail URL');
    if (!job.requirementText && !job.descriptionExcerpt) errors.push('verified job missing requirements/description');
    if (job.evidenceLevel === 'boss-listing') errors.push('verified job requires detail-page evidence');
    if (!job.authenticity || job.authenticity.status !== 'verified') errors.push('verified job missing verified authenticity decision');
    if (job.analysisEligibility?.formalSample !== true) errors.push('verified job is not eligible for the formal sample');
    if (!job.sourcePublisher) errors.push('verified job missing sourcePublisher');
  }
  if (job.status === 'rejected' && !job.rejectionReason) errors.push('rejected job missing rejectionReason');
  return errors;
}
