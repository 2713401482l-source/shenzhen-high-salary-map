import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('data/jobs');
const candidates = JSON.parse(await fs.readFile(path.join(root, 'candidates.json'), 'utf8'));
const cityPattern = /(北京|上海|广州|苏州|杭州|成都|武汉|南京|东莞|佛山|珠海)/g;

const flags = candidates.map(job => {
  const issues = [];
  const otherCities = [...new Set(job.title.match(cityPattern) || [])];
  if (otherCities.length) issues.push(`title mentions other cities: ${otherCities.join('/')}`);
  if (!job.addressText || job.addressText === '深圳') issues.push('district detail needs confirmation');
  if (!job.descriptionExcerpt || job.descriptionExcerpt.length < 30) issues.push('description excerpt too short');
  if (!job.company || job.company === '待核验公司') issues.push('company missing');
  if (!job.industry || job.industry === '待核验') issues.push('industry missing');
  if (!job.experience || job.experience === '待核验') issues.push('experience missing');
  if (!job.education || job.education === '待核验') issues.push('education missing');
  if (job.salaryMax < 30) issues.push('salary does not reach approximately 30K');
  return issues.length ? {
    id: job.id,
    title: job.title,
    company: job.company,
    salaryText: job.salaryText,
    sourceUrl: job.sourceUrl,
    issues,
  } : null;
}).filter(Boolean);

const report = {
  generatedAt: new Date().toISOString(),
  totalCandidates: candidates.length,
  cleanCandidates: candidates.length - flags.length,
  flaggedCandidates: flags.length,
  issueCounts: Object.fromEntries([...new Set(flags.flatMap(row => row.issues))].sort().map(issue => [issue, flags.filter(row => row.issues.includes(issue)).length])),
  flags,
};

await fs.writeFile(path.join(root, 'candidate-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Candidate quality: ${report.cleanCandidates} clean, ${report.flaggedCandidates} flagged.`);
