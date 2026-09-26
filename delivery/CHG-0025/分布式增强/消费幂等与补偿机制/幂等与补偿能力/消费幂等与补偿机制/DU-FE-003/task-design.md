# DU Task Design — DU-FE-003

> 层级：实现仓侧产物——Expected Implementation 之"怎么做"（落地草图）。
> 权威设计：外部 story-design.md；本文件不复制全文，只给落地骨架。

## 1. Goal

增强补偿任务页：操作类型/聚合 ID 筛选、payload 查看、人工标记完成与权限码更新、Dashboard 外链。

## 2. Repository

repo-2（mall-admin）。

## 3. Scope

- 修改：补偿 API（page 参数/complete）、CompensationListView.vue（筛选/操作/payload）。
- 新增：无新页面（复用 /orders/compensations 路由）。

## 4. Design References

- 外部：stories/STORY-009-05-01/story-design.md §2、test-design.md TC-010/011
- 后端契约：/api/admin/compensations（operation/aggregateId；/{id}/complete）

## 5. Dependencies

DU-BE-005。

## 6. Implementation Sketch

```
api（既有 compensation 定义所在文件）
  CompensationQuery: + operation?: string; aggregateId?: string
  compensationApi.page(query)             // GET /api/admin/compensations
  compensationApi.complete(id)            // POST /{id}/complete

views/order/CompensationListView.vue
  toolbar:
    + el-select operation（CONFIRM_INVENTORY/RELEASE_INVENTORY/AUTO_CANCEL_ORDER）
    + el-input aggregateId
  table:
    + 列「Payload」行内展开（el-dialog 或 el-popover，JSON.stringify 美化）
  操作列:
    重试按钮（既有）→ v-permission="'system:compensation:retry'"
    标记完成按钮 → el-popconfirm 二次确认
                  v-permission="'system:compensation:complete'"
                  data-testid="compensation-complete"
    ElMessage.success('已标记完成') + reload
  页头:
    RocketMQ Dashboard 外链（import.meta.env 配置，缺省不显示）
```

## 7. Pseudocode

N/A——纯前端页面增强（筛选/展示/二次确认），无复杂编排或状态机，Implementation Sketch 已足够。

## 8. 测试落点

- API spec：新参数 URL 拼接与解包；complete POST URL。
- 视图契约 spec：筛选控件、popconfirm、v-permission 码、testid。
- TDD 红灯先行，一任务一提交。
