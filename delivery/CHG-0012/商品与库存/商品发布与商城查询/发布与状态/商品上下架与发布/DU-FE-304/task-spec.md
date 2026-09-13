# DU Task Spec — DU-FE-304

> 权威 DU 划分：story-design.md §5 / DU-FE-304

## 0. 元信息

- DU id: DU-FE-304
- Change ID: CHG-0012
- Feature Path: 商品与库存/商品发布与商城查询/发布与状态/商品上下架与发布
- 权威来源: story-design.md §5 / DU-FE-304

## 任务清单

- [ ] 任务 1 — product.ts 增加 publishProduct/unpublishProduct（verifies: TC-009）
- [ ] 任务 2 — ProductListView 增加上架/下架操作列与按钮（verifies: TC-009）

## Acceptance Criteria

- [ ] AC-008 — 无权限按钮隐藏或操作后 403
- [ ] AC-009 — 商品页可执行上架/下架

## 执行顺序

1. 任务 1 → 2

## 并行度

无

## Verification

- Unit: vitest 组件测试
- Build: pnpm type-check && pnpm build
