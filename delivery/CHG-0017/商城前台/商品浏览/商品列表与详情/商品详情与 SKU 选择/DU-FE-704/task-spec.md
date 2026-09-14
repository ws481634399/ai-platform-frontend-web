# DU Task Spec — DU-FE-704

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-704
- Change ID: CHG-0017
- Feature Path: 商城前台/商品浏览/商品列表与详情/商品详情与 SKU 选择
- 权威来源: story-design.md §5 / DU-FE-704

## 任务清单

- [ ] 任务 1 — detail/availability api 与详情页四态、404 专态（verifies: TC-003, TC-006）
- [ ] 任务 2 — 图集/富文本 DOMPurify 净化/面包屑/异常占位（verifies: TC-006）
- [ ] 任务 3 — SkuSelector 表驱动：全组合唯一 skuId、价格/图片联动（verifies: TC-002）
- [ ] 任务 4 — DISABLED 置灰、OUT_OF_STOCK 缺货标识与加购禁用（verifies: TC-004）
- [ ] 任务 5 — StockBadge 批量三态 + UNKNOWN 局部重试与降级（verifies: TC-005）
- [ ] 任务 6 — 整数分断言、游客直达、vitest 矩阵用例 + 三检（verifies: TC-007, TC-002）

## Acceptance Criteria

- [ ] AC-011 — 详情图文/矩阵完整展示（联调）。
- [ ] AC-012 — 全规格组合选定唯一 skuId；切换联动正确。
- [ ] AC-013 — 404 商品页无加购入口。
- [ ] AC-014 — 禁用组合不可点；缺货可看不可加购。
- [ ] AC-018 — UNKNOWN 可重试，图文可浏览，加购禁用。
- [ ] AC-019 — loading/占位/游客路由/三检通过。
- [ ] AC-020 — priceFen 整数，无浮点金额。

## 执行顺序（Execution Order）

1. 任务 1/2 → 3 → 4/5 → 6；联调待 DU-BE-704/705。

## 并行度（Parallelization）

任务 2（图文）与任务 3（选择器）并行。

## Verification

- Unit: vitest 二维矩阵选择路径、置灰、三态联动、UNKNOWN 重试；净化断言（脚本注入被移除）。
- Integration: N/A。
- API: 与 DU-BE-704/705 联调。
- Migration: N/A。
- Error Case: 图裂占位；富文本非法标签净化；三态失败不阻塞图文。
