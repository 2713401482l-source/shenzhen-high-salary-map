import fs from 'node:fs/promises';
import path from 'node:path';
import { duplicateFingerprint, salaryBandFor } from './job-data.mjs';

const inputs = process.argv.slice(2);
if (!inputs.length) throw new Error('Usage: node scripts/import-boss-snapshot.mjs <snapshot...>');

const candidatePath = path.resolve('data/jobs/candidates.json');
const existing = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
const byUrl = new Map(existing.map(job => [job.sourceUrl, job]));
const capturedAt = new Date().toISOString();
let imported = 0;

for (const input of inputs) {
  const raw = await fs.readFile(path.resolve(input), 'utf8');
  const pattern = /  - heading "([^"\n]+? (\d+)-(\d+)K(?:·(\d+)薪)?)" \[level=3\]:\r?\n    - link "[^"\n]+":\r?\n      - \/url: (\/job_detail\/[^\s]+)/g;
  const matches = [...raw.matchAll(pattern)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const block = raw.slice(match.index, matches[index + 1]?.index ?? raw.length);
    const [, titleSalary, minText, maxText, monthsText, detailPath] = match;
    const sourceUrl = new URL(detailPath, 'https://www.zhipin.com').href;
    if (byUrl.has(sourceUrl)) continue;

    const location = block.match(/- link "(深圳[^"\n]*)":\r?\n      - \/url: \/c101280600/);
    if (!location) continue;
    const meta = [...block.matchAll(/    - text: ([^\r\n]+)/g)].map(item => item[1].trim());
    const company = block.match(/- heading "([^"\n]+)" \[level=3\]:\r?\n    - link "[^"\n]+":\r?\n      - \/url: \/gongsi\//)?.[1] ?? '待核验公司';
    const descriptionExcerpt = block.match(/  - paragraph: (?!\s*$)([^\r\n]+)/)?.[1]?.trim() ?? '';
    const salaryText = titleSalary.match(/(\d+-\d+K(?:·\d+薪)?)/)?.[1] ?? `${minText}-${maxText}K`;
    const title = titleSalary.slice(0, titleSalary.lastIndexOf(salaryText)).trim();
    const salaryMin = Number(minText);
    const salaryMax = Number(maxText);
    const district = location[1].match(/深圳(南山区|福田区|宝安区|龙华区|龙岗区|光明区|坪山区|罗湖区|盐田区|大鹏新区)/)?.[1] ?? '深圳';
    const job = {
      id: `boss-${detailPath.split('/').pop().replace('.html', '')}`,
      bossJobId: detailPath.split('/').pop().replace('.html', ''),
      title,
      company,
      salaryText,
      salaryMin,
      salaryMax,
      ...(monthsText ? { salaryMonths: Number(monthsText) } : {}),
      salaryBand: salaryBandFor(salaryMin, salaryMax),
      city: '深圳',
      district,
      addressText: location[1],
      industry: meta[2] ?? '待核验',
      experience: meta[0] ?? '待核验',
      education: meta[1] ?? '待核验',
      descriptionExcerpt,
      requirementText: '',
      sourceUrl,
      sourceDiscovery: path.basename(input, path.extname(input)),
      capturedAt,
      status: 'candidate',
    };
    job.duplicateFingerprint = duplicateFingerprint(job);
    byUrl.set(sourceUrl, job);
    imported += 1;
  }
}

const output = [...byUrl.values()].sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
await fs.writeFile(candidatePath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Imported ${imported} candidates; total ${output.length}.`);
