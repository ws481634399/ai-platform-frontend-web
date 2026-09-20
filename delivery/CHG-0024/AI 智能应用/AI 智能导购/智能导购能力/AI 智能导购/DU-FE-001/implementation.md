# DU Implementation — DU-FE-001

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation，与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

- **T1 API 封装**：`mall-web/src/api/ai.ts`（`aiApi.recommendations({conversationId?, message})`；成功响应直出契约结构；Bearer/X-Trace-Id 复用 http.ts 拦截器，GUEST 自动无 Bearer）。
- **T2/T3 视图**：`mall-web/src/views/ai/AssistantView.vue`（对话气泡列表、澄清态只出追问气泡、推荐商品卡片含图/名/理由/￥价/"价格以结算页为准"、Loading 禁发、Error 态可重试、403 空态、conversationId 会话内复用、空推荐兜底文案）。
- **T4 路由与入口**：`src/router/index.ts` 注册 `/ai/assistant`（公开页）；`src/layouts/MallLayout.vue` 顶部导航新增"AI 助手"入口，受 `features.hasFeature('ai.shopping.enabled', true)` 显隐（显隐仅体验层，fail-open 口径与既有 search.enabled 一致）。
- **T5 测试**：`src/views/ai/AssistantView.spec.ts` 6 用例（成功渲染卡片/澄清态/多轮 conversationId 透传/403 空态/502 重试复用消息/loading 禁用）。

## Commits

- repo-2（implementation/ai-platform-frontend）：本地提交（见下），未推送。

## Deviations

<!-- 实现与 DU 建议（Sketch / Pseudocode）明显偏离时必须记录；无偏离写「无」。 -->

无

## 自检

- [x] task-spec T1~T5 全部完成（verifies TC-010 对应用例齐备）
- [x] AC-008：卡片渲染（图/名/价/理由）+ Loading/Error 态可用（vitest 断言通过）
- [x] AC-012：403 → 空态（后端 fail-closed 收口）；导航显隐由 features store 驱动（开关联动与既有 FE-504 模式一致）
- [x] `pnpm vitest run` 全仓回归：23 文件 111 tests 全过；`vue-tsc --noEmit` exit=0
