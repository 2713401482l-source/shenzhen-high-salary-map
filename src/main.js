import * as echarts from 'echarts';
import { createIcons, Menu } from 'lucide';
import { jobs, sources } from './data/jobs.js';
import './style.css';
import './utilities.css';

const page = document.body.dataset.page || 'home';
const pages = [['home','index.html','总览'],['trends','trends.html','岗位趋势'],['skills','skills.html','能力需求'],['map','map.html','赚钱地图'],['jobs','jobs.html','岗位库'],['method','method.html','方法与来源']];
const bands = ['30K','50K','100K'];
const bandCounts = Object.fromEntries(bands.map(b => [b, jobs.filter(j => j.salaryBand === b).length]));
const avgSalary = Math.round(jobs.reduce((sum,j) => sum + j.salaryMid, 0) / jobs.length);
const unique = key => new Set(jobs.map(j => j[key])).size;
const top = (key,n=8,list=jobs) => Object.entries(list.reduce((m,j) => { const v = typeof key === 'function' ? key(j) : j[key]; m[v]=(m[v]||0)+1; return m; },{})).sort((a,b)=>b[1]-a[1]).slice(0,n);

function header(){ return `<header class="site-header"><nav class="nav-wrap" aria-label="主导航"><a class="brand" href="index.html"><span class="brand-mark"></span>深圳高薪岗位观察</a><button class="menu-btn" aria-expanded="false" aria-controls="nav-links"><i data-lucide="menu"></i><span class="sr-only">菜单</span></button><div class="nav-links" id="nav-links">${pages.map(([id,url,label])=>`<a href="${url}" ${page===id?'aria-current="page"':''}>${label}</a>`).join('')}</div></nav></header>`; }
function footer(){ return `<footer class="footer"><div class="container footer-grid"><p>采集于 2026-07-12 · 当前公开样本 ${jobs.length} 条 · 岗位随时变化，以平台为准</p><a href="method.html">查看研究口径与局限 →</a></div></footer>`; }
function render(content){ document.querySelector('#app').innerHTML = header()+`<main id="main">${content}</main>`+footer(); const btn=document.querySelector('.menu-btn'); const links=document.querySelector('.nav-links'); btn?.addEventListener('click',()=>{const open=links.classList.toggle('open');btn.setAttribute('aria-expanded',String(open))}); createIcons({icons:{Menu}}); }
function hero(title,desc,tags=''){ return `<section class="page-hero"><div class="container"><h1>${title}</h1><p>${desc}</p>${tags?`<div class="evidence">${tags}</div>`:''}</div></section>`; }
function section(title,desc,body,alt=false){ return `<section class="section ${alt?'alt':''}"><div class="container"><div class="section-head"><h2>${title}</h2><p>${desc}</p></div>${body}</div></section>`; }
function ranking(items){ return `<ol class="rank-list">${items.map(([name,count],i)=>`<li><small>${String(i+1).padStart(2,'0')}</small><b>${name}</b><span>${count} 个样本</span></li>`).join('')}</ol>`; }
function draw(id,option){ const el=document.getElementById(id); if(!el)return; const instance=echarts.init(el); instance.setOption({...option,textStyle:{fontFamily:'Inter, PingFang SC, Microsoft YaHei, sans-serif'}}); new ResizeObserver(()=>instance.resize()).observe(el); }
const colors=['#315aa9','#d88a1d','#a44780','#2d8969','#6e57a5','#c35c45'];

