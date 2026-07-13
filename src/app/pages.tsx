import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Database, ExternalLink, Filter, Search, Sparkles} from 'lucide-react';
import {
  candidateJobs,
  capturedAt,
  demoData,
  districtOptions,
  industryOptions,
  officialSources,
  realAnalysis,
  realEvidence,
  realJobs,
  realRoleFamilies,
  salaryBandFromMid,
  verifiedJobs,
  verifiedSkillPairs,
  verifiedSkillStats,
  type DemoRole,
  type Job,
  type RealRoleFamily,
} from './data';
import {
  ArrowButton,
  DataModeSwitch,
  DataNotice,
  EvidenceStrip,
  HeroShader,
  InnerHero,
  type DataMode,
} from './components';
import type {OpportunityPoint} from './opportunity-chart';

function DemoFlag() {
  return <span className="demo-flag">演示数据</span>;
}

function StepLink({number, title, question, result, href}: {number: string; title: string; question: string; result: string; href: string}) {
  return <a className="step-link" href={href}>
    <span className="step-number">{number}</span>
    <div><h3>{title}</h3><p>{question}</p><small>{result}</small></div>
    <ArrowUpRight aria-hidden="true" />
  </a>;
}

export function HomePage() {
  const [mode, setMode] = useState<DataMode>('demo');
  const demoRoles = demoData.roleSignals.slice(0, 4);
  const realRoles = realRoleFamilies.slice(0, 4);
  return <main id="main">
    <section className="home-hero">
      <HeroShader />
      <div className="home-hero-content">
        <p className="hero-kicker">深圳高薪需求研究</p>
        <h1>先别急着找工作，<br />看看市场在为哪些能力付高价。</h1>
        <p>从真实岗位反推能力组合、对标岗位与成长方向。</p>
        <div className="hero-actions"><ArrowButton href="trends.html" tone="orange">开始逆向搜索</ArrowButton><a className="quiet-link" href="jobs.html">直接看真实岗位 <ArrowRight /></a></div>
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
      <div className="slice-head"><div><h2>先看一小块市场切片</h2><p>这里用于判断阅读方式是否顺手，不一次塞满所有图表。</p></div><DataModeSwitch mode={mode} onChange={setMode} /></div>
      <DataNotice mode={mode} />
      <div className="signal-strip">
        {mode === 'demo' ? demoRoles.map(role => <a key={role.id} href={`trends.html#${role.id}`}><DemoFlag /><strong>{role.name}</strong><span>{role.skillCombo.slice(0, 3).join(' + ')}</span><b>{role.salaryMin}-{role.salaryMax}K</b></a>) : realRoles.map(role => <a key={role.name} href="trends.html"><span className="evidence-flag">真实样本</span><strong>{role.name}</strong><span>{role.count} 条岗位，{role.companies} 家企业</span><b>{role.salaryMin}-{role.salaryMax}K</b></a>)}
      </div>
      <div className="slice-foot"><p>{mode === 'demo' ? '演示组让模块完整跑起来，但不会进入任何正式结论。' : '真实组目前偏 AI 与算法，尚不能代表深圳全部高薪岗位。'}</p><a href="trends.html">进入完整发现页 <ArrowRight /></a></div>
    </section>
    <section className="home-cta section-shell"><h2>结论不是终点，岗位原文才是证据。</h2><p>同名岗位由多家公司发布时全部保留，薪资展示 Boss 原始区间，来源直达当前公司岗位详情页。</p><ArrowButton href="jobs.html" tone="dark">查看岗位证据</ArrowButton></section>
  </main>;
}

function DemoRoleView({role}: {role: DemoRole}) {
  return <article className="signal-detail">
    <div className="signal-detail-head"><div><DemoFlag /><h2>{role.name}</h2><p>{role.whyNow}</p></div><div className="salary-range"><small>演示薪资范围</small><strong>{role.salaryMin}-{role.salaryMax}K</strong><span>/月</span></div></div>
    <div className="signal-facts"><div><small>结构假设</small><strong>{role.sampleJobs} 个岗位</strong><span>{role.companyCount} 家企业</span></div><div><small>能力门槛</small><strong>{role.threshold}</strong><span>只用于视觉分层</span></div><div><small>旧能力重组</small><strong>{role.oldAbilityMix}</strong></div></div>
    <div className="combination-block"><h3>企业可能买单的能力组合</h3><div>{role.skillCombo.map(skill => <span key={skill}>{skill}</span>)}</div><p>可能出现的原始岗位名：{role.originalExamples.join('、')}</p></div>
  </article>;
}

