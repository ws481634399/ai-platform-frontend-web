# DU Implementation — DU-FE-401

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。

## 变更内容

管理端库存列表与库存流水页面。

### API 层

- `api/inventory/inventory.ts`（新增）：page/get/init/adjust/logs 方法，对齐后端 InventoryAdminController。

### 视图层

- `views/inventory/InventoryListView.vue`（新增）：库存列表（SKU ID/总库存/锁定库存/可用库存）、初始化弹窗、调整弹窗。
- `views/inventory/InventoryLogView.vue`（新增）：库存流水列表（操作类型/变动数量/变更前后/业务单号/Trace ID/时间）。

### 路由

- `router/component-registry.ts`：注册 `InventoryList`、`InventoryLog` 组件。

## Commits

| Commit | DU | 消息 |
| --- | --- | --- |
| 8a52622 | DU-FE-401 | feat(admin): 库存列表与流水前端页面 |

## Deviations

无。

## 自检

- [x] type-check 通过
- [x] build 通过
- [x] 库存列表展示 total/locked/available
- [x] 初始化弹窗校验 SKU ID 和总库存非负
- [x] 调整弹窗支持正负数量，提示入库/出库
- [x] 流水列表按操作类型着色，变动数量正负着色
