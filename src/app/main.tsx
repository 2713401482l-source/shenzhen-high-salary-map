import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight, Check, ChevronDown, ChevronRight, Menu, SlidersHorizontal, X} from 'lucide-react';
import analysisData from '../../data/analysis/market-analysis.json';
import growthData from '../../data/analysis/growth-paths.json';
import './style.css';

type Band = '30K' | '50K' | '100K';
type Job = (typeof analysisData.jobs)[number];
type Family = (typeof analysisData.roleFamilies)[number];
type GrowthPath = (typeof growthData.paths)[number];

const pathName = location.pathname.split('/').pop() || 'index.html';
const page = pathName === 'growth.html' ? 'growth' : pathName === 'jobs.html' ? 'jobs' : 'home';
const capturedDate = new Intl.DateTimeFormat('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'}).format(new Date(analysisData.generatedAt));
const bandOrder: Band[] = ['30K', '50K', '100K'];
const evidenceLabel: Record<string, string> = {
  'boss-detail': '详情已核验',
  'boss-listing-plus-detail': '列表＋详情证据',
  'boss-listing': '列表页观察',
};

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    ['index.html', '高薪机会', 'home'],
    ['growth.html', '成长路径', 'growth'],
    ['jobs.html', '真实岗位', 'jobs'],
  ];
  return <header className="site-head">
    <a className="brand" href="index.html" aria-label="深圳高薪岗位观察首页"><span className="brand-mark" aria-hidden="true">◆</span><span>深圳高薪岗位观察</span></a>
    <nav aria-label="主导航">{links.map(([href, label, key]) => <a key={href} className={page === key ? 'active' : ''} href={href}>{label}</a>)}</nav>
    <a className="nav-cta" href="jobs.html"><span>浏览真实岗位</span><ArrowUpRight aria-hidden="true" /></a>
    <button className="menu-button" aria-label="打开导航" aria-expanded={open} onClick={() => setOpen(true)}><Menu /></button>
    {open && <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="移动导航">
      <button onClick={() => setOpen(false)} aria-label="关闭导航"><X /></button>
      {links.map(([href, label]) => <a key={href} href={href}>{label}<ChevronRight /></a>)}
    </div>}
  </header>;
}

function EvidenceBar() {
  return <div className="evidence-bar" aria-label="数据证据概览">
    <span><b>{analysisData.evidence.total}</b> 条可用岗位</span>
    <span><b>{analysisData.evidence.verified}</b> 条详情核验</span>
    <span><b>{analysisData.evidence.listingObserved}</b> 条列表观察</span>
    <span>采集于 {capturedDate}</span>
  </div>;
}

function SalaryBands() {
  const descriptions: Record<Band, {title: string; note: string}> = {
    '30K': {title: '专业交付层', note: '把单点技能变成可独立完成的结果'},
    '50K': {title: '复杂问题层', note: '专业纵深、项目主导与跨团队协作'},
    '100K': {title: '稀缺决策层', note: '路线判断、组织责任与稀缺经验'},
  };
  return <div className="salary-bands">
    {analysisData.bandComparison.map(item => {
      const band = item.band as Band;
      return <article key={band}>
        <div><small>统计参考档</small><strong>{band}<em>/月</em></strong></div>
        <div><h2>{descriptions[band].title}</h2><p>{descriptions[band].note}</p><span>{item.count} 条样本 · 中位值 {item.salaryMedianMid}K</span></div>
      </article>;
    })}
  </div>;
}

function OpportunityMap({families}: {families: Family[]}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let chart: {resize: () => void; dispose: () => void} | undefined;
    const initChart = async () => {
      const {createOpportunityChart} = await import('./opportunity-chart');
      if (disposed || !ref.current) return;
      chart = createOpportunityChart(ref.current, families.map(f => [f.weightedDemand, f.salary.medianMid, f.count, f.name]));
    };
    void initChart();
    const resize = () => chart?.resize();
    window.addEventListener('resize', resize);
    return () => { disposed = true; window.removeEventListener('resize', resize); chart?.dispose(); };
  }, [families]);
  return <div ref={ref} className="opportunity-chart" role="img" aria-label="岗位族群机会地图：横轴为按证据权重计算的当前样本需求，纵轴为薪资区间中位数，气泡大小代表岗位数量。" />;
}

