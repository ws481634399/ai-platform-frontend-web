# DU Task Design — DU-FE-001

> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

实现 mall-admin Outbox 管理页：按状态/事件类型/聚合 ID 筛选分页、查看 payload 抽屉、FAILED 记录手动重投、审计展示。覆盖 AC-016。

## 2. Repository

repo-2（implementation/ai-platform-frontend）。

## 3. Scope

- `src/api/distributed.ts`：outboxList / outboxGet / outboxRetry 接口封装。
- `src/views/distributed/OutboxListView.vue`：筛选表单 + 分页表格 + payload 抽屉 + 重投按钮（仅 FAILED 可点）+ 审计信息展示。
- 路由 + 菜单注册（分布式模块分组）；`v-permission="system:outbox:list"` / `"system:outbox:retry"`。

## 4. Design References

- story-design.md §1（repo-2 模块改动）、§2（接口契约）。
- requirement-design.md §4（API Contract）。

## 5. Dependencies

- DU-BE-002（OutboxAdminController API 契约 + 权限码）。

## 6. Implementation Sketch

- OutboxListView：筛选条件 status/eventType/aggregateId → 调 outboxList 分页渲染；行点击展开 payload JSON 抽屉；FAILED 行显示「重投」按钮 → 调 outboxRetry → 成功后刷新列表 + toast；展示 lastError/createdAt/sentAt/操作审计。
- 错误处理：重投失败 toast 提示；列表加载骨架屏。
- 复用既有表格/筛选/审计组件模式。

## 7. Pseudocode

命中 business-flow，必填。

```
onRetry(id):
  confirm()
  await outboxRetry(id)
  toast.success('已重投')
  reloadList()
```
