import React, {useEffect, useMemo, useState} from 'react';
import {ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Database, ExternalLink, Filter, Search, Sparkles} from 'lucide-react';
import {
  capturedAt,
  collectionGapReport,
  districtOptions,
  industryOptions,
  officialSources,
  realAnalysis,
  realEvidence,
  realJobs,
  realExpansionSignals,
  realRoleFamilies,
  salaryBandFromMid,
  sourceLabelFor,
  verifiedJobs,
  verifiedSkillPairs,
  verifiedSkillStats,
  type Job,
  type RealRoleFamily,
} from './data';
import {
  ArrowButton,
  DataNotice,
  EvidenceStrip,
  HeroShader,
  InnerHero,
} from './components';

type OpportunityPoint = {
  name: string;
  demand: number;
  salaryMax: number;
  count: number;
  threshold: string;
};

function StepLink({number, title, question, result, href}: {number: string; title: string; question: string; result: string; href: string}) {
  return <a className="step-link" href={href}>
    <span className="step-number">{number}</span>
    <div><h3>{title}</h3><p>{question}</p><small>{result}</small></div>
    <ArrowUpRight aria-hidden="true" />
  </a>;
}

export function HomePage() {
  const realRoles = realRoleFamilies.slice(0, 4);
  return <main id="main">
    <section className="home-hero">
      <HeroShader />
      <div className="home-hero-content">
        <p className="hero-kicker">深职图谱 · 深圳高薪岗位与能力情报</p>
        <h1>看清深圳高薪岗位，<br />找到下一步该补的能力。</h1>
        <p>从公开岗位反推企业愿意付费的能力组合、对标岗位与成长方向。</p>
        <div className="hero-actions"><ArrowButton href="jobs.html" tone="orange">查看岗位机会</ArrowButton><a className="quiet-link" href="skills.html">探索能力图谱 <ArrowRight /></a></div>
      </div>
    </section>
    <EvidenceStrip />
    <section className="home-method section-shell">
      <div className="section-title-stack"><p className="eyebrow">从岗位反推能力</p><h2>四个问题，组成一条清楚的研究路线。</h2><p>不从“我能做什么”开始，而是从“企业正在为什么结果付钱”开始。</p></div>
      <div className="step-grid">
        <StepLink number="1" title="发现机会" question="最近出现了哪些值得留意的高薪岗位？" result="得到岗位方向，不急着投递" href="trends.html" />
        <StepLink number="2" title="能力组合" question="企业买单的到底是哪几项能力？" result="看见高频组合和能力重组" href="skills.html" />
        <StepLink number="3" title="单岗对标" question="只选一个岗位，应该先补什么？" result="按企业要求倒推学习顺序" href="benchmark.html" />
        <StepLink number="4" title="成长路径" question="薪资变高时，责任和能力多了什么？" result="找到下一档需要补齐的能力" href="growth.html" />
      </div>
    </section>
    <section className="home-slice section-shell">
      <div className="slice-head"><div><h2>先看一小块真实市场切片</h2><p>基于已核验岗位归类，不一次塞满所有图表。</p></div></div>
      <DataNotice />
      <div className="signal-strip">
        {realRoles.map(role => <a key={role.name} href="trends.html"><span className="evidence-flag">真实样本</span><strong>{role.name}</strong><span>{role.count} 条岗位，{role.companies} 家企业</span><b>{role.salaryMin}-{role.salaryMax}K</b></a>)}
      </div>
      <div className="slice-foot"><p>真实样本目前偏 AI 与算法，尚不能代表深圳全部高薪岗位。</p><a href="trends.html">进入完整发现页 <ArrowRight /></a></div>
    </section>
    <section className="home-cta section-shell"><h2>结论不是终点，岗位原文才是证据。</h2><p>同名岗位由多家公司发布时全部保留，薪资展示来源页面原始区间，链接直达当前公司岗位详情页。</p><ArrowButton href="jobs.html" tone="dark">查看岗位证据</ArrowButton></section>
  </main>;
}