function Home() {
  const topFamilies = analysisData.roleFamilies.slice(0, 5);
  const topSkills = analysisData.skillStats.slice(0, 8);
  return <main>
    <section className="hero">
      <img className="hero-art" src="assets/hero-glass-orange.webp" alt="" />
      <div className="hero-copy">
        <p className="hero-label">深圳 · 当前高薪技术岗位样本</p>
        <h1>深圳高薪岗位，<br />究竟在为什么能力付钱？</h1>
        <p className="hero-lead">不替你选工作。先把真实岗位、薪资和能力组合摆在桌面上。</p>
        <a className="text-link" href="#opportunities">先看市场信号 <ChevronDown /></a>
      </div>
      <SalaryBands />
      <p className="hero-note">* 档位仅用于统计；岗位库保留 Boss 原始薪资。样本偏 AI、算法与机器人，不代表深圳全行业。</p>
    </section>
    <EvidenceBar />
    <section className="section opportunity-section" id="opportunities">
      <div className="section-heading"><div><span>当前机会</span><h2>需求更集中在哪里，薪资上限又有多高？</h2></div><p>这不是历史涨跌图，而是当前可访问样本的横截面。气泡越大，观察到的岗位越多。</p></div>
      <div className="opportunity-layout">
        <OpportunityMap families={topFamilies} />
        <ol className="family-ranking">
          {topFamilies.map((family, index) => <li key={family.name}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{family.name}</h3><p>{family.count} 条岗位 · 薪资中位 {family.salary.medianMid}K</p></div><strong>{family.salary.highestMax}K<small>最高上限</small></strong></li>)}
        </ol>
      </div>
    </section>
    <section className="section skill-section">
      <div className="section-heading"><div><span>能力组合</span><h2>企业买单的，通常不是一项孤立技能。</h2></div><p>同一岗位要求里反复一起出现的能力，比单个关键词更接近真实门槛。</p></div>
      <div className="skill-layout">
        <div className="skill-bars">{topSkills.map((skill, index) => <div key={skill.skill}><span>{skill.skill}</span><div><i style={{width: `${(skill.weightedCount / topSkills[0].weightedCount) * 100}%`}} /></div><b>{skill.count} 岗</b><small>薪资中位 {skill.salaryMedianMid}K</small></div>)}</div>
        <div className="combo-note"><small>最常见组合</small><h3>{analysisData.skillCooccurrence[0].pair.replace(' + ', ' × ')}</h3><p>在当前样本中，这组能力共同出现的加权频次最高。</p><a href="growth.html">查看成长路径 <ArrowUpRight /></a></div>
      </div>
    </section>
    <section className="section next-step"><h2>结论看懂以后，去验证具体岗位。</h2><p>同名岗位的每家公司都会单独显示，薪资保留 Boss 原文，来源直接打开当前公司岗位详情页。</p><a className="primary-button" href="jobs.html">进入真实岗位库 <ArrowUpRight /></a></section>
  </main>;
}

function Stage({stage, active}: {stage: GrowthPath['stages'][number]; active: boolean}) {
  return <article className={`path-stage ${active ? 'active' : ''}`}>
    <div className="stage-head"><span>{stage.band}</span><div><b>{stage.count}</b> 条岗位<small>薪资中位 {stage.salaryMedianMid ?? '—'}K</small></div></div>
    {stage.count ? <>
      <h3>这一档反复出现</h3>
      <div className="tag-list">{stage.topSkills.slice(0, 5).map(skill => <span key={skill.name}>{skill.name}</span>)}</div>
      <dl><div><dt>常见经验</dt><dd>{stage.experience.slice(0, 2).map(x => x.name).join('、') || '样本不足'}</dd></div><div><dt>常见学历</dt><dd>{stage.education.slice(0, 2).map(x => x.name).join('、') || '样本不足'}</dd></div></dl>
      {stage.representativeJobs[0] && <a href={`jobs.html?family=${encodeURIComponent(stage.representativeJobs[0].id)}`}>代表岗位：{stage.representativeJobs[0].title}<ChevronRight /></a>}
    </> : <div className="empty-stage"><p>当前样本没有覆盖这一档。</p><small>不补造路线，也不把相邻岗位硬塞进来。</small></div>}
  </article>;
}