function RealRoleView({role}: {role: RealRoleFamily}) {
  const statusLabel = role.status === 'emerging' ? '达到新兴信号门槛' : role.status === 'early-signal' ? '早期信号' : '观察到的岗位族群';
  return <article className="signal-detail">
    <div className="signal-detail-head"><div><span className="evidence-flag">{statusLabel}</span><h2>{role.name}</h2><p>这是对当前 {realEvidence.total} 条岗位快照的归类，不代表完整市场热度，也不是历史趋势。</p></div><div className="salary-range"><small>Boss 原始范围</small><strong>{role.salaryMin}-{role.salaryMax}K</strong><span>/月</span></div></div>
    <div className="signal-facts"><div><small>岗位样本</small><strong>{role.count} 条</strong><span>{role.companies} 家企业，{role.industries} 个行业</span></div><div><small>详情核验</small><strong>{role.verified} 条</strong><span>其余为列表页观察</span></div><div><small>薪资中位</small><strong>{role.salaryMedianMid}K</strong><span>区间中点的中位数</span></div></div>
    <div className="job-evidence-preview"><h3>代表岗位</h3>{role.jobs.slice(0, 4).map(job => <a key={job.id} href={job.sourceUrl} target="_blank" rel="noreferrer"><div><strong>{job.title}</strong><span>{job.company}，{job.district}</span></div><b>{job.salaryText}</b><ExternalLink /></a>)}</div>
  </article>;
}

export function TrendsPage() {
  const [mode, setMode] = useState<DataMode>('demo');
  const [demoId, setDemoId] = useState(demoData.roleSignals[0].id);
  const [realName, setRealName] = useState(realRoleFamilies[0]?.name ?? '');
  const selectedDemo = demoData.roleSignals.find(role => role.id === demoId) ?? demoData.roleSignals[0];
  const selectedReal = realRoleFamilies.find(role => role.name === realName) ?? realRoleFamilies[0];
  const entries = mode === 'demo' ? demoData.roleSignals : realRoleFamilies;
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="逆向搜索" title="先找市场正在加价购买的新组合。" lead="不按自身条件搜索，先看岗位名、薪资和企业需求如何重新组合。" mode={mode} onModeChange={setMode} />
    <div className="content-shell"><DataNotice mode={mode} />
      <section className="signal-browser">
        <div className="signal-tabs" role="group" aria-label="岗位方向">
          {mode === 'demo' ? demoData.roleSignals.map(role => <button key={role.id} className={demoId === role.id ? 'active' : ''} onClick={() => setDemoId(role.id)} aria-pressed={demoId === role.id}><span>{role.name}</span><small>{role.lane}</small></button>) : realRoleFamilies.map(role => <button key={role.name} className={realName === role.name ? 'active' : ''} onClick={() => setRealName(role.name)} aria-pressed={realName === role.name}><span>{role.name}</span><small>{role.count} 条样本</small></button>)}
        </div>
        {mode === 'demo' ? <DemoRoleView role={selectedDemo} /> : selectedReal && <RealRoleView role={selectedReal} />}
      </section>
      <section className="official-context">
        <div className="official-context-head"><div><p className="eyebrow">官方方向佐证</p><h2>这些资料只回答“深圳在往哪里投入”。</h2></div><p>它们不证明某个岗位正在扩招，也不参与 Boss 岗位数量、薪资或能力频率计算。</p></div>
        <div className="official-context-grid">{officialSources.sources.map(source => <a key={source.id} href={source.sourceUrl} target="_blank" rel="noreferrer"><div><span>证据 {source.evidenceGrade}</span><small>{source.publishedAt}</small></div><h3>{source.title}</h3><p>{source.finding}</p><footer><span>{source.supports.slice(0, 3).join(' · ')}</span><ExternalLink aria-hidden="true" /></footer></a>)}</div>
      </section>
      <section className="plain-callout"><div><h2>{mode === 'demo' ? `${entries.length} 个方向只用于测试浏览逻辑` : `${realAnalysis.readiness.emergingRoles.actual} 个方向达到当前新兴信号门槛`}</h2><p>{mode === 'demo' ? '等真实采集恢复后，同样的模块会换成岗位数、公司数、薪资分布和原始链接。' : `当前共归为 ${entries.length} 个岗位族群。只有至少 3 条岗位、2 家公司并含详情证据的方向才会进入新兴信号。`}</p></div><ArrowButton href="skills.html" tone="orange">继续拆能力</ArrowButton></section>
    </div>
  </main>;
}

