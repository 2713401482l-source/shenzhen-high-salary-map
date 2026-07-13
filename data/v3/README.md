# V3 数据目录

- `config/collection-plan.json`：行业不限的岗位发现方向、查询词与目标样本量。
- `collection/query-queue.json`：由脚本生成的可执行采集队列。
- `quality/baseline.json`：V3 启动时对旧数据的质量基线。
- `observations/`：后续按快照追加的原始岗位观察。
- `demo/`：只用于页面结构评审的演示数据，强制标记 `excludedFromFormalStats: true`，不包含公司和来源链接。
- `normalized/`：完成去重、岗位归一化和能力证据标注后的数据。

V2 的 `data/jobs` 暂时保留，保证正式站点不受 V3 开发影响。V3 数据达到发布门槛后再切换页面数据源。

当前 Boss 采集因平台风控暂停。V3 页面中的真实证据继续读取 `data/jobs/verified.json` 与 `data/jobs/candidates.json`，结构演示读取 `demo/page-logic-demo.json`，两组不会合并统计。
