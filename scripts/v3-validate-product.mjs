import fs from 'node:fs/promises';

const routes = ['index.html', 'trends.html', 'skills.html', 'benchmark.html', 'growth.html', 'map.html', 'jobs.html', 'method.html'];
const visibleFiles = [
  ...routes,
  'src/app/main.tsx',
  'src/app/components.tsx',
  'src/app/pages.tsx',
  'src/app/style.css',
  'src/app/hero-shader-engine.tsx',
];
let failures = 0;
const fail = message => { failures += 1; console.error(`FAIL: ${message}`); };

for (const route of routes) {
  const html = await fs.readFile(route, 'utf8');
  if (!html.includes('/src/app/main.tsx')) fail(`${route} is not connected to the V3 app`);
  if (!html.includes('lang="zh-CN"')) fail(`${route} is missing zh-CN language metadata`);
}

for (const file of visibleFiles) {
  const content = await fs.readFile(file, 'utf8');
  if (/[—–]/u.test(content)) fail(`${file} contains a forbidden em/en dash`);
}

const demo = JSON.parse(await fs.readFile('data/v3/demo/page-logic-demo.json', 'utf8'));
if (demo.metadata?.dataKind !== 'demo' || demo.metadata?.excludedFromFormalStats !== true) {
  fail('demo data is not explicitly excluded from formal statistics');
}

const officialSources = JSON.parse(await fs.readFile('data/v3/sources/official-sources.json', 'utf8'));
if (officialSources.metadata?.dataKind !== 'external-context' || officialSources.metadata?.excludedFromBossStatistics !== true) {
  fail('official sources must be isolated from Boss statistics');
}
if ((officialSources.sources || []).length < 3) fail('official context requires at least 3 sources');
for (const source of officialSources.sources || []) {
  const hostname = new URL(source.sourceUrl).hostname;
  if (!hostname.endsWith('.sz.gov.cn') && hostname !== 'www.sz.gov.cn') fail(`official source is not on a Shenzhen government domain: ${source.id}`);
  if (!source.publishedAt || !source.finding || !source.evidenceGrade) fail(`official source is missing traceability fields: ${source.id}`);
}
for (const role of demo.roleSignals || []) {
  if ('company' in role || 'sourceUrl' in role) fail(`demo role leaks company/source semantics: ${role.id}`);
}

const status = JSON.parse(await fs.readFile('data/v3/collection/status.json', 'utf8'));
if (status.status === 'paused-platform-risk' && status.bossAccessAllowed !== false) {
  fail('Boss access must remain closed while platform-risk pause is active');
}

const shader = await fs.readFile('src/app/hero-shader-engine.tsx', 'utf8');
for (const component of ['Shader', 'Swirl', 'ChromaFlow', 'FlutedGlass', 'FilmGrain']) {
  if (!shader.includes(component)) fail(`hero is missing ${component}`);
}

const viteConfig = await fs.readFile('vite.config.js', 'utf8');
for (const metadata of ['og:title', 'og:description', 'og:url', 'twitter:card', 'canonical']) {
  if (!viteConfig.includes(metadata)) fail(`share metadata is missing ${metadata}`);
}

const pages = await fs.readFile('src/app/pages.tsx', 'utf8');
const dataModule = await fs.readFile('src/app/data.ts', 'utf8');
const jobsPage = pages.split('export function JobsPage()')[1]?.split('export function MethodPage()')[0] ?? '';
const jobDatabase = pages.split('function JobCard')[1]?.split('export function MethodPage()')[0] ?? '';
if (!jobsPage.includes('realJobs.filter')) fail('job database is not driven by realJobs');
if (jobsPage.includes('demoData')) fail('job database must not read demoData');
if (!jobDatabase.includes('job.salaryText')) fail('job database must preserve the original salary text');
if (!jobDatabase.includes('job.sourceUrl')) fail('job database must expose the direct job detail URL');
if (!jobsPage.includes('const pageSize = 12')) fail('job database must limit result density with 12-item pages');
if (!jobsPage.includes('aria-label="岗位结果分页"')) fail('job database is missing accessible pagination');
if (!jobsPage.includes('useEffect(() => setPage(1)')) fail('job filters must reset pagination');
if (!dataModule.includes("data/v3/analysis/real-analysis.json")) fail('real views must consume the generated V3 analysis');
if (!pages.includes('realAnalysis.readiness')) fail('pages must disclose formal-analysis readiness');
if (!pages.includes('realAnalysis.marketProfile')) fail('trends page must expose the real market profile');
if (!dataModule.includes('data/v3/collection/gap-report.json')) fail('method page must consume the generated collection gap report');
if (!pages.includes('collectionGapReport.salaryBands')) fail('method page must disclose salary-band data gaps');
for (const profileKey of ['salaryBands', 'industries', 'districts', 'experience', 'education']) {
  if (!pages.includes(`key: '${profileKey}'`)) fail(`market profile is missing ${profileKey}`);
}

console.log(JSON.stringify({routes: routes.length, demoRoles: demo.roleSignals.length, officialSources: officialSources.sources.length, bossAccessAllowed: status.bossAccessAllowed, jobPageSize: 12, axionShaderStack: true}, null, 2));
if (failures) throw new Error(`${failures} V3 product validation failure(s)`);
console.log('V3 product structure and data isolation are valid.');
