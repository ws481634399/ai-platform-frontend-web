# DU Task Spec — DU-FE-902

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本 DU 跨会员列表详情（STORY-004-03-01-01）与确认收货按钮（STORY-004-03-01-02）。

## 0. 元信息

- DU id: DU-FE-902
- Change ID: CHG-0019
- Feature Path: 订单交易/订单查询与履约/会员订单查询与确认收货/会员订单列表与详情
- 权威来源: STORY-004-03-01-01 story-design.md §5、STORY-004-03-01-02 story-design.md §5 / DU-FE-902

## 任务清单

- [ ] 任务 1 — api/order.ts 补 list/get/pay/cancel/confirmReceipt 与全部 View 类型（verifies: 列表详情 TC-005,006）
- [ ] 任务 2 — stores/order.ts 订单页 store（分页参数/Tab 状态/currentDetail/actions）（verifies: TC-005, TC-006）
- [ ] 任务 3 — OrderListView.vue：六 Tab、分页器、行卡片、空态、跳详情（verifies: TC-005）
- [ ] 任务 4 — OrderDetailView.vue：状态条/地址卡/商品金额/物流区/history 时间线/404 态（verifies: TC-006）
- [ ] 任务 5 — 详情操作区：待支付 立即支付/取消订单（原因输入）、操作后重查；SHIPPED 确认收货（二次确认）（verifies: 列表详情 TC-007；收货 TC-005）
- [ ] 任务 6 — 路由 /orders、/orders/:orderNo 注册、菜单入口与登录守卫（verifies: 列表详情 TC-008）
- [ ] 任务 7 — type-check/lint/vitest/build 全绿（verifies: TC-009）

## Acceptance Criteria

STORY-004-03-01-01：

- [ ] AC-005 — 列表页 Tab/分页/空态/行摘要/跳详情；金额格式化正确。
- [ ] AC-006 — 详情页快照/金额/时间/history 完整；待支付支付/取消可操作并重查。
- [ ] AC-007 — type-check/lint/test/build 全绿。

STORY-004-03-01-02：

- [ ] AC-004 — 确认收货按钮仅 SHIPPED 出现、二次确认、成功刷新、冲突提示后重查。

## 执行顺序（Execution Order）

1. 任务 1/2 → 3/4 → 5 → 6 → 7。

## 并行度（Parallelization）

任务 3 与任务 4 可并行。

## Verification

- Unit: vitest store/tab 映射/操作刷新/404 态；组件测试按钮显隐与弹窗。
- Integration: N/A（Integration Gate 浏览器 E2E 场景一/六/七）。
- API: TS 类型与后端视图一致（type-check）。
- Migration: N/A。
- Error Case: 详情 404 引导；B0407 冲突提示并同步状态；未登录守卫。
