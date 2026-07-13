# 深圳高薪岗位观察

一套面向电脑和手机的公开职场资讯网站，用当前可访问的 Boss 直聘深圳高薪岗位样本，回答三个问题：哪里有高薪机会、薪资提高时能力组合如何变化、具体公司岗位的真实薪资是多少。

在线地址：<https://2713401482l-source.github.io/shenzhen-high-salary-map/>

## 当前数据边界

- 71 条可用岗位：30K 档 32 条、50K 档 32 条、100K 档 7 条。
- 7 条达到详情页证据，64 条为 Boss 列表页观察；列表样本以较低权重参与探索性分析。
- 样本明显偏向 AI、算法、机器人和技术研发岗位，不代表深圳全行业。
- “趋势”只表示当前截面的需求集中度、薪资结构和重复招聘信号，不表示历史涨跌。
- 30K / 50K / 100K 是按薪资区间中位数划分的统计档，岗位库始终显示 Boss 原始薪资。

## 本地运行

```bash
npm ci
npm run dev
```

## 更新与验证

```bash
npm run analysis:freeze
npm run analysis:market
npm run analysis:growth
npm run v3:analyze
npm run v3:analysis-check
npm run verify
```

`npm run v3:analyze` 会从真实岗位层生成 `data/v3/analysis/real-analysis.json`。新兴岗位、能力频率、能力共现、单岗对标准备度、企业重复招聘和时间快照资格都在这里统一计算，并保留对应岗位链接。演示数据不会进入这份产物。

`npm run verify` 会检查三层岗位数据、V3 真实分析、演示数据隔离、页面结构、TypeScript、生产构建和依赖安全。验证报告保存在 `data/analysis/validation-report.md`，V3 页面验收记录保存在 `docs/v3/QA-V3.md`。

## 发布

推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并发布到 GitHub Pages。工作流发布前会运行完整验证；`dist/` 仍可在本地独立构建和备份。

采集过程不绕过验证码，不保存招聘账号、Cookie、简历、联系方式或其他私人信息。
