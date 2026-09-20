# DU Task Spec — DU-FE-003

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-003 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-003 与同目录 task-design.md（"怎么做"）配对互链。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-003
- Change ID: CHG-0024
- Feature Path: AI 智能应用/RAG 智能客服与知识库/知识库与 RAG 客服能力/RAG 智能客服与知识库
- 权威来源: story-design.md §5 / DU-FE-003

## 任务清单

- [ ] T1 mall-admin/src/api/knowledge.ts：五端点封装（upload multipart/list/patch/delete/rebuild）（verifies: TC-301）
- [ ] T2 mall-admin KnowledgeListView.vue：状态徽标表格+上传（.md/.txt/≤5MB 校验）+启停/删除（二次确认）/重建 + v-permission(knowledge:doc:*) + 路由菜单挂 AiKnowledge（verifies: TC-301）
- [ ] T3 mall-web/src/api/ai.ts support chat 封装 + SupportView.vue（提问/回答气泡/引用列表/Loading/Error/新会话重置/兜底文案/订单类引导）+ 路由与 ai.rag.enabled 开关联动（verifies: TC-309）
- [ ] T4 vitest：mall-admin knowledge_list_view.spec + mall-web support_view.spec + type-check 通过（verifies: TC-301, TC-309）

## Acceptance Criteria

- [ ] AC-022 — mall-admin 可上传知识文档（.md/.txt），上传动作调 upload api，列表可查看状态徽标（含处理中/完成/失败）（vitest 断言；MinIO 落盘由 DU-AI-003 承接）
- [ ] AC-028 — mall-web 客服入口：输入问题→展示回答与引用→有 Loading/Error→可开新会话（vitest 断言）

## 执行顺序（Execution Order）

1. T1 → 2. T2 → 3. T3 → 4. T4

## 并行度（Parallelization）

无（T2 依赖 T1，T4 依赖 T2~T3）。

## Verification

- Unit: N/A
- Integration: N/A（联调属 Integration Gate；本 DU 以契约 mock 验证）
- API: vitest mock api 层断言上传调用与五端点参数（TC-301）；support 请求体含 question/conversationId（TC-309）
- Migration: N/A
- Error Case: 上传非法类型/超限 → 前端拒绝；删除二次确认取消不调用；502 → Error 态可重试；403 → 空态；开关 false → 入口隐藏+直达空态（TC-301/TC-309）
