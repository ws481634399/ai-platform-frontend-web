# DU Task Spec — DU-FE-001

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-001 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-001 与同目录 task-design.md（"怎么做"）配对互链。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-001
- Change ID: CHG-0024
- Feature Path: AI 智能应用/AI 智能导购/智能导购能力/AI 智能导购
- 权威来源: story-design.md §5 / DU-FE-001

## 任务清单

- [ ] T1 src/api/ai.ts：recommendations 封装（类型对齐 requirement-design §2.1 契约，复用 http.ts）（verifies: TC-010）
- [ ] T2 AssistantView.vue：对话输入/澄清态气泡/推荐商品卡片（图/名/价/理由+结算价文案）/Loading/Error 可重试/403 空态（verifies: TC-010）
- [ ] T3 会话续轮：conversationId 保存并在后续请求携带（verifies: TC-010）
- [ ] T4 路由 /ai/assistant 注册 + 导航入口 + ai.shopping.enabled 开关联动显隐与空态（verifies: TC-010）
- [ ] T5 vitest：assistant_view.spec（卡片渲染/澄清态/错误态/403 态/conversationId 复用）+ type-check/lint 通过（verifies: TC-010）

## Acceptance Criteria

- [ ] AC-008 — mall-web 入口可输入需求并渲染推荐商品卡片（图/名/价/理由），Loading/Error 态可用（vitest 断言）
- [ ] AC-012 — ai.shopping.enabled=false 时导航入口隐藏、直达路由空态；true 时正常使用（vitest + 开关状态注入）

## 执行顺序（Execution Order）

1. T1 → 2. T2 → 3. T3 → 4. T4 → 5. T5

## 并行度（Parallelization）

无（T2 依赖 T1，T5 依赖 T2~T4）。

## Verification

- Unit: N/A
- Integration: N/A（联调属 Integration Gate；本 DU 以契约 mock 验证）
- API: vitest mock http 层断言请求体含 conversationId 与 message（TC-010）
- Migration: N/A
- Error Case: 502/网络失败 → Error 态可重试；403 → 空态；空响应 recommendations → 空态文案（TC-010）
