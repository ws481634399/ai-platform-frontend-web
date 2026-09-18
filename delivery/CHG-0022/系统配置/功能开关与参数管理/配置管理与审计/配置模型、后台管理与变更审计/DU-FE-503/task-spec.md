# DU Task Spec — DU-FE-503

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-503
- Change ID: CHG-0022
- Feature Path: 系统配置/功能开关与参数管理/配置管理与审计/配置模型、后台管理与变更审计
- 权威来源: story-design.md §5 / DU-FE-503

## 任务清单

- [ ] 任务 1 — api/config.ts 与路由/菜单/权限指令（verifies: TC-009）
- [ ] 任务 2 — FeatureConfigsView（分组/启停/新建/编辑/删除/内置保护/409 提示）（verifies: TC-009）
- [ ] 任务 3 — SystemParametersView（类型表单/min-max/JSON 校验/effectType 标识）（verifies: TC-009）
- [ ] 任务 4 — ConfigHistoryView（筛选/分页/新旧值对比）（verifies: TC-009）
- [ ] 任务 5 — type-check/lint/vitest/build 门禁（verifies: TC-010）

## Acceptance Criteria

- [ ] AC-008 — 三页面 CRUD/启停/历史筛选可用，构建/类型检查/lint/单测通过。

## 执行顺序（Execution Order）

1. 任务 1 → 2/3/4 → 5。

## 并行度（Parallelization）

任务 2/3/4 可并行。

## Verification

- Unit: vitest 表单校验矩阵、409 冲突刷新、历史筛选渲染。
- Integration: 浏览器联调放 Integration Gate（场景六/七）。
- API: 对接 DU-BE-507 三类端点契约。
- Migration: N/A。
- Error Case: 400 字段级错误、409 冲突、403 无权限隐藏/拦截。
