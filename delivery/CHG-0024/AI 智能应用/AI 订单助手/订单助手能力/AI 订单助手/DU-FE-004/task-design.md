# DU Task Design — DU-FE-004

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-004 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-004 与同目录 task-spec.md（"做什么/验收"）配对互链。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

mall-web AI 订单助手入口：aiApi.ordersAssistant/ordersConfirm 封装、OrderAssistantView（订单问答+取消二次确认弹窗）、路由 `/ai/orders` 登录守卫与 `ai.order-assistant.enabled` 开关联动、vitest（对应 story-design.md §5 DU-FE-004 职责）。

## 2. Repository

repo-2（implementation/ai-platform-frontend，Vue3 + TS + pinia + vitest；mall-web 子工程）。

## 3. Scope

- mall-web/src/api/ai.ts（扩展 ordersAssistant/ordersConfirm 封装，409 语义透出）
- mall-web/src/views/ai/OrderAssistantView.vue（新增）
- mall-web/src/router/index.ts（/ai/orders 路由 + 登录守卫）、mall-web/src/layouts/MallLayout.vue（入口 v-if 开关 && isAuthed）
- mall-web/src/views/ai/OrderAssistantView.spec.ts（vitest，对齐 test-design.md TC-409）

## 4. Design References

- requirement-design.md §2.1（orders assistant+confirm 契约）、§2.3（前端改动）
- story-design.md §1（模块改动 repo-2 节）、§2（契约细化：orders[] 字段/pendingAction 并存/confirm 成功结构）、§4（前端错误态）
- story-spec.md §3（业务规则：写确认流——pendingAction 存在时前端必须先确认再继续）

## 5. Dependencies

DU-AI-004（端点契约冻结后按契约开发；vitest 以 api mock 先行）。

## 6. Implementation Sketch

```
OrderAssistantView.vue
  ├─ 会话输入 → aiApi.ordersAssistant({conversationId?, message})
  │    ├─ loading 禁发；成功 → orders[] 卡片列表（orderNo/statusText/金额(元)/商品摘要/createdAt）
  │    ├─ pendingAction → el-dialog 弹窗：展示 actionId/orderNo/orderStatus + "确认取消订单 XXX 吗？"
  │    │    ├─ 确认 → aiApi.ordersConfirm({conversationId, actionId, confirm:true}) → 结果反馈（已取消）
  │    │    └─ 取消 → 关闭弹窗，不调用 /confirm（无写副作用）
  │    ├─ 409 → 消息透出（状态不允许取消/确认已失效）
  │    ├─ 403 → disabledState；500 → errorState + retry
  │    └─ 订单类敏感文案"价格以结算页为准"不适用（金额为订单实付口径）
  └─ 路由 /ai/orders（导航守卫 member.isAuthenticated，未登录跳 /login）；
      入口 v-if="features.hasFeature('ai.order-assistant.enabled', true) && isAuthed"
      （data-testid="mall-order-assistant-link"）
```

复用：http.ts（Bearer+X-Trace-Id）、features store、AssistantView 状态机/testid 风格、既有 el-dialog 模式（mall-admin）或原生 dialog。

## 7. Pseudocode

```
# complexity-trigger: 未命中（标准"请求-渲染-确认弹窗"组件；确认流状态简单：pending→confirmed/cancelled）→ N/A
# 理由: 前端仅承载确认交互，写执行状态机在后端（actionId GETDEL）；
# 视图状态机 loading/success/disabled/error 与 DU-FE-001 同构。
```