function RealRoleView({role}: {role: RealRoleFamily}) {
  const statusLabel = role.status === 'emerging' ? '达到新兴信号门槛' : role.status === 'early-signal' ? '早期信号' : '观察到的岗位族群';
  return <article className="signal-detail">
    <div className="signal-detail-head"><div><span className="evidence-flag">{statusLabel}</span><h2>{role.name}</h2><p>这是对当前 {realEvidence.total} 条正式核验岗位的归类，不代表完整市场热度，也不是历史趋势。</p></div><div className="salary-range"><small>来源原始范围</small><strong>{role.salaryMin}-{role.salaryMax}K</strong><span>/月</span></div></div>
    <div className="signal-facts"><div><small>岗位样本</small><strong>{role.count} 条</strong><span>{role.companies} 家企业，{role.industries} 个行业</span></div><div><small>详情核验</small><strong>{role.verified} 条</strong><span>其余为列表页观察</span></div><div><small>薪资中位</small><strong>{role.salaryMedianMid}K</strong><span>区间中点的中位数</span></div></div>
    <div className="job-evidence-preview"><h3>代表岗位</h3>{role.jobs.slice(0, 4).map(job => <a key={job.id} href={job.sourceUrl} target="_blank" rel="noreferrer"><div><strong>{job.title}</strong><span>{job.company}，{job.district}</span></div><b>{job.salaryText}</b><ExternalLink /></a>)}</div>
  </article>;
}

export function TrendsPage() {
  const [profileKey, setProfileKey] = useState<'salaryBands' | 'industries' | 'districts' | 'experience' | 'education'>('salaryBands');
  const [realName, setRealName] = useState(realRoleFamilies[0]?.name ?? '');
  const selectedReal = realRoleFamilies.find(role => role.name === realName) ?? realRoleFamilies[0];
  const profileOptions = [
    {key: 'salaryBands' as const, label: '薪资档'},
    {key: 'industries' as const, label: '行业'},
    {key: 'districts' as const, label: '区域'},
    {key: 'experience' as const, label: '经验'},
    {key: 'education' as const, label: '学历'},
  ];
  const profileRows = realAnalysis.marketProfile[profileKey].slice(0, profileKey === 'industries' ? 10 : undefined);
  const profileMax = Math.max(...profileRows.map(row => row.count), 1);
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="逆向搜索" title="先找市场正在加价购买的新组合。" lead="不按自身条件搜索，先看岗位名、薪资和企业需求如何重新组合。" />
    <div className="content-shell"><DataNotice />
      <section className="signal-browser">
        <div className="signal-tabs" role="group" aria-label="岗位方向">
          {realRoleFamilies.map(role => <button key={role.name} className={realName === role.name ? 'active' : ''} onClick={() => setRealName(role.name)} aria-pressed={realName === role.name}><span>{role.name}</span><small>{role.count} 条样本</small></button>)}
        </div>
        {selectedReal ? <RealRoleView role={selectedReal} /> : <section className="insufficient-state"><Database /><h2>暂无达到展示门槛的岗位族群</h2><p>已核验岗位仍可在岗位证据库中查看，岗位族群会在满足样本门槛后出现。</p><a href="jobs.html">查看已核验岗位</a></section>}
      </section>
      <section id="market-profile" className="market-profile">
        <div className="market-profile-head"><div><span className="evidence-flag">{realEvidence.total} 条正式样本</span><h2>先看整体市场长什么样。</h2><p>{realAnalysis.marketProfile.statement}</p></div><div className="market-profile-tabs" role="group" aria-label="选择市场侧写维度">{profileOptions.map(option => <button type="button" key={option.key} className={profileKey === option.key ? 'active' : ''} aria-pressed={profileKey === option.key} onClick={() => setProfileKey(option.key)}>{option.label}</button>)}</div></div>
        <div className="market-profile-list" aria-live="polite">{profileRows.map(row => <article key={row.name}><div><strong>{row.name}</strong><span>{row.count} 条 · {Math.round(row.count / realAnalysis.marketProfile.denominator * 100)}%</span></div><i style={{'--profile-width': `${row.count / profileMax * 100}%`} as React.CSSProperties} /></article>)}</div>
        {profileKey === 'industries' && realAnalysis.marketProfile.industries.length > 10 && <p className="market-profile-note">这里只列样本最多的 10 个行业，其余行业仍保留在岗位证据库中。</p>}
      </section>
      <section className="official-context">
        <div className="official-context-head"><div><p className="eyebrow">官方方向佐证</p><h2>这些资料只回答“深圳在往哪里投入”。</h2></div><p>它们不证明某个岗位正在扩招，也不参与招聘平台岗位数量、薪资或能力频率计算。</p></div>
        <div className="official-context-grid">{officialSources.sources.map(source => <a key={source.id} href={source.sourceUrl} target="_blank" rel="noreferrer"><div><span>证据 {source.evidenceGrade}</span><small>{source.publishedAt}</small></div><h3>{source.title}</h3><p>{source.finding}</p><footer><span>{source.supports.slice(0, 3).join(' · ')}</span><ExternalLink aria-hidden="true" /></footer></a>)}</div>
      </section>
      <section className="plain-callout"><div><h2>{realAnalysis.readiness.emergingRoles.actual} 个方向达到当前新兴信号门槛</h2><p>当前共归为 {realRoleFamilies.length} 个岗位族群。只有至少 3 条岗位、2 家公司并含详情证据的方向才会进入新兴信号。</p></div><ArrowButton href="skills.html" tone="orange">继续拆能力</ArrowButton></section>
    </div>
  </main>;
}

