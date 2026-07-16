import { createHash } from 'node:crypto';
import { isDirectJobDetailUrl, salaryBandFor } from './job-data.mjs';

const SHENZHEN = /深圳|南山|福田|宝安|龙华|龙岗|光明|坪山|罗湖|盐田|大鹏/;
const SALARY = /(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)K(?:[·・](\d+)薪)?/i;

export function parseMonthlySalary(value = '') {
  const match = String(value).replace(/\s+/g, '').match(SALARY);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]), months: match[3] ? Number(match[3]) : undefined };
}

export function evaluateAuthenticity(snapshot, policy, source) {
  const job = snapshot.job || {};
  const verification = snapshot.verification || {};
  const salary = parseMonthlySalary(job.salaryText);
  const ageDays = snapshot.publishedAt
    ? Math.floor((Date.parse(snapshot.capturedAt) - Date.parse(`${snapshot.publishedAt}T00:00:00+08:00`)) / 86400000)
    : null;
  const sourceSpecificDetailUrl = isDirectJobDetailUrl(snapshot.sourceUrl)
    && (source.detailUrlPatterns || []).some(pattern => new RegExp(pattern, 'i').test(snapshot.sourceUrl))
    && !snapshot.captureMethod.includes('discovery');
  const hardGates = {
    shenzhenLocationEstablished: SHENZHEN.test(`${job.city || ''}${job.district || ''}${job.addressText || ''}`),
    specificDetailUrl: sourceSpecificDetailUrl,
    exactSalaryVisible: Boolean(salary && salary.max >= 30),
    namedEmployer: Boolean(verification.employerNamed && verification.endEmployerNamed && job.company && !/某公司|某知名|保密|匿名/.test(job.company)),
    substantiveRequirements: String(job.descriptionText || '').trim().length >= 80,
    activeOrFresh: verification.pageActiveAtCapture === true && (ageDays === null || ageDays <= policy.freshness.maximumDays),
    noFeeOrDeposit: !verification.signals?.some(signal => ['chargesFeeOrDeposit', 'asksForPaidTraining'].includes(signal)),
    titleDescriptionConsistent: !verification.signals?.includes('titleDescriptionMismatch'),
  };
  const automaticSignals = new Set(policy.automaticQuarantineSignals);
  const quarantineSignals = (verification.signals || []).filter(signal => automaticSignals.has(signal));
  const sourceTrust = source.trustTier === 'A' ? 25 : source.trustTier === 'B' ? 20 : 10;
  const scoreParts = {
    sourceTrust,
    employerIdentity: hardGates.namedEmployer ? 20 : 0,
    freshness: verification.pageActiveAtCapture && (ageDays === null || ageDays <= policy.freshness.preferredDays) ? 20 : verification.pageActiveAtCapture ? 10 : 0,
    detailCompleteness: hardGates.substantiveRequirements && salary ? 15 : 0,
    crossSourceCorroboration: (verification.corroboratingUrls || []).length ? 10 : 0,
    internalConsistency: hardGates.titleDescriptionConsistent && hardGates.shenzhenLocationEstablished ? 10 : 0,
  };
  const score = Object.values(scoreParts).reduce((sum, value) => sum + value, 0);
  const failedHardGates = Object.entries(hardGates).filter(([, passed]) => !passed).map(([name]) => name);
  const status = failedHardGates.length || quarantineSignals.length
    ? 'quarantined'
    : score >= policy.formalSampleThreshold ? 'verified'
      : score >= policy.manualReviewThreshold ? 'manual-review'
        : 'quarantined';
  return { status, score, scoreParts, hardGates, failedHardGates, quarantineSignals, ageDays };
}

export function stableSourceId(snapshot) {
  const raw = `${snapshot.sourcePlatform}|${snapshot.job.sourceJobId || snapshot.sourceUrl}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 20);
}

export function toMultiSourceJob(snapshot, authenticity) {
  const salary = parseMonthlySalary(snapshot.job.salaryText);
  const sourceId = stableSourceId(snapshot);
  const evidenceBySource = {
    iucai: 'public-platform-detail',
    'guangdong-public': 'government-detail',
    liepin: 'public-platform-detail',
    zhaopin: 'public-platform-detail',
    job5156: 'public-platform-detail',
    'employer-career': 'employer-detail',
    'licensed-api': 'licensed-api-detail',
  };
  const formalSample = authenticity.status === 'verified';
  const job = {
    id: `${snapshot.sourcePlatform}-${sourceId}`,
    sourceJobId: snapshot.job.sourceJobId || sourceId,
    sourcePlatform: snapshot.sourcePlatform,
    sourcePublisher: snapshot.sourcePublisher,
    captureMethod: snapshot.captureMethod,
    title: snapshot.job.title.trim(),
    company: snapshot.job.company.trim(),
    salaryText: snapshot.job.salaryText.trim(),
    salaryMin: salary.min,
    salaryMax: salary.max,
    ...(salary.months ? { salaryMonths: salary.months } : {}),
    salaryBand: salaryBandFor(salary.min, salary.max),
    city: '深圳',
    district: snapshot.job.district.trim(),
    addressText: snapshot.job.addressText.trim(),
    industry: snapshot.job.industry.trim(),
    experience: snapshot.job.experience.trim(),
    education: snapshot.job.education.trim(),
    descriptionExcerpt: snapshot.job.descriptionText.trim().slice(0, 180),
    requirementText: snapshot.job.descriptionText.trim(),
    sourceUrl: snapshot.sourceUrl,
    capturedAt: snapshot.capturedAt,
    ...(snapshot.publishedAt ? { publishedAt: snapshot.publishedAt } : {}),
    verifiedAt: snapshot.capturedAt,
    status: formalSample ? 'verified' : 'candidate',
    evidenceLevel: evidenceBySource[snapshot.sourcePlatform],
    authenticity,
    analysisEligibility: {
      formalSample,
      marketDemand: formalSample,
      salary: formalSample,
      skills: formalSample && snapshot.job.descriptionText.trim().length >= 80,
      companyExpansion: formalSample && !snapshot.verification.staffingAgencyPosting && snapshot.verification.endEmployerNamed,
    },
    verification: snapshot.verification,
  };
  return job;
}
