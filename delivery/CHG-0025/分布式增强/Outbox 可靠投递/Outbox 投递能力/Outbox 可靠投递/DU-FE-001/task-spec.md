# DU Task Spec — DU-FE-001

> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-001
- Change ID: CHG-0025
- Feature Path: 分布式增强/Outbox 可靠投递/Outbox 投递能力/Outbox 可靠投递
- 权威来源: story-design.md §5 / DU-FE-001

## 任务清单

- [ ] 任务 1 — src/api/distributed.ts Outbox 接口封装（list/get/retry）（verifies: TC-007）
- [ ] 任务 2 — OutboxListView.vue（筛选 + 分页 + payload 抽屉 + 重投 + 审计）（verifies: TC-007）
- [ ] 任务 3 — 路由 + 菜单 + v-permission 权限码（verifies: TC-007）

## Acceptance Criteria

- [ ] AC-016 — FAILED 记录可手动重投（状态回 PENDING 后被投递成功），页面展示操作人/时间/前后状态

## 执行顺序（Execution Order）

1 → 2 → 3

## 并行度（Parallelization）

无

## Verification

- Unit: 前端组件单测（重投按钮仅 FAILED 可点、调用接口后刷新）
- Integration: 联调 DU-BE-002 /api/admin/outbox/events（留 Integration Gate）
- API: 契约对齐 OutboxAdminController
- Migration: N/A
- Error Case: 重投失败 toast 提示
