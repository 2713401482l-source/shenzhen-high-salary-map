import fs from 'node:fs/promises';
import path from 'node:path';

const inputs = process.argv.slice(2);
if (!inputs.length) throw new Error('Usage: node scripts/import-search-discovery.mjs <search-html...>');

const outputPath = path.resolve('data/jobs/collection-queue.json');
const existing = JSON.parse(await fs.readFile(outputPath, 'utf8'));
const byUrl = new Map(existing.map(row => [row.sourceUrl, row]));
let added = 0;

for (const input of inputs) {
  const raw = await fs.readFile(path.resolve(input), 'utf8');
  const pattern = /data-url="(https:\/\/www\.zhipin\.com\/zhaopin\/[^"\s]+)"[^>]*data-title="([^"]*)"/g;
  for (const match of raw.matchAll(pattern)) {
    const sourceUrl = match[1].replaceAll('&amp;', '&');
    if (byUrl.has(sourceUrl)) continue;
    let label = match[2];
    try { label = decodeURIComponent(label); } catch {}
    label = label.replace(/<[^>]+>/g, '').replace(/BOSS直聘/g, '').replace(/[「」-]/g, ' ').replace(/\s+/g, ' ').trim();
    byUrl.set(sourceUrl, {
      label: label || '搜索引擎发现的深圳招聘页',
      sourceUrl,
      discoveredFrom: path.basename(input),
      status: 'queued',
    });
    added += 1;
  }
}

const output = [...byUrl.values()].sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Added ${added} listing pages; collection queue total ${output.length}.`);
