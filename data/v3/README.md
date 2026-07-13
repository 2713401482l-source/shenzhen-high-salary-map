# V3 数据目录

- `config/collection-plan.json`：行业不限的岗位发现方向、查询词与目标样本量。
- `collection/query-queue.json`：由脚本生成的可执行采集队列。
- `quality/baseline.json`：V3 启动时对旧数据的质量基线。
- `observations/`：后续按快照追加的原始岗位观察。
- `normalized/`：完成去重、岗位归一化和能力证据标注后的数据。

V2 的 `data/jobs` 暂时保留，保证正式站点不受 V3 开发影响。V3 数据达到发布门槛后再切换页面数据源。

