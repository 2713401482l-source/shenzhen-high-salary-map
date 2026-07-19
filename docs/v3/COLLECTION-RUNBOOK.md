# V3 人工采集与入库流程

这套流程不自动访问 Boss，也不模拟真人操作。平台恢复后，只由人工在已登录浏览器中低频查看页面并保存结构化快照；脚本只处理已经保存到本机的 JSON。

## 安全边界

- `data/v3/collection/status.json` 为暂停时，不再打开、刷新或批量访问 Boss。
- 恢复时间到达后，先人工打开一个搜索页确认状态；若仍出现验证码、403 或异常提示，立即停止。
- 不使用并发采集、自动翻页、代理、指纹伪装或绕过验证。
- 每次只处理一个查询，先落原始快照，再进入候选层或详情核验层。

## 快照格式

字段示例见 `data/v3/schemas/manual-snapshot.example.json`。列表快照必须包含：

- 查询编号 `queryId`；
- 岗位名、公司名、Boss 原始薪资、区域、行业、经验、学历；
- 当前公司当前岗位的 Boss 详情页链接；
- 明确的深圳位置证据。

详情快照将 `kind` 改为 `detail`，使用单个 `job`，并补充完整的 `descriptionText`。岗位名、公司名、薪资和详情链接必须与候选记录完全一致，否则停止晋级。

## 两步入库

先查看访问闸门与队列状态：

```powershell
npm run v3:queue-report
```

平台暂停时，这个命令不会输出下一条 Boss 链接。即使预计恢复时间已经到达，也必须先完成一次人工确认并更新状态，才会放行下一条查询。

队列报告同时显示三档总样本和详情证据缺口。每档目标均为 50 条真实岗位和 50 条详情要求；这样能力差异和成长路径不会只依赖某一个薪资档。`data/v3/collection/gap-report.json` 还会记录各研究方向的覆盖差额、单岗对标缺口和恢复后的优先查询，但暂停期间不包含可直接访问的 Boss 链接。

然后预检快照，不写文件：

```powershell
npm run v3:import-snapshot -- C:\path\to\snapshot.json
```

确认报告后再写入：

```powershell
npm run v3:import-snapshot -- C:\path\to\snapshot.json --apply
```

写入时会先在 `data/v3/collection/raw/YYYY-MM-DD/` 保存不可覆盖的原始快照，再更新候选或已核验数据。重复岗位、非深圳岗位、薪资不达标、非详情链接或证据不足都会被挡在正式分析之外。

## 每批之后

运行 `npm run verify`。只有数据校验、分析生成、类型检查与正式构建全部通过，改动才可以提交。假数据只作为开发 fixture 存在于 `data/v3/fixtures/`，生产代码不得导入。
