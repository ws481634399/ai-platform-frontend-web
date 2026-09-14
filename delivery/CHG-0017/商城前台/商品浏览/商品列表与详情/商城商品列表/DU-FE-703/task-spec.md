# DU Task Spec — DU-FE-703

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-703
- Change ID: CHG-0017
- Feature Path: 商城前台/商品浏览/商品列表与详情/商城商品列表
- 权威来源: story-design.md §5 / DU-FE-703

## 任务清单

- [ ] 任务 1 — getProducts api + query 序列化（verifies: TC-008, TC-009）
- [ ] 任务 2 — 筛选/排序/分页交互与 URL query 双向同步、刷新/外链恢复（verifies: TC-008）
- [ ] 任务 3 — 分类侧栏（DU-BE-702 树）+ 品牌多选（verifies: TC-008）
- [ ] 任务 4 — loading/empty/error 三态（重试保留 query）+ 请求竞态防护（verifies: TC-008）
- [ ] 任务 5 — 整数分域模型断言、游客直达路由、vitest + 三检（verifies: TC-009）

## Acceptance Criteria

- [ ] AC-006 — 分页交互与参数正确（联调）。
- [ ] AC-007 — 分类/品牌筛选与组合生效（联调）。
- [ ] AC-008 — 排序四档与 URL 同步（联调）。
- [ ] AC-009 — 卡片数据形态正确（联调）。
- [ ] AC-018 — 错误重试保留筛选；空态可清空筛选。
- [ ] AC-019 — 外链直达/刷新恢复（列表 story 共用质量 AC）。
- [ ] AC-020 — 无浮点金额解析。

## 执行顺序（Execution Order）

1. 任务 1 → 2 → 3/4 → 5；联调待 DU-BE-703/702。

## 并行度（Parallelization）

任务 3 与任务 4 并行。

## Verification

- Unit: vitest query 往返、竞态 seq、三态快照。
- Integration: N/A。
- API: 与 DU-BE-703/702 联调。
- Migration: N/A。
- Error Case: 快速翻页无旧数据闪烁；error 重试不丢筛选。