export function SkillsPage() {
  const [selectedSkillName, setSelectedSkillName] = useState(verifiedSkillStats[0]?.name ?? '');
  const topRealCount = verifiedSkillStats[0]?.count || 1;
  const topPublishedPair = verifiedSkillPairs.find(pair => pair.publishable);
  const selectedSkill = verifiedSkillStats.find(skill => skill.name === selectedSkillName) ?? verifiedSkillStats[0];
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="需求拆解" title="高薪岗位通常不是一项技能，而是一组能力。" lead="先看共同出现的能力，再看它们怎样组合成一个新的岗位角色。" />
    <div className="content-shell"><DataNotice />
      {verifiedSkillStats.length ? <>
        <section className="skill-story">
          <div className="skill-story-main"><span className="evidence-flag">仅统计 {realAnalysis.skills.denominator} 条详情核验</span><h2>当前可核验需求里的高频能力</h2><p>点击一项能力，下面只显示真正命中这项要求的岗位原文。列表页摘要不会进入能力占比。</p><div className="skill-frequency" role="group" aria-label="选择要核验的能力">{verifiedSkillStats.slice(0, 8).map(skill => <button type="button" key={skill.name} className={selectedSkill?.name === skill.name ? 'active' : ''} aria-pressed={selectedSkill?.name === skill.name} onClick={() => setSelectedSkillName(skill.name)}><span><strong>{skill.name}</strong><small>{skill.count}/{verifiedJobs.length} 条</small></span><i style={{'--skill-width': `${(skill.count / topRealCount) * 100}%`} as React.CSSProperties} /></button>)}</div></div>
          <aside className="skill-combo-card"><small>达到展示门槛的共现</small><h3>{topPublishedPair?.pair.join(' + ') ?? '样本不足'}</h3><p>{topPublishedPair ? `在 ${topPublishedPair.count} 条核验需求中共同出现，并可回到岗位原文复核。` : '能力组合至少共同出现 3 次后才展示。当前还没有达到门槛。'}</p></aside>
        </section>
        <section className="requirement-evidence"><div className="evidence-heading"><div><p className="eyebrow">原文证据</p><h2>哪些岗位写了“{selectedSkill?.name ?? '这项能力'}”？</h2></div><span>{selectedSkill?.count ?? 0}/{verifiedJobs.length} 条详情命中</span></div>{selectedSkill?.jobs.map(job => <details key={job.id}><summary><span><strong>{job.title}</strong><small>{job.company}，{job.salaryText}</small></span><ChevronDown /></summary><p>{job.requirementText || job.descriptionExcerpt}</p><a href={job.sourceUrl} target="_blank" rel="noreferrer">打开{sourceLabelFor(job)}岗位详情 <ExternalLink /></a></details>)}</section>
      </> : <section className="insufficient-state"><Database /><h2>暂无可发布的能力统计</h2><p>岗位详情仍可在证据库中查看；只有完整要求通过核验后，才会进入能力频率与共现分析。</p><a href="jobs.html">查看已核验岗位</a></section>}
      <section className="plain-callout"><div><h2>能力频率不是学习清单。</h2><p>下一步要锁定一个具体岗位，分清“必须有”“加分项”和“高薪附加责任”。</p></div><ArrowButton href="benchmark.html" tone="dark">进入单岗对标</ArrowButton></section>
    </div>
  </main>;
}

