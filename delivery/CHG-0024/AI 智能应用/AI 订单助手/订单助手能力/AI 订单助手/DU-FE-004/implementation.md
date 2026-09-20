# DU Implementation — DU-FE-004

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

| Task | 文件 | 内容 |
| --- | --- | --- |
| T1 | mall-web/src/api/ai.ts | 新增 `AiOrderItem`、`AiPendingAction`、`AiOrdersAssistant*`、`AiOrdersConfirm*` 类型；`aiApi.ordersAssistant()`（POST /api/ai/orders/assistant）与 `aiApi.ordersConfirm()`（POST .../assistant/confirm，409 原样 reject） |
| T2 | mall-web/src/views/ai/OrderAssistantView.vue（新增） | 问答对话 + 订单卡片（orderNo/status/statusText/金额/productName/时间）；pendingAction → 原生模态二次确认（展示 orderNo/当前状态/"确认取消订单 XXX 吗？"）；确认调 /confirm 并刷新卡片状态；"再想想"关闭无写副作用；401 登录引导、403 空态、409 透出后端 message、5xx 重试 |
| T3 | mall-web/src/router/index.ts | 路由 `/ai/orders`（meta.requiresMember=true，导航守卫未登录跳登录页并带 redirect） |
| T4 | mall-web/src/layouts/MallLayout.vue | 导航入口"订单助手"，`v-if="features.hasFeature('ai.order-assistant.enabled', true) && isAuthed"`，data-testid=mall-order-assistant-link |
| T5 | mall-web/src/views/ai/OrderAssistantView.spec.ts（新增） | 7 例：查询卡片+多轮透传、确认流（confirm:true+状态刷新）、取消无副作用、401 引导、409 透出、403 空态、loading 禁用 |

> 共享接线文件同时承载 DU-FE-002/003/004，三个 DU 合并为同一 feat commit，各自登记。

## Commits

| 短 SHA | 类型 | 说明 |
| --- | --- | --- |
| f2fd7ca | feat | DU-FE-002/003/004 联合：mall-web 对比/客服/订单助手 + mall-admin 知识库（代码+测试+证据） |

## Deviations

无。

## 自检

- [x] pendingAction 存在时必须确认才调 /confirm（confirm:true），取消按钮无任何写调用
- [x] 确认成功后卡片状态刷新为 CANCELLED/已取消；409（令牌消费/Java 拒绝）原样透出不重复写
- [x] 401 → 登录引导（/login?redirect=/ai/orders）；路由 requiresMember 守卫
- [x] 入口同时受 ai.order-assistant.enabled 与登录态控制
- [x] vitest 全绿（mall-web 129 passed，含本 DU 7 例）；vue-tsc 通过；eslint 0 error；vite build 成功（evidence/logs/）
