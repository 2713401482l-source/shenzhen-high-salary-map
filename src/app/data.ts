export type Job = {
  id: string; title: string; company: string; salaryMin: number; salaryMax: number;
  salaryText: string; district: string; industry: string; experience: string;
  education: string; skills: string[]; sourceUrl: string; verified: boolean;
};

export const jobs: Job[] = [
  {id:'01',title:'AI Agent 算法开发',company:'深度赋智',salaryMin:20,salaryMax:35,salaryText:'20–35K',district:'宝安区',industry:'人工智能',experience:'3–5年',education:'本科',skills:['LLM','Agent','Python'],sourceUrl:'https://www.zhipin.com/zhaopin/017b2c17109b23c303dy396-GA~~/',verified:false},
  {id:'02',title:'算法工程师（医疗险营销）',company:'腾讯',salaryMin:25,salaryMax:35,salaryText:'25–35K',district:'南山区',industry:'互联网',experience:'3–5年',education:'硕士',skills:['机器学习','推荐算法','数据分析'],sourceUrl:'https://www.zhipin.com/zhaopin/cb5a9c74eda5d01a03d-3dS0EA~~/',verified:false},
  {id:'03',title:'具身智能研究员',company:'AIRS',salaryMin:30,salaryMax:40,salaryText:'30–40K',district:'龙岗区',industry:'人工智能',experience:'3–5年',education:'博士',skills:['具身智能','技术路线','机器人'],sourceUrl:'https://www.zhipin.com/zhaopin/fc61d0327d21c1471nV63dm9FA~~/',verified:false},
  {id:'04',title:'AI 图像算法工程师',company:'vivo',salaryMin:30,salaryMax:50,salaryText:'30–50K',district:'宝安区',industry:'消费电子',experience:'5–10年',education:'硕士',skills:['多模态','图像理解','计算机视觉'],sourceUrl:'https://www.zhipin.com/zhaopin/9a7469788d34c77c03N52Nu-GA~~/',verified:false},
  {id:'05',title:'产品专家',company:'吉迩科技',salaryMin:25,salaryMax:50,salaryText:'25–50K',district:'南山区',industry:'消费电子',experience:'3–5年',education:'本科',skills:['产品规划','市场洞察','项目管理'],sourceUrl:'https://www.zhipin.com/zhaopin/eda7d13613468a3d1X1539W6/',verified:false},
  {id:'06',title:'量化研究员（深度学习）',company:'光昊投资',salaryMin:20,salaryMax:40,salaryText:'20–40K',district:'福田区',industry:'金融',experience:'3–5年',education:'硕士',skills:['深度学习','回测','Python'],sourceUrl:'https://www.zhipin.com/zhaopin/6695251fa9dfade11nd-09y8/',verified:false},
  {id:'07',title:'AI Agent 研发工程师',company:'逸文科技',salaryMin:50,salaryMax:80,salaryText:'50–80K',district:'南山区',industry:'智能硬件',experience:'3–5年',education:'本科',skills:['LLM','模型微调','Agent'],sourceUrl:'https://www.zhipin.com/zhaopin/d863b052df9029601HZ_2tu_Eg~~/',verified:false},
  {id:'08',title:'无人机 AI 算法科学家',company:'艾飞智控',salaryMin:50,salaryMax:80,salaryText:'50–80K',district:'南山区',industry:'航空航天',experience:'1–3年',education:'博士',skills:['无人机','AI战略','科研合作'],sourceUrl:'https://www.zhipin.com/zhaopin/cb5a9c74eda5d01a03d-3dS0EA~~/',verified:false},
  {id:'09',title:'推荐算法专家',company:'阿尔法时刻',salaryMin:50,salaryMax:80,salaryText:'50–80K',district:'南山区',industry:'互联网金融',experience:'经验不限',education:'本科',skills:['搜索推荐','NLP','CTR/CVR'],sourceUrl:'https://www.zhipin.com/zhaopin/9589046e36d8ac4e0nZ82N2_EA~~/',verified:false},
  {id:'10',title:'AI 应用研发工程师',company:'雷鸟创新',salaryMin:40,salaryMax:70,salaryText:'40–70K',district:'南山区',industry:'计算机硬件',experience:'3–5年',education:'本科',skills:['模型部署','Agent','线上监控'],sourceUrl:'https://www.zhipin.com/zhaopin/d863b052df9029601HZ_2tu_Eg~~/',verified:false},
  {id:'11',title:'海外营销核心岗',company:'吉迩科技',salaryMin:70,salaryMax:100,salaryText:'70–100K',district:'南山区',industry:'消费电子',experience:'10年以上',education:'本科',skills:['海外营销','GTM','渠道','英语'],sourceUrl:'https://www.zhipin.com/zhaopin/eda7d13613468a3d1X1539W6/',verified:false},
  {id:'12',title:'量化研究总监',company:'闻道资产',salaryMin:70,salaryMax:100,salaryText:'70–100K',district:'南山区',industry:'金融',experience:'3–5年',education:'硕士',skills:['Python','C++','量化研究'],sourceUrl:'https://www.zhipin.com/zhaopin/8d60388a82e2a34e03B52N67GQ~~/',verified:false},
  {id:'13',title:'强化学习专家',company:'魔法原子',salaryMin:70,salaryMax:100,salaryText:'70–100K',district:'宝安区',industry:'人工智能',experience:'5–10年',education:'硕士',skills:['强化学习','机器人控制','Sim2Real'],sourceUrl:'https://www.zhipin.com/zhaopin/5d9cefeba87ecdf9031729-5Fw~~/',verified:false},
  {id:'14',title:'ISP 算法专家',company:'锐思智芯',salaryMin:70,salaryMax:100,salaryText:'70–100K',district:'南山区',industry:'智能硬件',experience:'5–10年',education:'硕士',skills:['ISP','计算机视觉','图像处理'],sourceUrl:'https://www.zhipin.com/zhaopin/917fb261fe51293f031_3N64Fw~~/',verified:false},
  {id:'15',title:'国际采购总监',company:'源芯电子',salaryMin:70,salaryMax:100,salaryText:'70–100K',district:'福田区',industry:'半导体',experience:'5–10年',education:'大专',skills:['国际采购','供应链','英语'],sourceUrl:'https://www.zhipin.com/zhaopin/c84a67436c9c96e703F73NS1GA~~/',verified:false},
  {id:'16',title:'软件研发负责人',company:'绿联科技',salaryMin:70,salaryMax:100,salaryText:'70–100K',district:'深圳',industry:'消费电子',experience:'10年以上',education:'本科',skills:['团队管理','软件架构','技术决策'],sourceUrl:'https://www.zhipin.com/zhaopin/d181d52aa56fc88a0nV52dm9Fw~~/',verified:false},
];

export const capturedAt = '2026-07-12';