export function BenchmarkPage() {
  const bestRealBenchmark = realAnalysis.readiness.benchmark.best;
  const benchmarkRole = realRoleFamilies.find(role => role.name === bestRealBenchmark?.role);
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="精准对标" title="只选一个岗位，按企业要求决定先学什么。" lead="同岗研究足够多时，学习路线才不靠课程广告和个人感觉。" />
    <div className="content-shell"><DataNotice />
      {benchmarkRole && realAnalysis.readiness.benchmark.pass ? <>
        <section className="benchmark-head"><div><span className="evidence-flag">真实同类详情</span><h2>{benchmarkRole.name}</h2><p>{bestRealBenchmark?.detailCount} 条详情证据，来自 {bestRealBenchmark?.companyCount} 家公司</p></div><strong>{benchmarkRole.salaryMin}-{benchmarkRole.salaryMax}K<span>/月</span></strong></section>
        <section className="requirement-evidence"><div className="evidence-heading"><div><p className="eyebrow">代表岗位</p><h2>先回到真实要求，再决定学习优先级。</h2></div><span>展示 {Math.min(12, benchmarkRole.jobs.length)}/{benchmarkRole.jobs.length} 条</span></div>{benchmarkRole.jobs.slice(0, 12).map(job => <details key={job.id}><summary><span><strong>{job.title}</strong><small>{job.company}，{job.salaryText}</small></span><ChevronDown /></summary><p>{job.requirementText || job.descriptionExcerpt}</p><a href={job.sourceUrl} target="_blank" rel="noreferrer">打开{sourceLabelFor(job)}岗位详情 <ExternalLink /></a></details>)}</section>
      </> : <section className="insufficient-state"><Database /><h2>暂无达到 50 条详情门槛的同类岗位。</h2><p>目前最接近的是“{bestRealBenchmark?.role ?? '尚无候选方向'}”，有 {bestRealBenchmark?.detailCount ?? 0}/50 条详情证据。这里保留空状态，不拼接虚假的能力清单。</p><a href="jobs.html">查看现有真实岗位</a></section>}
      <section className="plain-callout"><div><h2>对标之后，再看薪资升档。</h2><p>成长路径比较的是同一方向在不同薪资区间多出的责任，不是保证晋升的公式。</p></div><ArrowButton href="growth.html" tone="orange">查看成长路径</ArrowButton></section>
    </div>
  </main>;
}

type OpportunitySort = 'balanced' | 'demand' | 'salary';

function OpportunityBoard({points}: {points: OpportunityPoint[]}) {
  const [sortBy, setSortBy] = useState<OpportunitySort>('balanced');
  const ranked = useMemo(() => [...points].sort((a, b) => {
    if (sortBy === 'demand') return b.demand - a.demand;
    if (sortBy === 'salary') return b.salaryMax - a.salaryMax;
    const score = (point: OpportunityPoint) => point.demand * .55 + Math.min(point.salaryMax / 150, 1) * 45;
    return score(b) - score(a);
  }), [points, sortBy]);
  return <div className="opportunity-board" aria-label="岗位机会对比榜">
    <div className="opportunity-controls" role="group" aria-label="机会榜排序方式">
      <span>先看什么</span>
      <button type="button" className={sortBy === 'balanced' ? 'active' : ''} aria-pressed={sortBy === 'balanced'} onClick={() => setSortBy('balanced')}>综合参考</button>
      <button type="button" className={sortBy === 'demand' ? 'active' : ''} aria-pressed={sortBy === 'demand'} onClick={() => setSortBy('demand')}>岗位更多</button>
      <button type="button" className={sortBy === 'salary' ? 'active' : ''} aria-pressed={sortBy === 'salary'} onClick={() => setSortBy('salary')}>薪资更高</button>
    </div>
    <div className="opportunity-column-head" aria-hidden="true"><span>岗位方向</span><span>需求信号（0-100）</span><span>薪资上限</span><span>样本</span></div>
    <ol className="opportunity-list">
      {ranked.map((point, index) => <li key={point.name}>
        <span className="opportunity-rank">{String(index + 1).padStart(2, '0')}</span>
        <div className="opportunity-name"><strong>{point.name}</strong><span data-threshold={point.threshold}>{point.threshold}门槛</span></div>
        <div className="demand-meter"><span><i style={{transform: `scaleX(${Math.max(point.demand, 4) / 100})`}} /></span><b>{point.demand}<small>/100</small></b></div>
        <div className="opportunity-salary"><strong>{point.salaryMax}K</strong><span>/月上限</span></div>
        <div className="opportunity-count"><strong>{point.count}</strong><span>条真实岗位</span></div>
      </li>)}
    </ol>
  </div>;
}

