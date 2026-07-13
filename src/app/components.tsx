import React, {lazy, Suspense, useEffect, useState} from 'react';
import {ArrowRight, ArrowUpRight, BookOpen, Database, Menu, X} from 'lucide-react';
import {capturedAt, realEvidence} from './data';

const HeroShaderScene = lazy(() => import('./hero-shader-engine'));

export type PageKey = 'home' | 'trends' | 'skills' | 'benchmark' | 'growth' | 'jobs' | 'method';
export type DataMode = 'demo' | 'real';

const navItems: Array<{key: PageKey; label: string; href: string}> = [
  {key: 'trends', label: '发现机会', href: 'trends.html'},
  {key: 'skills', label: '能力组合', href: 'skills.html'},
  {key: 'benchmark', label: '单岗对标', href: 'benchmark.html'},
  {key: 'growth', label: '成长路径', href: 'growth.html'},
];

export function TextRoll({children}: {children: React.ReactNode}) {
  return <span className="text-roll" aria-hidden="true"><span>{children}</span><span>{children}</span></span>;
}

export function ArrowButton({href, children, tone = 'dark'}: {href: string; children: React.ReactNode; tone?: 'dark' | 'orange' | 'light'}) {
  return <a className={`roll-button roll-button-${tone} group`} href={href}>
    <span className="sr-only">{children}</span>
    <TextRoll>{children}</TextRoll>
    <span className="roll-button-icon"><ArrowRight aria-hidden="true" /></span>
  </a>;
}

export function Header({page}: {page: PageKey}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return <>
    <header className="top-shell">
      <div className="top-nav">
        <a className="brand" href="index.html" aria-label="深圳高薪需求研究首页">
          <span className="brand-mark" aria-hidden="true">SZ</span>
          <span className="brand-name">深圳高薪需求研究</span>
        </a>
        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map(item => <a key={item.key} href={item.href} aria-current={page === item.key ? 'page' : undefined}>{item.label}</a>)}
        </nav>
        <a className="nav-job-link group" href="jobs.html">
          <TextRoll>查看真实岗位</TextRoll>
          <span><ArrowUpRight aria-hidden="true" /></span>
        </a>
        <button className="mobile-menu-trigger" type="button" onClick={() => setOpen(true)} aria-label="打开导航" aria-expanded={open}><Menu /></button>
      </div>
    </header>
    <div className={`mobile-menu-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="mobile-menu-backdrop" type="button" onClick={() => setOpen(false)} aria-label="关闭导航" />
      <div className="mobile-menu-sheet" role="dialog" aria-modal="true" aria-label="移动导航">
        <div className="mobile-menu-head"><span>选择你现在想研究的问题</span><button type="button" onClick={() => setOpen(false)} aria-label="关闭导航"><X /></button></div>
        <nav>{navItems.map(item => <a key={item.key} href={item.href}>{item.label}<ArrowUpRight /></a>)}</nav>
        <ArrowButton href="jobs.html" tone="dark">查看真实岗位</ArrowButton>
      </div>
    </div>
  </>;
}

export function HeroShader() {
  return <div className="hero-visual" aria-hidden="true">
    <div className="hero-fallback" />
    <Suspense fallback={null}><HeroShaderScene /></Suspense>
  </div>;
}

export function DataModeSwitch({mode, onChange}: {mode: DataMode; onChange: (mode: DataMode) => void}) {
  return <div className="data-mode-switch" aria-label="选择数据视图">
    <button type="button" className={mode === 'demo' ? 'active' : ''} onClick={() => onChange('demo')}>结构演示</button>
    <button type="button" className={mode === 'real' ? 'active' : ''} onClick={() => onChange('real')}>真实证据</button>
  </div>;
}

export function DataNotice({mode}: {mode: DataMode}) {
  if (mode === 'demo') return <aside className="data-notice demo-notice">
    <div><BookOpen aria-hidden="true" /><strong>当前是结构演示</strong></div>
    <p>数字和岗位方向是高概率假设，只用于判断页面逻辑。它们不计入正式样本，也不提供虚构来源链接。</p>
  </aside>;
  return <aside className="data-notice real-notice">
    <div><Database aria-hidden="true" /><strong>当前是真实证据</strong></div>
    <p>只使用已保存的 Boss 公开岗位快照。当前样本偏 AI 与算法，趋势只能理解为截面信号。</p>
  </aside>;
}

export function EvidenceStrip() {
  const date = new Intl.DateTimeFormat('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'}).format(new Date(capturedAt));
  return <section className="evidence-strip" aria-label="真实数据概览">
    <div><strong>{realEvidence.total}</strong><span>条真实岗位快照</span></div>
    <div><strong>{realEvidence.verified}</strong><span>条详情核验</span></div>
    <div><strong>{realEvidence.companies}</strong><span>家样本企业</span></div>
    <div><strong>{date}</strong><span>最近采集</span></div>
  </section>;
}

export function InnerHero({eyebrow, title, lead, mode, onModeChange}: {eyebrow: string; title: string; lead: string; mode?: DataMode; onModeChange?: (mode: DataMode) => void}) {
  return <section className="inner-hero">
    <p className="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p className="inner-lead">{lead}</p>
    {mode && onModeChange && <DataModeSwitch mode={mode} onChange={onModeChange} />}
  </section>;
}

export function Footer() {
  return <footer className="site-footer">
    <div><a className="brand" href="index.html"><span className="brand-mark">SZ</span><span className="brand-name">深圳高薪需求研究</span></a><p>把招聘平台当成需求数据库，而不是投递按钮。</p></div>
    <nav aria-label="页脚导航"><a href="jobs.html">岗位证据库</a><a href="method.html">方法与数据边界</a></nav>
  </footer>;
}

export function SiteFrame({page, children}: {page: PageKey; children: React.ReactNode}) {
  return <><a className="skip-link" href="#main">跳到正文</a><Header page={page} />{children}<Footer /></>;
}