export function SkillsPage() {
  const [mode, setMode] = useState<DataMode>('demo');
  const [selectedSkillName, setSelectedSkillName] = useState(verifiedSkillStats[0]?.name ?? '');
  const demoBenchmark = demoData.benchmark;
  const topRealCount = verifiedSkillStats[0]?.count || 1;
  const topPublishedPair = verifiedSkillPairs.find(pair => pair.publishable);
  const selectedSkill = verifiedSkillStats.find(skill => skill.name === selectedSkillName) ?? verifiedSkillStats[0];
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="需求拆解" title="高薪岗位通常不是一项技能，而是一组能力。" lead="先看共同出现的能力，再看它们怎样组合成一个新的岗位角色。" mode={mode} onModeChange={setMode} />
    <div className="content-shell"><DataNotice mode={mode} />
      {mode === 'demo' ? <>
        <section className="skill-story">
          <div className="skill-story-main"><DemoFlag /><h2>{demoBenchmark.role}</h2><p>假设研究 50 条同类需求后，页面会先给出四项最稳定的共同要求。</p><div className="skill-frequency">{demoBenchmark.mustHave.map(skill => <div key={skill.name}><div><strong>{skill.name}</strong><span>假设出现 {skill.frequency}%</span></div><i style={{'--skill-width': `${skill.frequency}%`} as React.CSSProperties} /></div>)}</div></div>
          <aside className="skill-combo-card"><small>旧能力重新组合</small><h3>产品判断<br />+ AI 技术理解<br />+ 数据与商业</h3><p>“新职业”常常不是凭空出现，而是旧岗位的责任边界发生了变化。</p></aside>
        </section>
        <section className="combo-examples"><h2>岗位名变了，底层能力从哪里来？</h2><div>{demoData.roleSignals.slice(0, 6).map(role => <article key={role.id}><span>{role.name}</span><strong>{role.oldAbilityMix}</strong><p>{role.skillCombo.join(' + ')}</p></article>)}</div></section>
      </> : <>
        <section className="skill-story">
          <div className="skill-story-main"><span className="evidence-flag">仅统计 {realAnalysis.skills.denominator} 条详情核验</span><h2>当前可核验需求里的高频能力</h2><p>点击一项能力，下面只显示真正命中这项要求的岗位原文。列表页摘要不会进入能力占比。</p><div className="skill-frequency" role="group" aria-label="选择要核验的能力">{verifiedSkillStats.slice(0, 8).map(skill => <button type="button" key={skill.name} className={selectedSkill?.name === skill.name ? 'active' : ''} aria-pressed={selectedSkill?.name === skill.name} onClick={() => setSelectedSkillName(skill.name)}><span><strong>{skill.name}</strong><small>{skill.count}/{verifiedJobs.length} 条</small></span><i style={{'--skill-width': `${(skill.count / topRealCount) * 100}%`} as React.CSSProperties} /></button>)}</div></div>
          <aside className="skill-combo-card"><small>达到展示门槛的共现</small><h3>{topPublishedPair?.pair.join(' + ') ?? '样本不足'}</h3><p>{topPublishedPair ? `在 ${topPublishedPair.count} 条核验需求中共同出现，并可回到岗位原文复核。` : '能力组合至少共同出现 3 次后才展示。当前还没有达到门槛。'}</p></aside>
        </section>
        <section className="requirement-evidence"><div className="evidence-heading"><div><p className="eyebrow">原文证据</p><h2>哪些岗位写了“{selectedSkill?.name ?? '这项能力'}”？</h2></div><span>{selectedSkill?.count ?? 0}/{verifiedJobs.length} 条详情命中</span></div>{selectedSkill?.jobs.map(job => <details key={job.id}><summary><span><strong>{job.title}</strong><small>{job.company}，{job.salaryText}</small></span><ChevronDown /></summary><p>{job.requirementText || job.descriptionExcerpt}</p><a href={job.sourceUrl} target="_blank" rel="noreferrer">打开 Boss 岗位详情 <ExternalLink /></a></details>)}</section>
      </>}
      <section className="plain-callout"><div><h2>能力频率不是学习清单。</h2><p>下一步要锁定一个具体岗位，分清“必须有”“加分项”和“高薪附加责任”。</p></div><ArrowButton href="benchmark.html" tone="dark">进入单岗对标</ArrowButton></section>
    </div>
  </main>;
}

