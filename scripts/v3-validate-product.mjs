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
for (const role of demo.roleSignals || []) {
  if ('company' in role || 'sourceUrl' in role) fail(`demo role leaks company/source semantics: ${role.id}`);
}

const status = JSON.parse(await fs.readFile('data/v3/collection/status.json', 'utf8'));
if (status.bossAccessAllowed !== false) fail('Boss collection must remain paused');

const shader = await fs.readFile('src/app/hero-shader-engine.tsx', 'utf8');
for (const component of ['Shader', 'Swirl', 'ChromaFlow', 'FlutedGlass', 'FilmGrain']) {
  if (!shader.includes(component)) fail(`hero is missing ${component}`);
}

const pages = await fs.readFile('src/app/pages.tsx', 'utf8');
const dataModule = await fs.readFile('src/app/data.ts', 'utf8');
const jobsPage = pages.split('export function JobsPage()')[1]?.split('export function MethodPage()')[0] ?? '';
const jobDatabase = pages.split('function JobCard')[1]?.split('export function MethodPage()')[0] ?? '';
if (!jobsPage.includes('realJobs.filter')) fail('job database is not driven by realJobs');
if (jobsPage.includes('demoData')) fail('job database must not read demoData');
if (!jobDatabase.includes('job.salaryText')) fail('job database must preserve the original salary text');
if (!jobDatabase.includes('job.sourceUrl')) fail('job database must expose the direct job detail URL');
if (!dataModule.includes("data/v3/analysis/real-analysis.json")) fail('real views must consume the generated V3 analysis');
if (!pages.includes('realAnalysis.readiness')) fail('pages must disclose formal-analysis readiness');

console.log(JSON.stringify({routes: routes.length, demoRoles: demo.roleSignals.length, bossAccessAllowed: status.bossAccessAllowed, axionShaderStack: true}, null, 2));
if (failures) throw new Error(`${failures} V3 product validation failure(s)`);
console.log('V3 product structure and data isolation are valid.');