function Growth() {
  const publishable = growthData.paths.filter(path => path.status === 'publishable-with-caveat');
  const [selected, setSelected] = useState(publishable[0].roleFamily);
  const current = growthData.paths.find(path => path.roleFamily === selected) ?? publishable[0];
  return <main className="inner-page">
    <section className="page-intro"><p>成长路径</p><h1>同一个方向，薪资变高时，<br />企业要求多了什么？</h1><span>路线来自不同薪资档岗位的横向比较，不是个人必然晋升公式。</span></section>
    <EvidenceBar />
    <section className="growth-workbench">
      <div className="family-picker"><label htmlFor="family-select">选择岗位方向</label><select id="family-select" value={selected} onChange={event => setSelected(event.target.value)}>{growthData.paths.map(path => <option key={path.roleFamily} value={path.roleFamily}>{path.roleFamily}（{path.sampleCount}）</option>)}</select><div className="desktop-family-list">{growthData.paths.map(path => <button key={path.roleFamily} className={selected === path.roleFamily ? 'active' : ''} onClick={() => setSelected(path.roleFamily)}><span>{path.roleFamily}</span><small>{path.sampleCount} 岗</small></button>)}</div></div>
      <div className="path-content">
        <header><div><small>当前方向</small><h2>{current.roleFamily}</h2></div><p>{current.sampleCount} 条样本，其中 {current.verifiedCount} 条达到详情级证据。</p></header>
        <div className="stage-grid">{current.stages.map((stage, index) => <Stage key={stage.band} stage={stage} active={index === 1} />)}</div>
        {current.transitions.length > 0 && <section className="transition-summary"><h3>样本里观察到的变化</h3>{current.transitions.map(transition => <div key={`${transition.from}-${transition.to}`}><b>{transition.from} → {transition.to}</b><p>{transition.interpretation}</p></div>)}</section>}
        <p className="path-caveat">{current.caveat}</p>
      </div>
    </section>
  </main>;
}

