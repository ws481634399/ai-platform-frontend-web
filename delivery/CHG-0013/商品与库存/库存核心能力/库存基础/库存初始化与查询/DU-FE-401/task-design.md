# DU Task Design — DU-FE-401

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。

## 1. Goal

mall-admin 库存列表（含初始化）、调整弹窗、流水页。

## 2. Repository

repo-2（ai-platform-frontend）

## 3. Scope

- src/views/inventory/InventoryListView.vue：库存列表 + 初始化 + 调整弹窗
- src/views/inventory/InventoryLogView.vue：流水列表
- src/api/inventory/inventory.ts：API 封装
- component-registry 注册库存组件

## 4. Design References

- requirement-design.md §3.2 repo-2
- story-design.md §1 模块改动、§2 接口契约

## 5. Dependencies

DU-BE-401、DU-BE-402

## 6. Implementation Sketch

```
InventoryListView
  ├── 库存列表表格（skuId/total/locked/available）
  ├── 初始化按钮 → 弹窗输入 skuId+totalQuantity
  └── 调整按钮 → 弹窗输入 delta+reason
InventoryLogView
  └── 流水列表表格（skuId/operationType/quantity/before/after/reason/occurredAt）
```

## 7. Pseudocode

N/A。前端页面为简单 CRUD UI，未命中 complexity-trigger。
