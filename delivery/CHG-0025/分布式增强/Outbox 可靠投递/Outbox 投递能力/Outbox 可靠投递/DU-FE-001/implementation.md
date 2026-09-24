# DU Implementation — DU-FE-001

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。

## 变更内容

- **任务 1**（API 封装）：`src/api/distributed.ts`——outboxApi.page/get/retry，类型 OutboxView/OutboxStatus/PageView，对齐后端 OutboxAdminController 契约。
- **任务 2**（页面）：`src/views/distributed/OutboxListView.vue`——状态/事件类型/聚合 ID 筛选 + 分页表格 + Payload 抽屉（含 traceId/sentAt 元信息）+ FAILED 行「重投」按钮（v-permission system:outbox:retry）+ 成功 toast + 列表刷新。
- **任务 3**（路由注册）：`component-registry.ts` 注册 `OutboxList` → OutboxListView，对齐后端 V13 菜单 component_key。

## Commits

| Commit | 任务 | 说明 |
| --- | --- | --- |
| （repo-2 HEAD） | 任务 1~3 | CHG-0025 STORY-009-02-01 Outbox 事件管理页（DU-FE-001） |

- 本地提交，未推送。

## Deviations

无。实现与 task-design/task-spec 一致。
