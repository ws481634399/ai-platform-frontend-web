# DU Task Design — DU-FE-002

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-002 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-002 与同目录 task-spec.md（"做什么/验收"）配对互链。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

mall-web AI 商品对比页：aiApi.compare 封装、CompareView（商品选择器+维度对比表格+AI 总结+Loading/Error）、路由 `/ai/compare` 与 `ai.compare.enabled` 开关联动显隐、vitest（对应 story-design.md §5 DU-FE-002 职责）。

## 2. Repository

repo-2（implementation/ai-platform-frontend，Vue3 + TS + pinia + vitest；mall-web 子工程）。

## 3. Scope

- mall-web/src/api/ai.ts（扩展 compare 封装）
- mall-web/src/views/ai/CompareView.vue（新增）
- mall-web/src/router/index.ts（/ai/compare 路由）、mall-web/src/layouts/MallLayout.vue（导航入口开关联动）
- mall-web/src/views/ai/CompareView.spec.ts（vitest，对齐 test-design.md TC-209）

## 4. Design References

- requirement-design.md §2.1（compare 契约）、§2.3（前端改动）
- story-design.md §1（模块改动 repo-2 节）、§2（契约细化：缺失单元格"暂无该项数据"/"价格以结算页为准"文案）、§4（前端 403→空态/Error 可重试）
- story-spec.md §3（业务规则：真实价格/缺失即声明/开关 fail-closed）

## 5. Dependencies

DU-AI-002（compare 端点契约冻结后按契约开发；vitest 以 axios mock 先行，联调属 Integration Gate）。

## 6. Implementation Sketch

```
CompareView.vue
  ├─ 商品选择区: 从路由 query/本地列表选择商品（selected: ProductSearchItem[]，2~6 上限）
  │    └─ 可选"场景问题"输入（question）
  ├─ 提交 → aiApi.compare({productIds, question?})
  │    ├─ loading 态（禁重复提交）
  │    ├─ 成功 → 维度对比表格（行=dimension，列=商品，单元格=values[productId]|"暂无该项数据"）
  │    │        + products 摘要行（图/名/价+"价格以结算页为准"）+ summary 总结区
  │    ├─ 403 → disabledState 空态（开关关闭文案）
  │    └─ 500/网络 → errorState + retry()（复用 lastRequest）
  └─ 路由 /ai/compare 注册；MallLayout 导航入口 v-if="features.hasFeature('ai.compare.enabled', true)"
      （data-testid="mall-compare-link"）；开关 false 时直达路由给空态提示
```

复用：http.ts（Bearer+X-Trace-Id）、features store（hasFeature fail-open 显隐）、AssistantView 已建立的状态机/testid 风格。

## 7. Pseudocode

```
# complexity-trigger: 未命中（无编排/算法/状态机；标准"请求-渲染-错误态"组件）→ N/A
# 理由: CompareView 为单页交互组件，状态机 loading/success/disabled/error 与
# AssistantView 同构，无多步编排或复杂状态迁移。
```
