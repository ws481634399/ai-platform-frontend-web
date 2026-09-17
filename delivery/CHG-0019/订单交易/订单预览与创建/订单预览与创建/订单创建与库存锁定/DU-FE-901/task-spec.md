# DU Task Spec — DU-FE-901

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-901 引用该表，不新造 DU。

## 0. 元信息

- DU id: DU-FE-901
- Change ID: CHG-0019
- Feature Path: 订单交易/订单预览与创建/订单预览与创建/订单创建与库存锁定
- 权威来源: story-design.md §5 / DU-FE-901

## 任务清单

- [ ] 任务 1 — mall-web api/order.ts：preview/createOrder 类型与 DTO 逐字段对齐后端（Fen 字段、ID 字符串）（verifies: TC-013）
- [ ] 任务 2 — stores/order.ts：preview 状态、submit 状态机 idle/submitting/done/error（防双击）（verifies: TC-013）
- [ ] 任务 3 — views/checkout/CheckoutView.vue：query source/skuId/quantity；挂载 preview；地址选择（复用地址 api + 默认选中）；行/金额/不可下单原因；提交按钮禁用规则（verifies: TC-013, TC-014）
- [ ] 任务 4 — 成功后：CART 调 cart batch-delete 已购 skuIds 跳详情；BUY_NOW 直接跳详情；失败提示与令牌失效重拉 preview（verifies: TC-013）
- [ ] 任务 5 — 入口接线：购物车"去结算"（选中项→/checkout?source=CART）；商品详情"立即购买"（→BUY_NOW&skuId&quantity）；/checkout 登录守卫（verifies: TC-014）
- [ ] 任务 6 — 质量门禁：type-check/lint/vitest/build 全绿（verifies: TC-013, TC-014）

## Acceptance Criteria

- [ ] AC-011 — CheckoutView 预览展示/地址选择/不可下单阻断/提交防双击/成功跳详情；购物车与立即购买两入口可达；type-check/lint/test/build 通过。

## 执行顺序（Execution Order）

1. 任务 1 → 2 → 3 → 4 → 5 → 6。

## 并行度（Parallelization）

任务 5 入口接线可与任务 3 并行。

## Verification

- Unit: vitest store 状态机与 api mock 组件测试；`pnpm -C mall-web test`。
- Integration: N/A（端到端在 Integration Gate 十场景浏览器验证）。
- API: 契约类型与后端 PreviewView/Create 响应一致（type-check 保证）。
- Migration: N/A。
- Error Case: preview 失败/令牌失效/提交失败三态 UI；未登录守卫跳转。
