# 分析验证报告

验证时间：2026-07-13T00:29:55.513Z

结论：**可带明确限制发布（Share with caveats）**。当前 71 条样本中，7 条达到详情页核验，64 条为 Boss 列表页观察；低证据样本占 90.1%。网站必须持续显示证据结构和“高薪技术样本、非深圳全行业普查”的边界。

## 自动复核

- 通过：snapshot total（71 vs 71）
- 通过：analysis total（71 vs 71）
- 通过：family partition（71 vs 71）
- 通过：salary bands（{"30K":32,"50K":32,"100K":7} vs {"30K":32,"50K":32,"100K":7}）
- 通过：analysis weight conservation（41.90 vs 41.90）
- 通过：unique job ids（duplicate analyzed job id）
- 通过：salary midpoint（one or more midpoint mismatches）
- 通过：salary boundary（job below 30K reach boundary）
- 通过：direct Boss URLs（one or more non-detail URLs）
- 通过：growth family coverage（9 vs 9）
- 通过：no historical claim（当前公开岗位横截面，不代表历史涨跌）

## 发布限制

- 不使用“上涨、下降、增长趋势”等历史变化措辞；这里只能描述当前岗位截面。
- 30K / 50K / 100K 是按薪资区间中位数划分的统计档，不替代 Boss 原始薪资。
- 岗位族群和技能标签由规则抽取，适合发现方向，不等同于人工逐字编码。
- 100K 档仅 7 条，任何排序和成长路径都必须标注小样本。
