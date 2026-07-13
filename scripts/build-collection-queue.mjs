import fs from 'node:fs/promises';
import path from 'node:path';

const rawDir = path.resolve('data/jobs/raw');
const outputPath = path.resolve('data/jobs/collection-queue.json');
const files = (await fs.readdir(rawDir)).filter(file => file.endsWith('.txt')).sort();
const urls = new Map();

for (const file of files) {
  const raw = await fs.readFile(path.join(rawDir, file), 'utf8');
  const pattern = /- link "([^"]*深圳[^"]*)":\r?\n\s+- \/url: (\/zhaopin\/[^\s]+)/g;
  for (const match of raw.matchAll(pattern)) {
    const sourceUrl = new URL(match[2], 'https://www.zhipin.com').href;
    if (!urls.has(sourceUrl)) {
      urls.set(sourceUrl, {
        label: match[1],
        sourceUrl,
        discoveredFrom: file,
        status: 'queued',
      });
    }
  }
}

const queue = [...urls.values()].sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
await fs.writeFile(outputPath, `${JSON.stringify(queue, null, 2)}\n`);
console.log(`Collection queue: ${queue.length} Shenzhen Boss listing pages.`);