export function BenchmarkPage() {
  const [mode, setMode] = useState<DataMode>('demo');
  const benchmark = demoData.benchmark;
  const bestRealBenchmark = realAnalysis.readiness.benchmark.best;
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="精准对标" title="只选一个岗位，按企业要求决定先学什么。" lead="同岗研究足够多时，学习路线才不靠课程广告和个人感觉。" mode={mode} onModeChange={setMode} />
    <div className="content-shell"><DataNotice mode={mode} />
      {mode === 'demo' ? <>
        <section className="benchmark-head"><div><DemoFlag /><h2>{benchmark.role}</h2><p>假设样本：{benchmark.hypotheticalRequirements} 条岗位需求，{benchmark.hypotheticalCompanies} 家企业</p></div><strong>{benchmark.salaryRange}<span>/月</span></strong></section>
        <section className="benchmark-grid">
          <article className="benchmark-primary"><h3>必须能力</h3>{benchmark.mustHave.map(item => <div key={item.name}><span>{item.name}</span><b>{item.frequency}%</b></div>)}</article>
          <article><h3>加分能力</h3><div className="tag-cloud">{benchmark.bonus.map(item => <span key={item}>{item}</span>)}</div></article>
          <article><h3>高薪附加责任</h3><div className="tag-cloud">{benchmark.highSalaryAdds.map(item => <span key={item}>{item}</span>)}</div></article>
          <article><h3>企业期待的成果</h3><div className="tag-cloud">{benchmark.deliverables.map(item => <span key={item}>{item}</span>)}</div></article>
        </section>
        <section className="learning-order"><h2>按需求倒推学习顺序</h2><ol>{benchmark.learningPriority.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol><p className="method-note">这不是 30 天打卡计划，只展示先后优先级。</p></section>
      </> : <section className="insufficient-state"><Database /><h2>当前还没有任何单岗达到 50 条可核验需求。</h2><p>目前最接近的是“{bestRealBenchmark?.role ?? '尚无候选方向'}”，只有 {bestRealBenchmark?.detailCount ?? 0}/50 条详情证据，来自 {bestRealBenchmark?.companyCount ?? 0} 家公司。这里保留空状态，而不是把不同岗位拼成一个假对标。</p><div><a href="jobs.html">查看现有真实岗位</a><button type="button" onClick={() => setMode('demo')}>查看结构演示</button></div></section>}
      <section className="plain-callout"><div><h2>对标之后，再看薪资升档。</h2><p>成长路径比较的是同一方向在不同薪资区间多出的责任，不是保证晋升的公式。</p></div><ArrowButton href="growth.html" tone="orange">查看成长路径</ArrowButton></section>
    </div>
  </main>;
}

function OpportunityChart({points, isDemo}: {points: OpportunityPoint[]; isDemo: boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let chart: {resize: () => void; dispose: () => void} | undefined;
    let observer: ResizeObserver | undefined;
    void import('./opportunity-chart').then(({createOpportunityChart}) => {
      if (disposed || !ref.current) return;
      chart = createOpportunityChart(ref.current, points, isDemo);
      observer = new ResizeObserver(() => chart?.resize());
      observer.observe(ref.current);
    });
    return () => { disposed = true; observer?.disconnect(); chart?.dispose(); };
  }, [points, isDemo]);
  return <div ref={ref} className="opportunity-chart" role="img" aria-label="横轴为市场需求，纵轴为薪资上限，气泡大小代表岗位样本数量，颜色和形状共同表示能力门槛" />;
}

