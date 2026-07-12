import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight, Menu, X} from 'lucide-react';
import {Shader, Swirl} from 'shaders/react';
import {jobs, capturedAt, type Job} from './data';
import './style.css';

const path = location.pathname.split('/').pop() || 'index.html';
const page = path === 'growth.html' || ['map.html','skills.html'].includes(path) ? 'growth' : path === 'jobs.html' ? 'jobs' : 'home';

function Header(){
  const [open,setOpen]=useState(false);
  const links=[['index.html','高薪机会','home'],['growth.html','成长路径','growth'],['jobs.html','真实岗位','jobs']];
  return <header className="site-head"><a className="brand" href="index.html"><i>◆</i><span>深圳高薪岗位观察</span></a><nav>{links.map(([href,label,key])=><a key={href} className={page===key?'active':''} href={href}>{label}</a>)}</nav><a className="nav-cta" href="jobs.html"><span>浏览真实岗位</span><ArrowUpRight/></a><button className="menu" aria-label="打开导航" onClick={()=>setOpen(true)}><Menu/></button>{open&&<div className="mobile-menu"><button onClick={()=>setOpen(false)} aria-label="关闭"><X/></button>{links.map(([href,label])=><a key={href} href={href}>{label}</a>)}</div>}</header>
}

function HeroArt(){return <div className="hero-art" aria-hidden="true"><Shader className="shader" disableTelemetry colorSpace="srgb"><Swirl colorA="#ffffff" colorB="#ff5f03" detail={1.7} blend={68} speed={0.15}/></Shader></div>}

const bands=[
  {salary:'30K',role:'AI 应用工程师',combo:'专业能力 + AI 工具 + 业务落地'},
  {salary:'50K',role:'算法 / 产品专家',combo:'深度专长 + 数据判断 + 项目主导'},
  {salary:'100K',role:'技术或业务负责人',combo:'稀缺经验 + 战略决策 + 组织结果'},
];

function Home(){return <><section className="hero"><HeroArt/><div className="hero-copy"><p className="eyebrow">SHENZHEN · HIGH-SALARY JOBS</p><h1>深圳高薪岗位，<br/>究竟在为什么能力付钱？</h1><span className="orange-line"/><p className="lead">看清机会、薪资和能力组合，用真实市场信号找到下一步。</p><div className="terms"><span>◎ 岗位热度：招聘活跃度</span><span>◎ 能力共现：能力组合出现频率</span><span>◎ 横截面样本：当前公开岗位</span></div></div><div className="band-row">{bands.map(b=><article key={b.salary}><div><small>统计参考区间</small><strong>{b.salary}<em>/月</em></strong></div><div><h2>{b.role}</h2><p>{b.combo}</p></div></article>)}</div><p className="hero-note">* 薪资档位用于观察市场结构；具体岗位以 Boss 直聘页面显示为准。</p></section><section className="story"><p className="section-no">01 / 高薪机会</p><h2>先看市场愿意为哪类结果付钱</h2><div className="story-grid"><article><span>机会集中</span><h3>AI 从“会用”走向“能落地”</h3><p>高薪不只奖励模型知识，更看重工程部署、业务闭环和持续优化。</p></article><article><span>跨境增长</span><h3>海外能力正在与产品、渠道重组</h3><p>英语只是入场券，真正拉开差距的是市场判断、GTM 与经营结果。</p></article><article><span>高阶岗位</span><h3>100K 更常买单于稀缺判断</h3><p>技术深度之外，企业也在为路线决策、团队带领和资源整合付费。</p></article></div></section></>}

