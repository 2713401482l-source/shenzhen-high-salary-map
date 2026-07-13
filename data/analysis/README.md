# 分析快照

分析脚本只读取 `data/jobs/verified.json` 与仍在核验队列中的 `candidates.json`。

- `boss-detail`：岗位详情页已核验，权重 1.0。
- `boss-listing-plus-detail`：详情页证明岗位，公司、地点与要求；薪资来自同岗位 ID 的 Boss 列表页，权重 0.9。
- `boss-listing`：Boss 公开列表页样本，详情仍待核验，权重 0.55。

拒绝记录不参与任何分析。正式页面必须同时披露各证据等级的样本量，不能把候选样本描述成全部已核验。