function home(){
  render(`<section class="hero"><div class="container hero-grid"><div><h1>高薪不是职位名，是能力的重新组合。</h1><p>从 ${jobs.length} 个可核验的深圳公开岗位样本出发，拆解30K、50K、100K三档需求。先看市场要什么，再决定自己学什么。</p></div><div class="stamp"><strong>¥${avgSalary}K</strong><span>样本月薪区间中位数均值</span><div class="evidence">${bands.map(b=>`<span class="tag band-${b}">${b}档 ${bandCounts[b]}</span>`).join('')}</div></div></div></section>`+
  section('先读四个数字','这是受公开访问限制的验证样本，不代表深圳全部岗位。',`<div class="metrics"><div class="metric"><b>${jobs.length}</b><span>可核验岗位</span></div><div class="metric"><b>${unique('company')}</b><span>招聘企业</span></div><div class="metric"><b>${unique('normalizedRole')}</b><span>归一化岗位</span></div><div class="metric"><b>${new Set(jobs.flatMap(j=>j.skills)).size}</b><span>能力标签</span></div></div>`)+
  section('100K档出现两条清晰路径','从50K迈向100K，企业购买的不只是执行能力，而是技术路线、团队、全球资源与业务结果。',`<div class="insight-grid"><article class="lead-insight"><h3>专家路线 × 经营路线</h3><p>算法专家集中在强化学习、感知、ISP、音频与大模型；经营负责人集中在海外营销、全球采购、产品战略和组织管理。</p><a class="source-link" href="map.html" style="color:white">打开赚钱地图 →</a></article><div><h3>高频归一化岗位</h3>${ranking(top('normalizedRole',5))}</div></div>`,true)+
  section('三档薪资的能力重心','30K重工程执行，50K重复杂系统，100K重专家判断或组织杠杆。',`<div class="chart-grid"><article class="chart-panel"><h3>各档样本量</h3><p>目标为每档50条，当前因公开访问限制未达标。</p><div id="bandChart" class="chart" role="img" aria-label="三个薪资档样本量柱状图"></div></article><article class="chart-panel"><h3>行业分布</h3><p>AI、智能硬件、互联网和消费电子占主体。</p><div id="industryChart" class="chart" role="img" aria-label="行业样本分布环形图"></div></article></div>`));
  draw('bandChart',{tooltip:{},xAxis:{type:'category',data:bands},yAxis:{type:'value'},series:[{type:'bar',data:bands.map(b=>bandCounts[b]),barWidth:'52%',itemStyle:{color:p=>colors[p.dataIndex],borderRadius:[6,6,0,0]}}]});
  draw('industryChart',{tooltip:{trigger:'item'},legend:{bottom:0},series:[{type:'pie',radius:['40%','68%'],data:top('industry',7).map(([name,value])=>({name,value})),label:{formatter:'{b}\n{d}%'}}]});
}

function trends(){
  const expansion=[...jobs].sort((a,b)=>b.expansionSignal-a.expansionSignal).slice(0,8);
  render(hero('岗位趋势','这里的“趋势”是招聘热度、集中扩招和薪资结构的截面信号，不是历史时间序列。','<span class="tag">公开样本</span><span class="tag">横截面观察</span><span class="tag">权威资料校验</span>')+
  section('需求聚集在哪里','高薪机会明显集中于AI技术、智能硬件和面向全球市场的经营岗位。',`<div class="chart-grid"><article class="chart-panel"><h3>行业样本分布</h3><div id="industryBar" class="chart tall"></div></article><article class="chart-panel"><h3>深圳区域分布</h3><div id="districtBar" class="chart tall"></div></article></div>`)+
  section('扩招信号','基于同企业同类岗位出现频率与页面中的并行招聘信号，仅用于样本内排序。',`<ol class="rank-list">${expansion.map((j,i)=>`<li><small>${String(i+1).padStart(2,'0')}</small><b>${j.company} · ${j.normalizedRole}</b><span>信号 ${j.expansionSignal}/4</span></li>`).join('')}</ol>`,true)+
  section('权威资料交叉验证','外部证据支持AI、跨境业务、低空经济和智能终端是深圳人才需求的重要方向。',sourceMarkup()));
  horizontal('industryBar',top('industry',10),colors[0]); horizontal('districtBar',top('district',8),colors[1]);
}
function horizontal(id,data,color){ draw(id,{tooltip:{},grid:{left:105,right:20},xAxis:{type:'value'},yAxis:{type:'category',data:data.map(x=>x[0]).reverse()},series:[{type:'bar',data:data.map(x=>x[1]).reverse(),itemStyle:{color,borderRadius:[0,5,5,0]}}]}); }
function sourceMarkup(){ return `<div class="source-list">${sources.map(s=>`<article class="source-item"><small>${s.publisher}<br>${s.date}</small><div><strong>${s.title}</strong><p>${s.finding}</p></div><a class="source-link" target="_blank" rel="noreferrer" href="${s.url}">原文 ↗</a></article>`).join('')}</div>`; }

