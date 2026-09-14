# DU Task Spec — DU-FE-402

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-402 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-402 与同目录 task-design.md（"怎么做"）配对互链。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-402
- Change ID: CHG-0014
- Feature Path: 商品与库存/商品与 SKU 管理/商品主数据/商品 SPU 管理
- 权威来源: story-design.md §5 / DU-FE-402

## 任务清单

- [x] 任务 1 — 补齐 Product images/attributes 编辑与回显（verifies: TC-003）
- [x] 任务 2 — 支持创建前维护 SKU 并组装原子创建 payload（verifies: TC-004）
- [x] 任务 3 — 修复 login 401 refresh 与 lint 回归（verifies: TC-008, TC-009）

## Acceptance Criteria

- [x] AC-003 — 图片、主图、属性可新增/删除/回显。
- [x] AC-004 — 新建商品前可维护至少一个 SKU。
- [x] AC-008 — 登录 401 不调 refresh。
- [x] AC-009 — test/type-check/lint/build 全通过。

## 执行顺序（Execution Order）

<!-- 任务执行先后顺序；跨 DU 顺序须服从权威表 depends on，不得抢跑。 -->

1. 任务 3 先建立 HTTP 回归测试。
2. 任务 1/2 在 DU-BE-401 契约冻结后实施。
3. 执行任务 3 的全量质量门。

## 并行度（Parallelization）

<!-- 可并行的任务分组（可空，写"无"表示全串行）；不得违反权威表依赖图（无环）。 -->

无

## Verification

<!-- 必填：逐项给出验证方式与证据位置（测试文件/命令/报告路径）。 -->

- Unit: Vitest 覆盖 HTTP 拦截器和 Product payload 组装。
- Integration: mall-admin API DTO 与 DU-BE-401 契约对齐。
- API: 创建 payload 包含 images/attributes/skus。
- Migration: N/A。
- Error Case: 无 SKU 时前端校验拒绝；login 401 不刷新。