export function GrowthPage() {
  const maxRealCount = Math.max(...realRoleFamilies.map(role => role.count), 1);
  const realPoints = useMemo<OpportunityPoint[]>(() => realRoleFamilies.map(role => ({name: role.name, demand: Math.round((role.count / maxRealCount) * 85), salaryMax: role.salaryMax, count: role.count, threshold: role.salaryMax >= 100 ? '极高' : role.salaryMax >= 70 ? '高' : '中高'})), [maxRealCount]);
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="趋势预判" title="把需求、薪资和能力门槛放在同一套比较里。" lead="先找到机会位置，再看从 30K 到 50K、100K 的真实样本分布。" />
    <div className="content-shell"><DataNotice />
      <section className="map-section"><div className="map-head"><div><h2>机会排序</h2><p>基于当前已核验岗位数量和薪资的截面比较，不表达历史涨跌。</p></div><span>真实样本</span></div>{realPoints.length ? <OpportunityBoard points={realPoints} /> : <div className="empty-results"><Search /><h2>暂无可比较的岗位族群</h2><p>请先查看岗位证据库中的已核验记录。</p></div>}<p className="chart-summary">“综合参考”同时考虑当前需求与薪资上限；你也可以单独按岗位数量或薪资排序。</p></section>
      <section className="real-paths"><h2>真实数据能支持到哪一步？</h2><p>{realAnalysis.timeSeries.statement} 以下只展示不同薪资档的样本分布，不把它解释成必然晋升路线。</p><div>{realRoleFamilies.slice(0, 6).map(role => <article key={role.name}><h3>{role.name}</h3><p>{role.count} 条岗位，薪资 {role.salaryMin}-{role.salaryMax}K</p><div className="band-dots">{(['30K', '50K', '100K'] as const).map(band => <span key={band} className={role.jobs.some(job => salaryBandFromMid(job) === band) ? 'has-data' : ''}>{band}</span>)}</div></article>)}</div></section>
      {realExpansionSignals.length ? <section className="expansion-section"><div className="expansion-head"><div><p className="eyebrow">同一快照的多岗位信号</p><h2>哪些企业一次出现了多个高薪岗位？</h2></div><p>这里只能说明同一采集批次里的岗位聚集，不能称为持续扩招。</p></div><div className="expansion-list">{realExpansionSignals.map(signal => <article key={signal.company}><div><strong>{signal.company}</strong><span>{signal.jobCount} 条岗位，{signal.distinctTitles} 个不同名称</span></div><div>{signal.evidenceJobs.slice(0, 3).map(job => <a key={job.id} href={job.sourceUrl} target="_blank" rel="noreferrer"><span>{job.title}</span><small>{job.salaryText}</small><ExternalLink /></a>)}</div></article>)}</div></section> : <section className="insufficient-state"><Database /><h2>暂无企业多岗位聚集信号</h2><p>单条岗位仍保留在证据库；只有同一企业出现多条已核验岗位后才展示。</p></section>}
      <section className="plain-callout"><div><h2>机会排序只负责找到方向。</h2><p>最后仍要回到具体公司、真实薪资和岗位要求，确认这个方向是否适合继续研究。</p></div><ArrowButton href="jobs.html" tone="dark">打开岗位证据</ArrowButton></section>
    </div>
  </main>;
}

type SortMode = 'salary-desc' | 'salary-asc' | 'recent';

function JobCard({job}: {job: Job}) {
  return <article className="job-card">
    <div className="job-card-main"><div className="job-card-title"><span className="evidence-flag">已核验 · {sourceLabelFor(job)}</span><h2>{job.title}</h2><p>{job.company}</p></div><div className="job-salary"><strong>{job.salaryText}</strong><span>{salaryBandFromMid(job)} 统计档</span></div></div>
    <dl><div><dt>区域</dt><dd>{job.district}</dd></div><div><dt>行业</dt><dd>{job.industry}</dd></div><div><dt>经验</dt><dd>{job.experience}</dd></div><div><dt>学历</dt><dd>{job.education}</dd></div></dl>
    <details><summary>查看岗位摘要 <ChevronDown /></summary><p>{job.requirementText || job.descriptionExcerpt || '当前快照没有保存完整岗位要求。'}</p></details>
    <div className="job-card-foot"><small>采集于 {new Date(job.capturedAt).toLocaleDateString('zh-CN')}，岗位可能变化</small><a href={job.sourceUrl} target="_blank" rel="noreferrer">打开当前公司岗位详情 <ExternalLink /></a></div>
  </article>;
}

