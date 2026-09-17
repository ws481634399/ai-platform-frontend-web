# DU Task Spec — DU-FE-903

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-903 引用该表，不新造 DU。

## 0. 元信息

- DU id: DU-FE-903
- Change ID: CHG-0019
- Feature Path: 订单交易/订单查询与履约/后台订单履约/后台订单查询与发货
- 权威来源: story-design.md §5 / DU-FE-903

## 任务清单

- [ ] 任务 1 — mall-admin src/api/order.ts：adminList/get/ship 类型与请求封装（verifies: TC-007）
- [ ] 任务 2 — stores/orderAdmin.ts：查询参数/分页/详情/发货 action（verifies: TC-007）
- [ ] 任务 3 — views/order/OrderListView.vue：搜索表单（orderNo/memberId/状态/时间范围）、表格、分页（verifies: TC-007）
- [ ] 任务 4 — views/order/OrderDetailView.vue：详情字段 + 状态时间线 + 发货弹窗（必填/长度校验、PAID 才显示按钮、v-permission order:ship）（verifies: TC-008）
- [ ] 任务 5 — 动态路由/菜单接入（订单管理目录+订单列表，order:list/view/ship 权限码、组件白名单）（verifies: TC-009）
- [ ] 任务 6 — type-check/lint/vitest/build 全绿（verifies: TC-010）

## Acceptance Criteria

- [ ] AC-007 — 列表检索/详情/发货弹窗可用，菜单按权限码出现；type-check/lint/test/build 全绿。

## 执行顺序（Execution Order）

1. 任务 1/2 → 3 → 4 → 5 → 6。

## 并行度（Parallelization）

任务 5 菜单接入可与 3/4 并行。

## Verification

- Unit: vitest 查询参数拼装、弹窗校验、v-permission 显隐、两账号菜单差异。
- Integration: N/A（Integration Gate admin 发货链路浏览器验证）。
- API: 类型与后端 admin 契约一致。
- Migration: N/A（菜单种子在 dev 阶段确认落库位置并记录 evidence）。
- Error Case: 403 隐藏入口且接口兜底提示；409 状态冲突提示后刷新。