export function GrowthPage() {
  const [mode, setMode] = useState<DataMode>('demo');
  const [pathIndex, setPathIndex] = useState(0);
  const demoPath = demoData.growthPaths[pathIndex];
  const demoPoints = useMemo<OpportunityPoint[]>(() => demoData.roleSignals.map(role => ({name: role.name, demand: role.demandScore, salaryMax: role.salaryMax, count: role.sampleJobs, threshold: role.threshold})), []);
  const maxRealCount = Math.max(...realRoleFamilies.map(role => role.count), 1);
  const realPoints = useMemo<OpportunityPoint[]>(() => realRoleFamilies.map(role => ({name: role.name, demand: Math.round((role.count / maxRealCount) * 85), salaryMax: role.salaryMax, count: role.count, threshold: role.salaryMax >= 100 ? '极高' : role.salaryMax >= 70 ? '高' : '中高'})), [maxRealCount]);
  return <main id="main" className="inner-main">
    <InnerHero eyebrow="趋势预判" title="把需求、薪资和能力门槛放在同一张图上。" lead="先找到机会位置，再看从 30K 到 50K、100K 需要补什么。" mode={mode} onModeChange={setMode} />
    <div className="content-shell"><DataNotice mode={mode} />
      <section className="map-section"><div className="map-head"><div><h2>机会地图</h2><p>{mode === 'demo' ? '完整交互使用结构假设，便于判断气泡图是否值得保留。' : '基于当前岗位数量和薪资的截面比较，不表达历史涨跌。'}</p></div><span>{mode === 'demo' ? '结构假设' : '真实样本'}</span></div><OpportunityChart points={mode === 'demo' ? demoPoints : realPoints} isDemo={mode === 'demo'} /><div className="chart-legend" aria-label="能力门槛图例"><span><i data-shape="circle" />中</span><span><i data-shape="diamond" />中高</span><span><i data-shape="square" />高</span><span><i data-shape="triangle" />极高</span></div><p className="chart-summary">横轴越右，样本需求越集中；纵轴越高，原始薪资上限越高；气泡越大，岗位样本越多。颜色与形状同时区分能力门槛。</p></section>
      {mode === 'demo' ? <section className="growth-path-section"><div className="path-selector" role="group" aria-label="成长路径方向">{demoData.growthPaths.map((path, index) => <button key={path.role} className={index === pathIndex ? 'active' : ''} aria-pressed={index === pathIndex} onClick={() => setPathIndex(index)}>{path.role}</button>)}</div><div className="growth-path-head"><h2>{demoPath.role}的能力升档</h2><DemoFlag /></div><div className="growth-lane">{demoPath.stages.map(stage => <article key={stage.band}><span>{stage.band}</span><h3>{stage.title}</h3><div>{stage.skills.map(skill => <small key={skill}>{skill}</small>)}</div></article>)}</div></section> : <section className="real-paths"><h2>真实数据能支持到哪一步？</h2><p>{realAnalysis.timeSeries.statement} 以下只展示不同薪资档的样本分布，不把它解释成必然晋升路线。</p><div>{realRoleFamilies.slice(0, 6).map(role => <article key={role.name}><h3>{role.name}</h3><p>{role.count} 条岗位，薪资 {role.salaryMin}-{role.salaryMax}K</p><div className="band-dots">{(['30K', '50K', '100K'] as const).map(band => <span key={band} className={role.jobs.some(job => salaryBandFromMid(job) === band) ? 'has-data' : ''}>{band}</span>)}</div></article>)}</div></section>}
      {mode === 'real' && <section className="expansion-section"><div className="expansion-head"><div><p className="eyebrow">同一快照的多岗位信号</p><h2>哪些企业一次出现了多个高薪岗位？</h2></div><p>这里只能说明同一采集批次里的岗位聚集，不能称为持续扩招。下一次快照出现后才判断是否反复招聘。</p></div><div className="expansion-list">{realAnalysis.expansionSignals.map(signal => <article key={signal.company}><div><strong>{signal.company}</strong><span>{signal.jobCount} 条岗位，{signal.distinctTitles} 个不同名称</span></div><div>{signal.evidenceJobs.slice(0, 3).map(job => <a key={job.id} href={job.sourceUrl} target="_blank" rel="noreferrer"><span>{job.title}</span><small>{job.salaryText}</small><ExternalLink /></a>)}</div></article>)}</div></section>}
      <section className="plain-callout"><div><h2>气泡图只负责找到方向。</h2><p>最后仍要回到具体公司、真实薪资和岗位要求，确认这个方向是否适合继续研究。</p></div><ArrowButton href="jobs.html" tone="dark">打开岗位证据</ArrowButton></section>
    </div>
  </main>;
}

type SortMode = 'salary-desc' | 'salary-asc' | 'recent';

