import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const publicBase = 'https://2713401482l-source.github.io/shenzhen-high-salary-map/';
const routeMeta = {
  'index.html': {title: '深圳高薪需求研究', description: '从深圳高薪岗位反推市场需求、能力组合与成长路径。'},
  'trends.html': {title: '发现机会｜深圳高薪需求研究', description: '逆向搜索深圳高薪岗位，识别值得继续研究的新兴岗位信号。'},
  'skills.html': {title: '能力组合｜深圳高薪需求研究', description: '从可核验岗位要求中拆解高频能力、能力组合和原文证据。'},
  'benchmark.html': {title: '单岗对标｜深圳高薪需求研究', description: '锁定单一岗位，按企业共同要求倒推能力学习优先级。'},
  'growth.html': {title: '成长路径｜深圳高薪需求研究', description: '比较市场需求、薪资上限、能力门槛和企业多岗位信号。'},
  'map.html': {title: '成长路径｜深圳高薪需求研究', description: '比较市场需求、薪资上限、能力门槛和企业多岗位信号。'},
  'jobs.html': {title: '真实岗位库｜深圳高薪需求研究', description: '查看深圳高薪岗位的 Boss 原始薪资、公司、区域和岗位详情链接。'},
  'method.html': {title: '方法与边界｜深圳高薪需求研究', description: '了解真实样本、列表观察、演示数据和正式分析门槛。'},
};

function reportMeta() {
  return {
    name: 'v3-report-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(_html, context) {
        const route = context.path.split('/').filter(Boolean).at(-1) || 'index.html';
        const meta = routeMeta[route] ?? routeMeta['index.html'];
        const canonicalRoute = route === 'index.html' ? '' : route;
        const canonical = new URL(canonicalRoute, publicBase).href;
        return [
          {tag: 'meta', attrs: {name: 'theme-color', content: '#f2f2ef'}, injectTo: 'head'},
          {tag: 'meta', attrs: {name: 'color-scheme', content: 'light'}, injectTo: 'head'},
          {tag: 'meta', attrs: {property: 'og:type', content: 'website'}, injectTo: 'head'},
          {tag: 'meta', attrs: {property: 'og:locale', content: 'zh_CN'}, injectTo: 'head'},
          {tag: 'meta', attrs: {property: 'og:site_name', content: '深圳高薪需求研究'}, injectTo: 'head'},
          {tag: 'meta', attrs: {property: 'og:title', content: meta.title}, injectTo: 'head'},
          {tag: 'meta', attrs: {property: 'og:description', content: meta.description}, injectTo: 'head'},
          {tag: 'meta', attrs: {property: 'og:url', content: canonical}, injectTo: 'head'},
          {tag: 'meta', attrs: {name: 'twitter:card', content: 'summary'}, injectTo: 'head'},
          {tag: 'link', attrs: {rel: 'canonical', href: canonical}, injectTo: 'head'},
        ];
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [reportMeta(), react()],
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        trends: resolve(import.meta.dirname, 'trends.html'),
        skills: resolve(import.meta.dirname, 'skills.html'),
        benchmark: resolve(import.meta.dirname, 'benchmark.html'),
        growth: resolve(import.meta.dirname, 'growth.html'),
        map: resolve(import.meta.dirname, 'map.html'),
        jobs: resolve(import.meta.dirname, 'jobs.html'),
        method: resolve(import.meta.dirname, 'method.html')
      }
    }
  }
});
