# DU Task Spec — DU-FE-003

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §6（SSOT）；本文件只按 DU id DU-FE-003 引用该表，不新造 DU。
> verifies 约定：任务项绑定 TC-NNN（红绿灯对象）；TC 定义在外部对应 Story 的 test-design.md，本文件只引用不新造。

## 0. 元信息

- DU id: DU-FE-003
- Change ID: CHG-0025
- Feature Path: 分布式增强/消费幂等与补偿机制/幂等与补偿能力/消费幂等与补偿机制
- 权威来源: story-design.md §1 / DU-FE-003

## 任务清单

- [ ] 任务 1 — 补偿 API（src/api/order 或既有补偿 API 位置）：page 增加 operation/aggregateId 参数；新增 complete(id) POST（verifies: TC-010）
- [ ] 任务 2 — CompensationListView.vue 筛选区增加：操作类型下拉（确认扣减/释放/自动取消）、聚合 ID 输入（verifies: TC-010）
- [ ] 任务 3 — 表格/详情：payload 查看（展开 JSON）；行操作「重试」（既有，权限码更新 system:compensation:retry）与「标记完成」（el-popconfirm 二次确认，v-permission system:compensation:complete），成功 toast+刷新（verifies: TC-010）
- [ ] 任务 4 — RocketMQ Dashboard 外链（地址配置化）（verifies: TC-010）
- [ ] 任务 5 — 全量回归 vitest run（既有页面/路由零回退）（verifies: TC-011）

## Acceptance Criteria

- [ ] AC-038 — 手动重试/标记完成动作受新权限码控制、二次确认；成功后状态正确并刷新；操作反馈清晰，审计由后端记录

## 执行顺序（Execution Order）

1 → 2 → 3 → 4 → 5

## 并行度（Parallelization）

无（API 先行，视图随后，回归收口）。

## Verification

- Unit: mall-admin 目录 `pnpm vitest run`
- Error Case: 动作失败经拦截器提示、列表状态不变
