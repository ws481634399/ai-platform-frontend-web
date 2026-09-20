# DU Task Spec — DU-FE-004

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-004 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-004 与同目录 task-design.md（"怎么做"）配对互链。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-004
- Change ID: CHG-0024
- Feature Path: AI 智能应用/AI 订单助手/订单助手能力/AI 订单助手
- 权威来源: story-design.md §5 / DU-FE-004

## 任务清单

- [ ] T1 src/api/ai.ts：aiApi.ordersAssistant({conversationId?, message}) + aiApi.ordersConfirm({conversationId, actionId, confirm}) 封装（409 语义透出）（verifies: TC-409）
- [ ] T2 OrderAssistantView.vue：orders 卡片渲染 + pendingAction 二次确认弹窗（展示 orderNo/orderStatus→确认调 /confirm、取消不调用）+ Loading/Error/409 消息透出（verifies: TC-409）
- [ ] T3 路由 /ai/orders（登录守卫）+ MallLayout 入口 ai.order-assistant.enabled && isAuthed 开关联动（verifies: TC-409）
- [ ] T4 vitest：order_assistant_view.spec（查询渲染/弹窗确认调用/取消不调用/未登录引导/开关隐藏）+ type-check 通过（verifies: TC-409）

## Acceptance Criteria

- [ ] AC-030 — mall-web 订单助手入口可查询并渲染本人最近订单卡片（vitest mock 断言）
- [ ] AC-035 — 发起取消 → 弹窗展示订单号+当前状态；确认 → 调 /confirm；取消/关闭 → 不调用（vitest 断言无写副作用）

## 执行顺序（Execution Order）

1. T1 → 2. T2 → 3. T3 → 4. T4

## 并行度（Parallelization）

无（T2 依赖 T1，T4 依赖 T2~T3）。

## Verification

- Unit: N/A
- Integration: N/A（联调属 Integration Gate；本 DU 以契约 mock 验证）
- API: vitest mock api 层断言 confirm 请求体含 conversationId/actionId/confirm:true（TC-409）
- Migration: N/A
- Error Case: 409 → 消息透出不重试写；500/网络 → Error 态可重试查询；403 → 空态；未登录 → 跳登录；开关 false → 入口隐藏（TC-409）