function skills(){
  const skillRows=jobs.flatMap(j=>j.skills.map(skill=>({skill}))); const frequent=top('skill',16,skillRows);
  const perBand=bands.map(b=>{const rows=jobs.filter(j=>j.salaryBand===b).flatMap(j=>j.skills.map(skill=>({skill})));return top('skill',6,rows)});
  render(hero('能力需求','职位名称会变化，能力组合更稳定。把岗位要求拆成可学习、可验证、可迁移的能力单元。')+
  section('高频能力','LLM、Agent、机器学习和多模态成为技术岗位共同底座；管理与全球化能力在100K档上升。',`<div class="chart-panel"><div id="skillChart" class="chart tall"></div></div>`)+
  section('不同薪资档，企业买的是什么','频次只在当前档位样本内比较，适合找线索，不适合推断全市场概率。',`<div class="chart-grid">${perBand.map((list,i)=>`<article class="chart-panel"><h3>${['30K：可靠执行','50K：复杂系统','100K：专家判断与杠杆'][i]}</h3>${ranking(list)}</article>`).join('')}</div>`,true)+
  section('新职业 = 旧能力重组','高薪新岗位通常是已有能力在新业务场景里的重新打包。',`<div class="formula"><article><h3>AI Agent专家</h3><p>后端工程 + LLM + 任务规划 + 工具调用 + 业务落地</p></article><article><h3>具身智能科学家</h3><p>强化学习 + 机器人控制 + 仿真平台 + Sim2Real</p></article><article><h3>海外营销负责人</h3><p>英语 + GTM + 渠道管理 + 消费电子 + 团队领导</p></article></div>`));
  horizontal('skillChart',frequent,colors[0]);
}

function mapPage(){
  const grouped={}; jobs.forEach(j=>{const g=grouped[j.normalizedRole]||={count:0,salary:0,skills:new Set(),name:j.normalizedRole};g.count++;g.salary+=j.salaryMid;j.skills.forEach(s=>g.skills.add(s))});
  const bubbles=Object.values(grouped).map(g=>[g.count,g.salary/g.count,g.count*10+12,g.skills.size,g.name]);
  render(hero('赚钱地图','需求量 × 薪资水平 × 能力门槛，把职位名称转换成可以比较的机会结构。')+
  section('机会矩阵','右上角代表样本需求较多且薪资较高；左上角代表稀缺高价机会。',`<article class="chart-panel"><div id="bubble" class="chart tall" role="img" aria-label="岗位机会气泡图"></div></article><div class="callout"><strong>读图提醒：</strong>当前只有 ${jobs.length} 条公开样本，气泡图只比较本报告内部结构。</div>`)+
  section('三档跃迁路径','向上跃迁不是堆更多工具，而是扩大问题复杂度、业务影响范围和不可替代性。',`<div class="path"><article class="path-step"><span class="tag band-30K">30K档</span><h3>可靠执行</h3><p>掌握Python/C++、数据处理、模型调用或具体行业流程，能独立交付任务。</p><span class="path-arrow">复杂系统经验 →</span></article><article class="path-step"><span class="tag band-50K">50K档</span><h3>复杂系统</h3><p>能做模型优化、Agent架构、多模态、产品策略或增长闭环，并对结果负责。</p><span class="path-arrow">稀缺专长与组织杠杆 →</span></article><article class="path-step"><span class="tag band-100K">100K档</span><h3>专家判断</h3><p>主导技术路线、全球资源、关键团队或经营结果，把个人能力放大成组织产出。</p></article></div>`,true)+
  section('区域观察','样本说明南山区是技术高薪岗位主要聚集地，但不足以制作精确地理热力图。',`<div id="districtPie" class="chart"></div>`));
  draw('bubble',{tooltip:{formatter:p=>`${p.value[4]}<br>样本 ${p.value[0]} · 均值 ${Math.round(p.value[1])}K<br>能力标签 ${p.value[3]}类`},xAxis:{name:'样本需求量',min:0},yAxis:{name:'月薪中位数（K）'},visualMap:{min:3,max:12,dimension:3,orient:'horizontal',left:'center',bottom:0,inRange:{color:['#efb85a','#b65361','#394f9a']},text:['门槛高','门槛低']},series:[{type:'scatter',data:bubbles,symbolSize:v=>v[2],label:{show:true,formatter:p=>p.value[4],position:'top',fontSize:10}}]});
  draw('districtPie',{tooltip:{trigger:'item'},legend:{bottom:0},series:[{type:'pie',radius:['38%','68%'],data:top('district',8).map(([name,value])=>({name,value})),label:{formatter:'{b} {c}'}}]});
}

