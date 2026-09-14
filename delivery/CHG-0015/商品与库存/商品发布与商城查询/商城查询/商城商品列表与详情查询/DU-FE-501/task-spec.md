# DU Task Spec — DU-FE-501

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-501
- Change ID: CHG-0015
- Feature Path: 商品与库存/商品发布与商城查询/商城查询/商城商品列表与详情查询
- 权威来源: story-design.md §5 / DU-FE-501

## 任务清单

- [ ] 任务 1 — mall-admin API 类型 ID 全量改 string 并修平 vue-tsc 报错（verifies: TC-011）
- [ ] 任务 2 — 五业务面页面手工冒烟（CRUD/分页/跳转/详情）并记录（verifies: TC-011）
- [ ] 任务 3 — 经网关取商品 skuId 原样回传比对（加购预演脚本/手工）（verifies: TC-012）

## Acceptance Criteria

- [ ] AC-011 — 商品/SKU/分类/品牌/库存页列表、详情、编辑、分页、跳转不回归。
- [ ] AC-012 — skuId 字符串从页面到回传全程无末位偏差。

## 执行顺序（Execution Order）

1. 任务 1 → 2 → 3（3 依赖后端 DU-BE-501 已部署）。

## 并行度（Parallelization）

无。

## Verification

- Unit: 既有 api 单测（brand.spec/category.spec 等）随类型调整通过。
- Integration: N/A。
- API: 与 DU-BE-501 联调冒烟。
- Migration: N/A。
- Error Case: 页面错误提示与改造前一致。
