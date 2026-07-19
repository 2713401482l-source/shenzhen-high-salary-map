import React, {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {ArrowRight, ArrowUpRight, Database, Menu, X} from 'lucide-react';
import {capturedAt, realEvidence} from './data';

const HeroShaderScene = lazy(() => import('./hero-shader-engine'));

export type PageKey = 'home' | 'trends' | 'skills' | 'benchmark' | 'growth' | 'jobs' | 'method';
const navItems: Array<{key: PageKey; label: string; href: string}> = [
  {key: 'trends', label: '发现机会', href: 'trends.html'},
  {key: 'skills', label: '能力组合', href: 'skills.html'},
  {key: 'benchmark', label: '单岗对标', href: 'benchmark.html'},
  {key: 'growth', label: '成长路径', href: 'growth.html'},
];

function BrandMark() {
  return <img className="brand-mark" src="assets/brand/shenzhi-tupu-mark.png" alt="" width="44" height="44" />;
}

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) triggerRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const focusTimer = window.setTimeout(() => sheetRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus(), 280);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(sheetRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return <>
    <header className="top-shell">
      <div className="top-nav">
        <a className="brand" href="index.html" aria-label="深职图谱首页">
          <BrandMark />
          <span className="brand-name">深职图谱</span>
        </a>
        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map(item => <a key={item.key} href={item.href} aria-current={page === item.key ? 'page' : undefined}>{item.label}</a>)}
        </nav>
        <a className="nav-job-link group" href="jobs.html">
          <TextRoll>查看真实岗位</TextRoll>
          <span><ArrowUpRight aria-hidden="true" /></span>
        </a>
        <a className="mobile-brand-name" href="index.html" aria-label="深职图谱首页">深职图谱</a>
        <button ref={triggerRef} className="mobile-menu-trigger" type="button" onClick={() => setOpen(value => !value)} aria-label={open ? '关闭导航' : '打开导航'} aria-expanded={open} aria-controls="mobile-navigation-panel">{open ? <X /> : <Menu />}</button>
      </div>
    </header>
    <div className={`mobile-menu-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="mobile-menu-backdrop" type="button" onClick={() => setOpen(false)} aria-label="关闭导航" />
      <div id="mobile-navigation-panel" ref={sheetRef} className="mobile-menu-sheet" role="dialog" aria-modal="true" aria-label="移动导航">
        <div className="mobile-menu-head"><span>选择你现在想研究的问题</span></div>
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

export function DataNotice() {
  return <aside className="data-notice real-notice">
    <div><Database aria-hidden="true" /><strong>当前是真实证据</strong></div>
    <p>默认页面只使用 {realEvidence.verified} 条通过真实性门槛的多平台岗位详情。另有 {realEvidence.quarantined} 条待核验发现被隔离，不进入岗位列表、趋势、薪资、能力或企业扩招结论。</p>
  </aside>;
}

export function EvidenceStrip() {
  const date = new Intl.DateTimeFormat('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'}).format(new Date(capturedAt));
  return <section className="evidence-strip" aria-label="真实数据概览">
    <div><strong>{realEvidence.total}</strong><span>条正式核验岗位</span></div>
    <div><strong>{realEvidence.verified}</strong><span>条详情核验</span></div>
    <div><strong>{realEvidence.companies}</strong><span>家样本企业</span></div>
    <div><strong>{date}</strong><span>最近采集</span></div>
  </section>;
}

export function InnerHero({eyebrow, title, lead}: {eyebrow: string; title: string; lead: string}) {
  return <section className="inner-hero">
    <p className="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p className="inner-lead">{lead}</p>
  </section>;
}

export function Footer() {
  return <footer className="site-footer">
    <div><a className="brand" href="index.html"><BrandMark /><span className="brand-name">深职图谱</span></a><p>深圳高薪岗位与能力情报。看岗位，也看下一步该补什么。</p></div>
    <nav aria-label="页脚导航"><a href="jobs.html">岗位证据库</a><a href="method.html">方法与数据边界</a></nav>
  </footer>;
}

export function SiteFrame({page, children}: {page: PageKey; children: React.ReactNode}) {
  return <><a className="skip-link" href="#main">跳到正文</a><Header page={page} />{children}<Footer /></>;
}
