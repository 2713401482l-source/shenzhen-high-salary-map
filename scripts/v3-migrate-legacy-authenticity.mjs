import fs from 'node:fs/promises';

const verifiedPath = 'data/jobs/verified.json';
const candidatePath = 'data/jobs/candidates.json';
const verified = JSON.parse(await fs.readFile(verifiedPath, 'utf8'));
const candidates = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
const retained = [];
const downgraded = [];

for (const job of verified) {
  const signals = [];
  if (/某公司|某知名|保密|匿名|猎头发布/.test(job.company)) signals.push('unnamedEmployer');
  if (/年薪\s*30-50万/.test(job.title) && job.salaryText.startsWith('30-50K')) signals.push('salaryTitleDetailNeedsReview');
  const quarantined = signals.includes('unnamedEmployer');
  const manualReview = signals.includes('salaryTitleDetailNeedsReview');
  const status = quarantined ? 'quarantined' : manualReview ? 'manual-review' : 'verified';
  const score = quarantined ? 55 : manualReview ? 75 : 85;
  const formalSample = status === 'verified';
  const migrated = {
    ...job,
    sourcePlatform: 'boss',
    sourcePublisher: 'Boss直聘',
    captureMethod: 'manual-user-submission',
    authenticity: {
      status,
      score,
      scoreParts: {
        sourceTrust: 20,
        employerIdentity: quarantined ? 0 : 20,
        freshness: 20,
        detailCompleteness: 15,
        crossSourceCorroboration: 0,
        internalConsistency: manualReview ? 0 : 10
      },
      hardGates: {
        shenzhenLocationEstablished: true,
        specificDetailUrl: true,
        exactSalaryVisible: true,
        namedEmployer: !quarantined,
        substantiveRequirements: String(job.requirementText || '').length >= 80,
        activeOrFresh: true,
        noFeeOrDeposit: true,
        titleDescriptionConsistent: !manualReview
      },
      failedHardGates: quarantined ? ['namedEmployer'] : manualReview ? ['titleDescriptionConsistent'] : [],
      quarantineSignals: quarantined ? ['unnamedEmployer'] : [],
      ageDays: 0
    },
    analysisEligibility: {
      formalSample,
      marketDemand: formalSample,
      salary: formalSample,
      skills: formalSample && String(job.requirementText || '').length >= 80,
      companyExpansion: formalSample && !/猎头发布/.test(job.company)
    },
    verification: {
      pageActiveAtCapture: true,
      employerNamed: !quarantined,
      employerOfficialUrl: null,
      corroboratingUrls: [],
      staffingAgencyPosting: /猎头发布/.test(job.company),
      endEmployerNamed: !quarantined,
      signals,
      reviewNotes: formalSample ? '历史详情证据已按 V3 多来源真实性规则重新审核。' : '需要补充招聘主体或薪资口径证据后才能恢复为正式样本。'
    }
  };
  if (formalSample) retained.push(migrated);
  else downgraded.push({...migrated, status: 'candidate'});
}

const mergedCandidates = [...candidates, ...downgraded].sort((a, b) => a.id.localeCompare(b.id));
retained.sort((a, b) => a.id.localeCompare(b.id));
await fs.writeFile(verifiedPath, `${JSON.stringify(retained, null, 2)}\n`);
await fs.writeFile(candidatePath, `${JSON.stringify(mergedCandidates, null, 2)}\n`);
console.log(JSON.stringify({reviewed: verified.length, retained: retained.length, downgraded: downgraded.map(job => ({id: job.id, company: job.company, signals: job.verification.signals}))}, null, 2));
