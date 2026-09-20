# DU Task Spec — DU-FE-002

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-002 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-002 与同目录 task-design.md（"怎么做"）配对互链。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-002
- Change ID: CHG-0024
- Feature Path: AI 智能应用/AI 商品对比/商品对比能力/AI 商品对比
- 权威来源: story-design.md §5 / DU-FE-002

## 任务清单

- [ ] T1 src/api/ai.ts：aiApi.compare({productIds, question?}) 封装（类型对齐 requirement-design §2.1 契约）（verifies: TC-209）
- [ ] T2 CompareView.vue：商品选择器（2~6）+ 场景问题输入 + 维度对比表格（缺失单元格"暂无该项数据"）+ products 摘要（"价格以结算页为准"）+ AI 总结 + Loading/Error 可重试/403 空态（verifies: TC-209）
- [ ] T3 路由 /ai/compare 注册 + MallLayout 导航入口 ai.compare.enabled 开关联动显隐与空态（verifies: TC-209）
- [ ] T4 vitest：compare_view.spec（表格渲染/缺失占位/总结/错误态/403 空态/开关联动）+ type-check 通过（verifies: TC-209）

## Acceptance Criteria

- [ ] AC-020 — mall-web 对比页渲染维度对比表格 + AI 总结（vitest 断言：选择 2 商品→提交→表格与总结渲染，缺失单元格占位）

## 执行顺序（Execution Order）

1. T1 → 2. T2 → 3. T3 → 4. T4

## 并行度（Parallelization）

无（T2 依赖 T1，T4 依赖 T2~T3）。

## Verification

- Unit: N/A
- Integration: N/A（联调属 Integration Gate；本 DU 以契约 mock 验证）
- API: vitest mock http 层断言请求体含 productIds 与 question（TC-209）
- Migration: N/A
- Error Case: 500/网络失败 → Error 态可重试；403 → 空态；开关 false → 入口隐藏+直达空态（TC-209）