function JobCard({job}: {job: Job}) {
  return <article className="job-card">
    <div className="job-card-main"><div className="job-card-title"><span className={job.status === 'verified' ? 'evidence-flag' : 'listing-flag'}>{job.status === 'verified' ? '详情已核验' : '列表页观察'}</span><h2>{job.title}</h2><p>{job.company}</p></div><div className="job-salary"><strong>{job.salaryText}</strong><span>{salaryBandFromMid(job)} 统计档</span></div></div>
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
    <InnerHero eyebrow="岗位证据库" title="薪资看原始区间，来源直达具体公司岗位。" lead="统计档位只服务图表，岗位库始终保留 Boss 展示的真实薪资。" />
    <div className="content-shell"><aside className="data-notice real-notice"><div><Database /><strong>这里只展示真实岗位</strong></div><p>演示数据不会进入岗位库。当前共 {realEvidence.total} 条，其中 {realEvidence.verified} 条保存了详情页要求。</p></aside>
      <section className="job-toolbar" aria-label="岗位筛选">
        <label className="search-field"><span>搜索岗位或公司</span><div><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="例如：AI、vivo" /></div></label>
        <div className="filter-fields"><label><span>行业</span><select value={industry} onChange={event => setIndustry(event.target.value)}><option>全部行业</option>{industryOptions.map(item => <option key={item}>{item}</option>)}</select></label><label><span>区域</span><select value={district} onChange={event => setDistrict(event.target.value)}><option>全部区域</option>{districtOptions.map(item => <option key={item}>{item}</option>)}</select></label><label><span>薪资</span><select value={band} onChange={event => setBand(event.target.value)}><option>全部薪资</option><option>30K</option><option>50K</option><option>100K</option></select></label><label><span>排序</span><select value={sort} onChange={event => setSort(event.target.value as SortMode)}><option value="salary-desc">薪资上限从高到低</option><option value="salary-asc">薪资下限从低到高</option><option value="recent">采集时间从新到旧</option></select></label></div>
      </section>
      <div className="job-result-head"><p><Filter /> 找到 <strong>{filteredJobs.length}</strong> 条岗位</p><span>{filteredJobs.length ? `第 ${safePage}/${totalPages} 页 · 每页最多 ${pageSize} 条` : '当前筛选没有结果'}</span></div>
      <section className="job-list">{filteredJobs.length ? visibleJobs.map(job => <JobCard key={job.id} job={job} />) : <div className="empty-results"><Search /><h2>没有匹配的岗位</h2><p>试着放宽行业、区域或薪资条件。</p></div>}</section>
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
    <InnerHero eyebrow="方法与边界" title="哪些是证据，哪些只是为了测试页面？" lead="把真实样本、列表观察和结构演示分开，避免漂亮页面掩盖数据缺口。" />
    <div className="content-shell method-content">
      <section className="method-levels"><article><span className="evidence-flag">详情已核验</span><h2>{verifiedJobs.length} 条</h2><p>保存了岗位详情要求，可用于能力词频和原文核验。</p></article><article><span className="listing-flag">列表页观察</span><h2>{candidateJobs.length} 条</h2><p>保存了岗位、公司和薪资，可用于发现岗位，不能进入正式能力占比。</p></article><article><DemoFlag /><h2>{demoData.roleSignals.length} 个方向</h2><p>完全独立的结构假设，只用于评判页面逻辑，不进入任何正式统计。</p></article></section>
      <section className="readiness-section"><div><p className="eyebrow">正式版进度</p><h2>哪些结论已经能说，哪些还不能？</h2><p>达到门槛的模块才会从结构演示切换为默认真实证据。</p></div><div className="readiness-list">{readinessItems.map(item => <article key={item.label}><div><strong>{item.label}</strong><span>{item.actual}/{item.target} {item.unit}</span></div><progress value={item.actual} max={item.target} aria-label={`${item.label}：${item.actual}/${item.target} ${item.unit}`} /></article>)}</div></section>
      <section className="method-rules"><h2>页面如何避免混淆</h2><div><article><strong>默认分组</strong><p>所有分析页都有“结构演示 / 真实证据”切换，两组不在同一张图里叠加。</p></article><article><strong>统计隔离</strong><p>真实样本量只从 verified.json 与 candidates.json 计算，演示文件标记 excludedFromFormalStats。</p></article><article><strong>来源隔离</strong><p>真实岗位链接直达 Boss 岗位详情。演示数据不生成公司名，不生成虚构岗位链接。</p></article><article><strong>结论降级</strong><p>没有 50 条同岗需求时，单岗对标显示空状态，不把邻近岗位硬拼成正式结论。</p></article></div></section>
      <section className="method-boundary"><h2>当前数据边界</h2><p>最近一次真实采集时间：{new Date(capturedAt).toLocaleString('zh-CN')}。当前账号触发平台风控，采集已经停止。现有样本明显偏 AI、算法、机器人和技术岗位，因此不能代表深圳全行业高薪市场，也不能表达薪资历史涨跌。</p><a href="jobs.html">查看全部真实样本 <ArrowRight /></a></section>
    </div>
  </main>;
}