function Jobs() {
  const query = new URLSearchParams(location.search);
  const highlighted = query.get('family');
  const [industry, setIndustry] = useState('全部行业');
  const [district, setDistrict] = useState('全部区域');
  const [salary, setSalary] = useState('全部薪资');
  const [sort, setSort] = useState('薪资上限优先');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(20);
  const [expanded, setExpanded] = useState<string | null>(highlighted);
  const industries = ['全部行业', ...Array.from(new Set(analysisData.jobs.map(job => job.industry))).sort((a, b) => a.localeCompare(b, 'zh-CN'))];
  const districts = ['全部区域', ...Array.from(new Set(analysisData.jobs.map(job => job.district))).sort((a, b) => a.localeCompare(b, 'zh-CN'))];
  const filtered = useMemo(() => analysisData.jobs.filter(job =>
    (industry === '全部行业' || job.industry === industry) &&
    (district === '全部区域' || job.district === district) &&
    (salary === '全部薪资' || job.salaryBand === salary)
  ).sort((a, b) => sort === '薪资上限优先' ? b.salaryMax - a.salaryMax || b.salaryMin - a.salaryMin : sort === '最新采集优先' ? +new Date(b.capturedAt) - +new Date(a.capturedAt) : a.title.localeCompare(b.title, 'zh-CN')), [industry, district, salary, sort]);
  useEffect(() => setVisible(20), [industry, district, salary, sort]);
  const FilterFields = () => <>
    <label>行业<select value={industry} onChange={event => setIndustry(event.target.value)}>{industries.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>区域<select value={district} onChange={event => setDistrict(event.target.value)}>{districts.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>薪资<select value={salary} onChange={event => setSalary(event.target.value)}>{['全部薪资', ...bandOrder].map(value => <option key={value}>{value}</option>)}</select></label>
    <label>排序<select value={sort} onChange={event => setSort(event.target.value)}>{['薪资上限优先', '最新采集优先', '岗位名称'].map(value => <option key={value}>{value}</option>)}</select></label>
  </>;
  return <main className="inner-page jobs-page">
    <section className="page-intro"><p>真实岗位</p><h1>统计档位只看结构，<br />这里看每个岗位的真实薪资。</h1><span>同一岗位有多家公司时全部保留；“来源”直接指向当前公司的 Boss 岗位详情页。</span></section>
    <EvidenceBar />
    <button className="mobile-filter-trigger" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /> 筛选岗位 <span>{filtered.length}</span></button>
    <section className="job-browser">
      <aside className="filter-panel"><h2>筛选岗位</h2><FilterFields /><button onClick={() => {setIndustry('全部行业'); setDistrict('全部区域'); setSalary('全部薪资'); setSort('薪资上限优先');}}>清除筛选</button></aside>
      <div className="job-results">
        <header><div><b>{filtered.length}</b> 条岗位符合条件</div><small>岗位可能变化，以 Boss 实时页面为准</small></header>
        <div className="job-table-head"><span>岗位 / 公司</span><span>真实薪资</span><span>门槛</span><span>来源</span></div>
        <div className="job-list">{filtered.slice(0, visible).map(job => {
          const isOpen = expanded === job.id;
          return <article key={job.id} id={job.id} className={isOpen ? 'expanded' : ''}>
            <button className="job-main" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : job.id)}>
              <div className="job-name"><h2>{job.title}</h2><p>{job.company} · {job.district} · {job.industry}</p></div>
              <strong>{job.salaryText}</strong>
              <div className="requirements"><span>{job.experience}</span><span>{job.education}</span></div>
              <span className={`evidence ${job.evidenceLevel === 'boss-listing' ? 'listing' : ''}`}><Check />{evidenceLabel[job.evidenceLevel]}</span>
              <ChevronDown className="expand-icon" />
            </button>
            {isOpen && <div className="job-detail"><div><h3>岗位方向</h3><p>{job.roleFamily}</p><div className="tag-list">{job.extractedSkills.slice(0, 8).map(skill => <span key={skill}>{skill}</span>)}</div></div><div><h3>公开描述摘要</h3><p>{job.descriptionExcerpt || '当前仅保留列表页岗位信息，详情描述待进一步核验。'}</p></div><a href={job.sourceUrl} target="_blank" rel="noreferrer">打开这家公司在 Boss 的岗位详情 <ArrowUpRight /></a></div>}
          </article>;
        })}</div>
        {visible < filtered.length && <button className="load-more" onClick={() => setVisible(value => value + 20)}>再显示 {Math.min(20, filtered.length - visible)} 条</button>}
        {!filtered.length && <div className="empty-results"><h2>当前组合没有结果</h2><p>放宽一个筛选条件即可继续查看。</p></div>}
      </div>
    </section>
    {filtersOpen && <div className="filter-drawer" role="dialog" aria-modal="true" aria-label="岗位筛选"><div><header><h2>筛选岗位</h2><button onClick={() => setFiltersOpen(false)} aria-label="关闭筛选"><X /></button></header><FilterFields /><button className="primary-button" onClick={() => setFiltersOpen(false)}>查看 {filtered.length} 条岗位</button></div></div>}
  </main>;
}

function Footer() {
  return <footer><div><b>深圳高薪岗位观察</b><p>当前 Boss 公开高薪技术岗位样本，不构成薪酬承诺或求职建议。</p></div><div><a href="index.html">高薪机会</a><a href="growth.html">成长路径</a><a href="jobs.html">真实岗位</a></div><details><summary>方法与限制</summary><p>岗位薪资上限至少触达 30K；按薪资区间中位数互斥划入 30K、50K、100K 档。71 条样本中 7 条达到详情证据，64 条来自 Boss 列表页观察。岗位族群与技能由规则抽取，样本偏 AI、算法与机器人，不代表深圳全行业，也不表示历史涨跌。</p></details></footer>;
}

function App() { return <><Header />{page === 'home' ? <Home /> : page === 'growth' ? <Growth /> : <Jobs />}<Footer /></>; }

createRoot(document.getElementById('app')!).render(<React.StrictMode><App /></React.StrictMode>);
