# DU Task Design — DU-FE-003

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-003 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-003 与同目录 task-spec.md（"做什么/验收"）配对互链。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

mall-admin 知识库管理页（五端点封装+列表/上传/启停/删除/重建+V12 权限码 v-permission）与 mall-web 客服入口 SupportView（问答+引用+新会话+开关联动）+ vitest（对应 story-design.md §5 DU-FE-003 职责）。

## 2. Repository

repo-2（implementation/ai-platform-frontend；mall-admin 子工程 element-plus + mall-web 子工程 Vue3）。

## 3. Scope

- mall-admin/src/api/knowledge.ts（五端点封装）、mall-admin/src/views/knowledge/KnowledgeListView.vue（新增）、mall-admin 路由/菜单（AiKnowledge，component_key 对齐 V12 种子）、v-permission（knowledge:doc:* 权限码）
- mall-web/src/api/ai.ts（support chat 封装）、mall-web/src/views/ai/SupportView.vue（新增）、mall-web 路由 /ai/support + MallLayout 入口开关联动
- vitest：mall-admin knowledge_list_view.spec、mall-web support_view.spec（对齐 test-design.md TC-301/TC-309）

## 4. Design References

- requirement-design.md §2.1（knowledge 五端点+support 契约）、§2.3（前端改动）、§5（V12 权限码，DU-BE-001 已交付）
- story-design.md §1（模块改动 repo-2 节）、§2（契约细化：documents 列表项字段/兜底文案）、§4（前端错误态）
- story-spec.md §3（业务规则：客服边界/开关 fail-closed/上传校验）

## 5. Dependencies

DU-AI-003（端点契约冻结后按契约开发；vitest 以 api mock 先行）。

## 6. Implementation Sketch

```
mall-admin KnowledgeListView.vue
  ├─ 表格: 标题/状态徽标(PENDING|PROCESSING|COMPLETED|FAILED)/chunkCount/enabled/时间
  ├─ 操作（v-permission: knowledge:doc:*）:
  │    上传（复用 ImageUploader 模式改 .md/.txt+≤5MB 校验 → multipart POST documents）
  │    启停 switch（PATCH enabled）/ 删除（el-popconfirm 二次确认 → DELETE）/ 重建索引（POST rebuild）
  └─ FAILED 行展示原因摘要；操作后刷新列表
mall-web SupportView.vue
  ├─ 提问输入 → aiApi.supportChat({conversationId?, question})
  │    ├─ loading 禁发；成功 → 回答气泡 + 引用列表（title+snippet，点击展开）
  │    ├─ 兜底文案（sources=[]）→ 原样展示"当前知识库中没有足够信息…"
  │    ├─ 订单类问题 → 引导文案"请使用 AI 订单助手"（客服边界规则21）
  │    └─ 403 → disabledState；500 → errorState + retry
  └─ 新会话按钮（重置 conversationId）；路由 /ai/support；入口 v-if="features.hasFeature('ai.rag.enabled', true)"
```

复用：mall-admin auth store 权限模型与 CHG-0023 ImageUploader 上传模式；mall-web features store/AssistantView 状态机风格。

## 7. Pseudocode

```
# complexity-trigger: 未命中（两视图均为标准"列表-操作"/"请求-渲染"组件，无编排/算法）→ N/A
# 理由: 状态机 loading/success/disabled/error 与 DU-FE-001 AssistantView 同构；
# mall-admin 表格为 element-plus 标准 CRUD 模式。
```
