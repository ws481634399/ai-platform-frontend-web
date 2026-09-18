# DU Task Spec — DU-FE-502

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-502
- Change ID: CHG-0021
- Feature Path: 商品搜索/搜索索引同步/索引生命周期与全量构建/手工重建与索引一致性检查
- 权威来源: story-design.md §5 / DU-FE-502

## 任务清单

- [ ] 任务 1 — api/searchIndex.ts 与路由/菜单注册（权限码）（verifies: TC-007）
- [ ] 任务 2 — 状态卡与最近任务表渲染（verifies: TC-007）
- [ ] 任务 3 — 重建按钮 confirm + RUNNING 禁用+轮询进度 + 409 提示（verifies: TC-007）
- [ ] 任务 4 — 一致性检查面板（计数/差集表/truncated）（verifies: TC-007）
- [ ] 任务 5 — type-check/lint/vitest/build 门禁（verifies: TC-008）

## Acceptance Criteria

- [ ] AC-006 — 页面可查看任务状态、发起重建（确认）、执行并展示一致性检查；type-check/lint/build 通过。

## 执行顺序（Execution Order）

1. 任务 1 → 2 → 3/4 → 5。

## 并行度（Parallelization）

任务 2 与 4 可并行。

## Verification

- Unit: vitest（api mock；vi.useFakeTimers 轮询；409 分支；差集渲染/truncated）。
- Integration: 浏览器实测放 Integration Gate（真实重建/检查）。
- API: 对接 DU-BE-504 三端点契约。
- Migration: N/A。
- Error Case: 409 冲突提示、接口失败消息展示。
