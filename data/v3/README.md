# V3 数据目录

- `config/collection-plan.json`：行业不限的岗位发现方向、查询词与目标样本量。
- `collection/query-queue.json`：由脚本生成的可执行采集队列。
- `quality/baseline.json`：V3 启动时对旧数据的质量基线。
- `observations/`：后续按快照追加的原始岗位观察。
- `analysis/real-analysis.json`：只从真实岗位层生成的可追溯分析产物。
- `demo/`：只用于页面结构评审的演示数据，强制标记 `excludedFromFormalStats: true`，不包含公司和来源链接。
- `normalized/`：完成去重、岗位归一化和能力证据标注后的数据。

V2 的 `data/jobs` 暂时保留，保证正式站点不受 V3 开发影响。V3 数据达到发布门槛后再切换页面数据源。

当前 Boss 采集因平台风控暂停，禁止自动浏览和拟人化采集。正式数据渠道已经扩展为企业官方招聘页、经过详情核验的智联/猎聘公开岗位页与少量 Boss 人工复核证据。深i人才和广东公共招聘当前只作发现或官方佐证，直到能稳定取得独立岗位详情。来源许可范围见 `config/source-registry.json`，真实性硬门槛见 `config/authenticity-policy.json`。

多平台岗位必须通过 `v3:import-multisource` 导入。搜索引擎摘要只能用于发现岗位，不能直接计入样本；匿名客户、收费培训、招聘主体不明、标题与职责冲突、失效或过期岗位会进入候选/隔离状态，不参与正式分析。公司扩招统计还会额外排除猎头匿名客户和只显示人力服务机构的岗位。

V3 生产页面只读取 `data/jobs/verified.json` 与真实性门槛生成的 `analysis/real-analysis.json`。`data/jobs/candidates.json` 仅用于内部发现与查证；结构演示只作为开发 fixture 保存在 `fixtures/page-logic-demo.json`，两者均不进入生产页面或默认统计。

执行 `npm run v3:analyze` 会重新生成真实分析。能力统计和能力共现只允许详情核验样本进入分母；单岗对标、时间趋势和新兴岗位使用固定门槛，不足时输出准备度而不是补造结论。执行 `npm run v3:analysis-check` 可以反查每条分析证据。
