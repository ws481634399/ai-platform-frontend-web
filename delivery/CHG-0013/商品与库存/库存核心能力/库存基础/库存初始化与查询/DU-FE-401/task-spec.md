# DU Task Spec — DU-FE-401

## 0. 元信息

- DU id: DU-FE-401
- Change ID: CHG-0013
- Feature Path: 商品与库存/库存核心能力/库存基础/库存初始化与查询
- 权威来源: story-design.md §5 / DU-FE-401

## 任务清单

- [ ] 任务 1 — src/api/inventory/inventory.ts API 封装（verifies: TC-001）
- [ ] 任务 2 — InventoryListView.vue 库存列表 + 初始化 + 调整弹窗（verifies: TC-001）
- [ ] 任务 3 — InventoryLogView.vue 流水列表（verifies: TC-004）

## Acceptance Criteria

- [ ] AC-007 — 后台分页查询库存列表
- [ ] AC-008 — 库存调整弹窗可提交正/负 delta
- [ ] AC-018 — 流水列表展示 INIT/ADJUST 记录
- [ ] AC-020 — 页面受 inventory:* 权限保护

## 执行顺序（Execution Order）

1. 任务 1（API 封装）
2. 任务 2（列表+初始化+调整）
3. 任务 3（流水页）

## 并行度（Parallelization）

无

## Verification

- Unit: vitest 组件渲染测试
- Integration: N/A
- API: 类型检查与请求封装
- Migration: N/A
- Error Case: 表单校验（必填、数值范围）
