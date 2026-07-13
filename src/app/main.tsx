import React from 'react';
import {createRoot} from 'react-dom/client';
import {SiteFrame, type PageKey} from './components';
import {BenchmarkPage, GrowthPage, HomePage, JobsPage, MethodPage, SkillsPage, TrendsPage} from './pages';
import './style.css';

const fileName = location.pathname.split('/').pop() || 'index.html';
const routeMap: Record<string, PageKey> = {
  'index.html': 'home',
  '': 'home',
  'trends.html': 'trends',
  'skills.html': 'skills',
  'benchmark.html': 'benchmark',
  'growth.html': 'growth',
  'map.html': 'growth',
  'jobs.html': 'jobs',
  'method.html': 'method',
};
const page = routeMap[fileName] ?? 'home';

const pageComponent: Record<PageKey, React.ReactNode> = {
  home: <HomePage />,
  trends: <TrendsPage />,
  skills: <SkillsPage />,
  benchmark: <BenchmarkPage />,
  growth: <GrowthPage />,
  jobs: <JobsPage />,
  method: <MethodPage />,
};

createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <SiteFrame page={page}>{pageComponent[page]}</SiteFrame>
  </React.StrictMode>,
);
