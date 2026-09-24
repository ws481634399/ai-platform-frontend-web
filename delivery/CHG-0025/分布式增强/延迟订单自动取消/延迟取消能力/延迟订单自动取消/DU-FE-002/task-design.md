# DU Task Design — DU-FE-002

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §0（SSOT）；本文件只按 DU id DU-FE-002 引用该表，不新造 DU。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

mall-admin 新增延迟取消任务查询页：对接 DU-BE-004 的 `/api/admin/order-delay/tasks`，支持三态筛选分页与手动取消（二次确认+权限指令），覆盖 AC-032 前端部分。

## 2. Repository

repo-2（implementation/ai-platform-frontend，mall-admin 应用）。

## 3. Scope

- mall-admin/src/api/distributed.ts：DelayTaskStatus、DelayTaskView、delayTaskApi。
- mall-admin/src/views/distributed/DelayTaskListView.vue。
- mall-admin/src/router/component-registry.ts：DelayTaskList。

## 4. Design References

- requirement-design.md §2.2（DelayTaskListView.vue：任务列表+手动取消）、§5.2（DU-FE-002）。
- story-design.md §1.10（前端改动）、§2（接口契约）。
- 复用模式：OutboxListView.vue（筛选/表格/分页/弹窗）、distributed.ts（unwrap/page 风格）。

## 5. Dependencies

- DU-BE-004：后端任务列表与手动取消 API 契约冻结（字段/路径/状态枚举）。

## 6. Implementation Sketch

- **distributed.ts**：`DelayTaskStatus='PENDING'|'CANCELLED'|'FAILED'`；`DelayTaskView{orderId:string,orderNo:string,delayStatus:DelayTaskStatus,createdAt:string,cancelledAt:string|null,lastError:string|null}`；delayTaskApi.page 构造 query（默认 page=1/size=20，status 有值才携带）走 `/api/admin/order-delay/tasks`；cancel(orderId,reason?) POST `/api/admin/order-delay/tasks/{orderId}/cancel`；复用 unwrap。
- **DelayTaskListView**：仿 OutboxListView 结构——el-select 状态筛选（待取消/已取消/失败）+ 查询/重置；el-table 列：orderNo、delayStatus（el-tag 映射 PENDING=warning「待取消」/CANCELLED=success「已取消」/FAILED=danger「失败」）、创建时间 formatDateTime、取消时间、lastError（show-overflow-tooltip）；操作列 PENDING 显示「手动取消」（v-permission order-delay:cancel），el-popconfirm 确认后调 api.cancel → ElMessage.success → loadPage；失败由拦截器提示；分页/空态/v-loading 对齐。
- **component-registry**：`DelayTaskList: () => import('@/views/distributed/DelayTaskListView.vue')`。
- 菜单由 mall-identity V14 动态下发，不改静态 MenuItems。

## 7. Pseudocode

N/A（纯展示+单按钮交互，无 orchestration/state-transition；逻辑分支已在 §6 列明）。