function jobsPage(){
  render(hero('岗位数据库','搜索并筛选本次已核验的公开岗位。来源链接可回到Boss直聘聚合页复核。')+`<section class="section"><div class="container"><div class="filters"><input id="q" aria-label="搜索岗位、企业或能力" placeholder="搜索岗位、企业或能力"><select id="band" aria-label="薪资档"><option value="">全部薪资档</option>${bands.map(b=>`<option>${b}</option>`).join('')}</select><select id="industry" aria-label="行业"><option value="">全部行业</option>${[...new Set(jobs.map(j=>j.industry))].sort().map(x=>`<option>${x}</option>`).join('')}</select><select id="district" aria-label="区域"><option value="">全部区域</option>${[...new Set(jobs.map(j=>j.district))].sort().map(x=>`<option>${x}</option>`).join('')}</select><select id="sort" aria-label="排序"><option value="salary-desc">薪资从高到低</option><option value="salary-asc">薪资从低到高</option><option value="expansion">扩招信号</option></select></div><p id="resultCount" aria-live="polite"></p><div class="table-wrap"><table><thead><tr><th>岗位</th><th>薪资</th><th>企业 / 行业</th><th>区域 / 门槛</th><th>核心能力</th><th>来源</th></tr></thead><tbody id="jobRows"></tbody></table></div><div class="mobile-jobs" id="mobileJobs"></div></div></section>`);
  const controls=['q','band','industry','district','sort'].map(id=>document.getElementById(id));
  const update=()=>{const [q,band,industry,district,sort]=controls.map(x=>x.value);let list=jobs.filter(j=>(!band||j.salaryBand===band)&&(!industry||j.industry===industry)&&(!district||j.district===district)&&(!q||[j.title,j.company,j.normalizedRole,...j.skills].join(' ').toLowerCase().includes(q.toLowerCase())));list.sort((a,b)=>sort==='salary-asc'?a.salaryMid-b.salaryMid:sort==='expansion'?b.expansionSignal-a.expansionSignal:b.salaryMid-a.salaryMid);document.getElementById('resultCount').textContent=`找到 ${list.length} 个岗位`;document.getElementById('jobRows').innerHTML=list.map(jobRow).join('');document.getElementById('mobileJobs').innerHTML=list.map(jobCard).join('')||'<div class="empty">没有符合条件的岗位，请调整筛选。</div>';};
  controls.forEach(x=>x.addEventListener(x.tagName==='INPUT'?'input':'change',update)); update();
}
function jobRow(j){return `<tr><td><strong>${j.title}</strong><small>${j.normalizedRole}</small></td><td><span class="tag band-${j.salaryBand}">${j.salaryMin}-${j.salaryMax}K</span></td><td>${j.company}<br><small>${j.industry}</small></td><td>${j.district}<br><small>${j.experience} · ${j.education}</small></td><td>${j.skills.map(s=>`<span class="tag">${s}</span>`).join(' ')}</td><td><a class="source-link" target="_blank" rel="noreferrer" href="${j.sourceUrl}">核验 ↗</a></td></tr>`;}
function jobCard(j){return `<article class="job-card"><span class="tag band-${j.salaryBand}">${j.salaryMin}-${j.salaryMax}K</span><h3>${j.title}</h3><p>${j.company} · ${j.district} · ${j.experience}</p><div>${j.skills.map(s=>`<span class="tag">${s}</span>`).join(' ')}</div><details><summary>查看岗位摘要</summary><p>${j.description}</p><a class="source-link" target="_blank" rel="noreferrer" href="${j.sourceUrl}">打开Boss来源 ↗</a></details></article>`;}

function method(){
  render(hero('方法与来源','这是一份可追溯的市场观察，不是一份“高薪岗位排行榜”。')+
  section('样本口径','Boss直聘主搜索页面对自动访问有限制，首版只收录可通过公开SEO页面核验的岗位。',`<div class="metrics"><div class="metric"><b>${jobs.length}</b><span>已核验岗位</span></div>${bands.map(b=>`<div class="metric"><b>${bandCounts[b]}</b><span>${b}档</span></div>`).join('')}</div><div class="callout" style="margin-top:24px"><strong>未达到原目标：</strong>三个档位均未达到每档50条。报告不会复制岗位或生成虚构职位补齐，因此所有比例只代表本报告内部样本。</div>`)+
  section('薪资归档','使用区间中位数互斥归档，避免同一个岗位重复进入多个档位。',`<div class="formula"><article><h3>30K档</h3><p>中位数低于40K，且岗位区间能够触达约30K。</p></article><article><h3>50K档</h3><p>中位数为40K至低于75K。</p></article><article><h3>100K档</h3><p>中位数达到或超过75K。</p></article></div>`,true)+
  section('研究限制','理解这些边界，才能正确使用报告。',`<ol class="rank-list"><li><small>01</small><b>横截面，不是历史趋势</b><span>不能证明薪资正在上涨</span></li><li><small>02</small><b>公开可访问样本</b><span>不是平台全量岗位</span></li><li><small>03</small><b>招聘薪资不是实际收入</b><span>不含谈薪与绩效差异</span></li><li><small>04</small><b>岗位描述由企业发布</b><span>真实性需进一步沟通</span></li></ol>`)+
  section('外部来源','只使用政府、政府部门和公开人才目录作为行业方向佐证。',sourceMarkup(),true));
}

({home,trends,skills,map:mapPage,jobs:jobsPage,method}[page]||home)();
