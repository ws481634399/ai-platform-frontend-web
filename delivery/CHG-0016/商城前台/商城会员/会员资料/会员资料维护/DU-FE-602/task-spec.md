# DU Task Spec — DU-FE-602

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-602
- Change ID: CHG-0016
- Feature Path: 商城前台/商城会员/会员资料/会员资料维护
- 权威来源: story-design.md §5 / DU-FE-602

## 任务清单

- [ ] 任务 1 — member api（get/update/avatar）与资料 store 接入（verifies: TC-006）
- [ ] 任务 2 — ProfileView 资料表单：回填/校验/保存/字段错误（verifies: TC-006）
- [ ] 任务 3 — 头像预览上传组件（2MB 预拦截、成功刷新、失败 toast）（verifies: TC-006）
- [ ] 任务 4 — vitest 组件测试 + vue-tsc/eslint/build 三检（verifies: TC-006）

## Acceptance Criteria

- [ ] AC-016 — 页面展示资料且 memberId 来自会话不可手改（联调）。
- [ ] AC-017 — 前端校验与后端一致，保存成功与字段级失败提示可见（联调）。
- [ ] AC-018 — 头像预览上传成功/失败体验符合：超限前端拦截，503 显示存储不可用（联调）。

## 执行顺序（Execution Order）

1. 任务 1 → 2/3 并行 → 4；联调待 DU-BE-603。

## 并行度（Parallelization）

任务 2 与任务 3 并行。

## Verification

- Unit: vitest 组件（mock api 成功/400/503）。
- Integration: N/A。
- API: 与 DU-BE-603 联调。
- Migration: N/A。
- Error Case: 上传失败保留旧头像；保存失败不污染本地缓存。
