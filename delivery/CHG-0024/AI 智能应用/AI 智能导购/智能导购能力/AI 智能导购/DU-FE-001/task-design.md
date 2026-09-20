# DU Task Design — DU-FE-001

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-001 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-001 与同目录 task-spec.md（"做什么/验收"）配对互链。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

mall-web 新增 AI 导购入口：api/ai.ts 封装、AssistantView 对话式交互（输入/澄清态/推荐商品卡片/Loading/Error/会话续轮）、路由注册与 `ai.shopping.enabled` 开关联动显隐（story-design.md §5 DU-FE-001 职责）。

## 2. Repository

repo-2（implementation/ai-platform-frontend，mall-web 应用）。

## 3. Scope

- mall-web/src/api/ai.ts（新增）
- mall-web/src/views/ai/AssistantView.vue（新增）
- mall-web/src/router（注册 /ai/assistant）、导航入口（开关联动显隐）
- vitest：assistant_view.spec（新增）

## 4. Design References

- requirement-design.md §2.1（recommendations 端点契约）、§2.3（repo-2 改动）
- story-design.md §1（模块改动 repo-2 节）、§4（错误处理口径）
- story-spec.md §3（真实价格文案/澄清有界展示）

## 5. Dependencies

DU-AI-001（recommendations 端点契约冻结；vitest 以契约 mock 起步不阻塞，联调依赖 DU-AI-001 完成）。

## 6. Implementation Sketch

```
AssistantView.vue
  ├─ useAiShopping()（组合式）
  │    ├─ state: { messages[], recommendations[], clarifyingQuestion, loading, error, conversationId }
  │    ├─ send(message) → api.ai.recommendations({conversationId, message})
  │    │     ├─ 200: clarifyingQuestion? → 追问气泡；recommendations[] → 商品卡片列表
  │    │     ├─ 403: "AI 导购暂未开启"空态
  │    │     └─ 502/网络: error 态（含重试按钮），不静默
  │    └─ 卡片: 图/名/价/理由 + "价格以结算页为准"文案
  ├─ 开关联动: features 查询 ai.shopping.enabled=false → 导航不渲染入口；直达路由渲染空态
  └─ api/ai.ts: 复用 src/api/http.ts（Bearer + X-Trace-Id 自动注入）
```

错误处理路径：403 → 空态；4xx 参数 → 提示重填；5xx/超时 → Error 态可重试；Loading 期间禁用发送。

## 7. Pseudocode

N/A——未命中 complexity-trigger（单视图交互编排，无算法/状态机；行为由 vitest 直接断言）。
