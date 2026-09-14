# DU Task Spec — DU-FE-701

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-701
- Change ID: CHG-0017
- Feature Path: 商城前台/商品浏览/首页与公开分类品牌/商城首页
- 权威来源: story-design.md §5 / DU-FE-701

## 任务清单

- [ ] 任务 1 — catalog api getHome 类型与 HomeView 数据加载（verifies: TC-004）
- [ ] 任务 2 — StateView 四态（loading/empty/error+重试/success）（verifies: TC-004）
- [ ] 任务 3 — ProductCard/PriceText/BannerSlot：整数分格式、懒加载、静态 banner（verifies: TC-005）
- [ ] 任务 4 — 分类/卡片路由跳转（游客直达）+ vitest + 三检（verifies: TC-004, TC-005）

## Acceptance Criteria

- [ ] AC-001 — 四段数据渲染真实（联调）。
- [ ] AC-002 — 新品/推荐卡片点击可达列表与详情（联调）。
- [ ] AC-018 — 降级/错误态与后续商品域一致（StateView 复用）。
- [ ] AC-019 — 四态完备；价区整数分格式正确；三检通过。

## 执行顺序（Execution Order）

1. 任务 1 → 2 → 3 → 4；联调待 DU-BE-701。

## 并行度（Parallelization）

任务 2 与任务 3 可并行（独立组件）。

## Verification

- Unit: vitest 四态快照、跳转断言、价格格式（1999 → ¥19.99）。
- Integration: N/A。
- API: 与 DU-BE-701 联调。
- Migration: N/A。
- Error Case: error 态重试重新请求；图片失败占位（StateView/onerror）。