const levels={
 '30K':{title:'从单点技能，到可交付的工作结果',roles:'AI 应用工程师 · 数据分析 · 海外运营',now:['能独立使用专业工具','理解业务目标','完成清晰交付'],next:['补一项 AI / 数据能力','做出可展示案例','把成果写成数字']},
 '50K':{title:'从执行者，到能主导复杂项目',roles:'算法专家 · 产品专家 · 增长负责人',now:['有清晰的专业纵深','能跨团队推动项目','能解释结果与取舍'],next:['形成行业判断','补齐商业化能力','负责完整项目闭环']},
 '100K':{title:'从项目负责人，到稀缺问题的决策者',roles:'技术负责人 · 业务负责人 · 研究总监',now:['决定方向与优先级','承担组织级结果','整合人才、技术与资源'],next:['建立可复制方法','扩大决策影响范围','沉淀稀缺行业经验']}
};
function Growth(){const [level,setLevel]=useState<keyof typeof levels>('30K');const d=levels[level];return <main className="inner"><p className="eyebrow">GROWTH PATH</p><h1>高薪不是跳档，<br/>而是能力组合不断升级。</h1><p className="page-lead">选择一个大概薪资阶段，只看这个阶段最重要的能力和下一步。</p><div className="level-tabs">{Object.keys(levels).map(x=><button className={x===level?'active':''} onClick={()=>setLevel(x as keyof typeof levels)}>{x}</button>)}</div><section className="growth-card"><div><small>{level} 阶段的核心变化</small><h2>{d.title}</h2><p>{d.roles}</p></div><div><h3>企业现在看什么</h3>{d.now.map(x=><p>— {x}</p>)}</div><div><h3>下一步补什么</h3>{d.next.map(x=><p>— {x}</p>)}</div></section><section className="combo"><p className="section-no">能力组合示例</p><h2>新岗位，往往是旧能力的新组合</h2><div className="combo-row"><span>行业经验</span><b>＋</b><span>AI / 数据</span><b>＋</b><span>业务结果</span><b>＝</b><strong>更高价值</strong></div><p className="annotation">能力共现：多项能力在同一岗位要求里同时出现。</p></section></main>}

function Jobs(){const [industry,setIndustry]=useState('全部');const [district,setDistrict]=useState('全部');const [salary,setSalary]=useState('全部');const [sort,setSort]=useState('高薪优先'); const opts=(k:keyof Job)=>['全部',...new Set(jobs.map(j=>String(j[k])))]; const list=useMemo(()=>jobs.filter(j=>(industry==='全部'||j.industry===industry)&&(district==='全部'||j.district===district)&&(salary==='全部'||(salary==='30K'?j.salaryMin<40:salary==='50K'?j.salaryMax>=40&&j.salaryMin<70:j.salaryMax>=70))).sort((a,b)=>sort==='高薪优先'?b.salaryMax-a.salaryMax:a.title.localeCompare(b.title,'zh-CN')),[industry,district,salary,sort]);return <main className="inner jobs-page"><p className="eyebrow">REAL JOBS</p><h1>先看真实薪资，<br/>再判断它值不值得研究。</h1><p className="page-lead">同一岗位的不同公司会分别显示。薪资保留岗位页面原始月薪写法。</p><section className="filters"><label>行业<select value={industry} onChange={e=>setIndustry(e.target.value)}>{opts('industry').map(x=><option>{x}</option>)}</select></label><label>区域<select value={district} onChange={e=>setDistrict(e.target.value)}>{opts('district').map(x=><option>{x}</option>)}</select></label><label>薪资<select value={salary} onChange={e=>setSalary(e.target.value)}>{['全部','30K','50K','100K'].map(x=><option>{x}</option>)}</select></label><label>排序<select value={sort} onChange={e=>setSort(e.target.value)}><option>高薪优先</option><option>岗位名称</option></select></label></section><div className="result-head"><span>{list.length} 个岗位样本</span><small>采集于 {capturedAt}</small></div><section className="job-list">{list.map(j=><article><div><h2>{j.title}</h2><p>{j.company} · {j.district} · {j.industry}</p></div><strong>{j.salaryText}</strong><div className="job-meta"><span>{j.experience}</span><span>{j.education}</span>{j.skills.slice(0,3).map(s=><span>{s}</span>)}</div><a href={j.sourceUrl} target="_blank" rel="noreferrer">查看 Boss 来源 <ArrowUpRight/></a></article>)}</section><p className="data-warning">当前页面正在逐条补齐“公司—岗位详情页”直链。未核验完成的记录不会被标记为详情直链，岗位可能随招聘状态下线。</p></main>}

function App(){return <><Header/>{page==='home'?<Home/>:page==='growth'?<Growth/>:<Jobs/>}<footer><div><b>深圳高薪岗位观察</b><p>公开岗位的市场快照，不构成求职或薪酬承诺。</p></div><div><a href="index.html">高薪机会</a><a href="growth.html">成长路径</a><a href="jobs.html">真实岗位</a></div></footer></>}

createRoot(document.getElementById('app')!).render(<React.StrictMode><App/></React.StrictMode>);
