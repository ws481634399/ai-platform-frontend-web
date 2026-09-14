# DU Task Spec — DU-FE-603

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-603
- Change ID: CHG-0016
- Feature Path: 商城前台/商城会员/收货地址/收货地址管理
- 权威来源: story-design.md §5 / DU-FE-603

## 任务清单

- [ ] 任务 1 — address api 类型与接入（id 字符串）（verifies: TC-011）
- [ ] 任务 2 — AddressView 列表/空态/默认徽标/设默认乐观更新（verifies: TC-011）
- [ ] 任务 3 — AddressForm 新增/编辑/校验 + 删除确认，400/409 错误提示（verifies: TC-011）
- [ ] 任务 4 — vitest 全流程组件测试 + vue-tsc/eslint/build 三检（verifies: TC-011）

## Acceptance Criteria

- [ ] AC-019 — 新增成功后列表刷新；首条默认徽标（联调）。
- [ ] AC-020 — 列表顺序与后端一致（联调）。
- [ ] AC-021 — 越权 404 时页面 toast 且数据不变（联调）。
- [ ] AC-022 — 设默认即时置顶；并发 409 有提示且重拉（联调）。
- [ ] AC-023 — 默认删除后空态/无默认徽标（联调）。
- [ ] AC-024 — 字段错误行内提示；20 条上限提示（联调）。

## 执行顺序（Execution Order）

1. 任务 1 → 2/3 并行 → 4；联调待 DU-BE-604。

## 并行度（Parallelization）

任务 2 与任务 3 并行。

## Verification

- Unit: vitest 组件全流程（成功/400/404/409 mock）。
- Integration: N/A。
- API: 与 DU-BE-604 联调。
- Migration: N/A。
- Error Case: 乐观更新失败回滚并重拉；表单错误不关闭弹层。