export function JobsPage() {
  const pageSize = 12;
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('全部行业');
  const [district, setDistrict] = useState('全部区域');
  const [band, setBand] = useState('全部薪资');
  const [sort, setSort] = useState<SortMode>('salary-desc');
  const [page, setPage] = useState(1);
  const filteredJobs = useMemo(() => realJobs.filter(job => {
    const matchesQuery = !query || `${job.title} ${job.company}`.toLowerCase().includes(query.toLowerCase());
    const matchesIndustry = industry === '全部行业' || job.industry === industry;
    const matchesDistrict = district === '全部区域' || job.district === district;
    const matchesBand = band === '全部薪资' || salaryBandFromMid(job) === band;
    return matchesQuery && matchesIndustry && matchesDistrict && matchesBand;
  }).sort((a, b) => sort === 'salary-desc' ? b.salaryMax - a.salaryMax : sort === 'salary-asc' ? a.salaryMin - b.salaryMin : new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()), [query, industry, district, band, sort]);
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleJobs = filteredJobs.slice((safePage - 1) * pageSize, safePage * pageSize);
  useEffect(() => setPage(1), [query, industry, district, band, sort]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const changePage = (nextPage: number) => {
    setPage(nextPage);
    document.querySelector('.job-result-head')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };
  return <main id="main" className="inner-main jobs-page">
    <InnerHero eyebrow="岗位证据库" title="只展示通过详情核验的真实岗位。" lead="每条岗位都保留公司、原始薪资、完整要求和可回查的详情来源。" />
    <div className="content-shell"><DataNotice />
      <section className="job-toolbar" aria-label="岗位筛选">
        <label className="search-field"><span>搜索岗位或公司</span><div><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="例如：AI、vivo" /></div></label>
        <div className="filter-fields"><label><span>行业</span><select value={industry} onChange={event => setIndustry(event.target.value)}><option>全部行业</option>{industryOptions.map(item => <option key={item}>{item}</option>)}</select></label><label><span>区域</span><select value={district} onChange={event => setDistrict(event.target.value)}><option>全部区域</option>{districtOptions.map(item => <option key={item}>{item}</option>)}</select></label><label><span>薪资</span><select value={band} onChange={event => setBand(event.target.value)}><option>全部薪资</option><option>30K</option><option>50K</option><option>100K</option></select></label><label><span>排序</span><select value={sort} onChange={event => setSort(event.target.value as SortMode)}><option value="salary-desc">薪资上限从高到低</option><option value="salary-asc">薪资下限从低到高</option><option value="recent">采集时间从新到旧</option></select></label></div>
      </section>
      <div className="job-result-head"><p><Filter /> 找到 <strong>{filteredJobs.length}</strong> 条岗位</p><span>{filteredJobs.length ? `第 ${safePage}/${totalPages} 页 · 每页最多 ${pageSize} 条` : '当前筛选没有结果'}</span></div>
      <section className="job-list">{filteredJobs.length ? visibleJobs.map(job => <JobCard key={job.id} job={job} />) : <div className="empty-results"><Search /><h2>没有匹配的已核验岗位</h2><p>清空关键词，或放宽行业、区域和薪资条件后再试。</p><button type="button" onClick={() => {setQuery(''); setIndustry('全部行业'); setDistrict('全部区域'); setBand('全部薪资');}}>清空筛选</button></div>}</section>
      {filteredJobs.length > pageSize && <nav className="job-pagination" aria-label="岗位结果分页">
        <button type="button" onClick={() => changePage(safePage - 1)} disabled={safePage === 1}><ChevronLeft aria-hidden="true" />上一页</button>
        <p><strong>{safePage}</strong><span>/ {totalPages}</span></p>
        <button type="button" onClick={() => changePage(safePage + 1)} disabled={safePage === totalPages}>下一页<ChevronRight aria-hidden="true" /></button>
      </nav>}
    </div>
  </main>;
}

export function MethodPage() {
  const readinessItems = [
    {label: '发现池', actual: realAnalysis.readiness.discovery.actual, target: realAnalysis.readiness.discovery.target, unit: '条岗位'},
    {label: '详情证据', actual: realAnalysis.readiness.detailEvidence.actual, target: realAnalysis.readiness.detailEvidence.target, unit: '条要求'},
    {label: '新兴方向', actual: realAnalysis.readiness.emergingRoles.actual, target: realAnalysis.readiness.emergingRoles.target, unit: '个方向'},
    {label: '单岗对标', actual: realAnalysis.readiness.benchmark.best?.detailCount ?? 0, target: realAnalysis.readiness.benchmark.target, unit: '条同岗详情'},
    {label: '时间快照', actual: realAnalysis.readiness.timeSeries.actualDates, target: realAnalysis.readiness.timeSeries.targetDates, unit: '个日期'},
  ];
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="方法与边界" title="哪些数据进入产品，哪些被隔离？" lead="默认页面只呈现已核验真实岗位；候选发现和开发演示不进入生产体验。" />
    <div className="content-shell method-content">
      <section className="method-levels"><article><span className="evidence-flag">生产默认数据</span><h2>{verifiedJobs.length} 条</h2><p>保存具体岗位详情、公司、固定月薪、完整要求和回查来源，进入全部产品页面与正式分析。</p></article><article><span className="listing-flag">隔离的发现记录</span><h2>{realEvidence.quarantined} 条</h2><p>只用于内部查证与采集审计，不进入默认岗位库、统计、筛选、能力或企业信号。</p></article><article><span className="listing-flag">开发演示数据</span><h2>0 条进入生产</h2><p>演示文件保留为开发参考，但产品代码不导入、不切换，也不参与生产构建的数据依赖。</p></article></section>
      <section className="readiness-section"><div><p className="eyebrow">证据成熟度</p><h2>哪些结论已经能说，哪些还不能？</h2><p>真实数据不足的模块显示边界或空状态，不回退到虚构内容。</p></div><div className="readiness-list">{readinessItems.map(item => <article key={item.label}><div><strong>{item.label}</strong><span>{item.actual}/{item.target} {item.unit}</span></div><progress value={Math.min(item.actual, item.target)} max={item.target} aria-label={`${item.label}：${item.actual}/${item.target} ${item.unit}`} /></article>)}</div></section>
      <section className="band-readiness"><div className="band-readiness-head"><p className="eyebrow">三档数据缺口</p><h2>有岗位，不等于已经能拆能力。</h2><p>总样本用于观察岗位数量和薪资结构；只有保存了详情要求的岗位，才能进入能力组合、精准对标和成长路径分析。</p></div><div className="band-readiness-grid">{collectionGapReport.salaryBands.map(item => <article key={item.band}><strong>{item.band}</strong><div><span>总样本</span><b>{item.actual}/{item.target}</b><progress value={item.actual} max={item.target} aria-label={`${item.band} 总样本：${item.actual}/${item.target}`} /></div><div><span>详情证据</span><b>{item.detailActual}/{item.detailTarget}</b><progress value={item.detailActual} max={item.detailTarget} aria-label={`${item.band} 详情证据：${item.detailActual}/${item.detailTarget}`} /></div></article>)}</div></section>
      <section className="method-rules"><h2>页面如何区分可信程度</h2><div><article><strong>详情核验</strong><p>完整详情岗位可以进入岗位库、薪资、技能和企业信号分析，并保留具体来源入口。</p></article><article><strong>候选隔离</strong><p>未完成详情核验的发现记录只留在内部采集层，不进入任何生产页面或默认统计。</p></article><article><strong>来源回查</strong><p>产品展示的岗位必须保留具体详情入口，避免把搜索摘要或列表索引误当成岗位证据。</p></article><article><strong>技能门槛</strong><p>没有完整要求原文的记录不进入能力频次、技能组合、单岗对标和成长路径。</p></article></div></section>
      <section className="method-boundary"><h2>当前数据边界</h2><p>最近一次真实采集时间：{new Date(capturedAt).toLocaleString('zh-CN')}。Boss 自动访问已经停止，后续从深圳官方招聘、企业官网和其他公开平台补充，并逐条执行真实性核验。现有正式样本仍偏 AI、算法、机器人和技术岗位，因此不能代表深圳全行业高薪市场，也不能表达薪资历史涨跌。</p><a href="jobs.html">查看全部岗位证据 <ArrowRight /></a></section>
    </div>
  </main>;
}
