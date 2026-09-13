# DU Task Design — DU-FE-304

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"

## 1. Goal

mall-admin 商品列表/详情页上架/下架按钮，调用后端 publish/unpublish API。

## 2. Repository

repo-2（ai-platform-frontend）

## 3. Scope

- mall-admin: src/api/product/product.ts 增加 publishProduct/unpublishProduct；ProductListView 增加操作列

## 4. Design References

- story-design.md §1 模块改动、§2 接口契约

## 5. Dependencies

DU-BE-306（后端 publish/unpublish API）

## 6. Implementation Sketch

- product.ts：publishProduct(id) → POST /api/admin/products/{id}/publish；unpublishProduct(id) → POST /{id}/unpublish。
- ProductListView.vue：操作列根据 status 显示"上架"（DRAFT/OFF_SALE）或"下架"（ON_SALE）按钮，点击调用对应 API 后刷新列表。

## 7. Pseudocode

N/A（按钮点击 + API 调用 + 列表刷新，标准前端交互）
