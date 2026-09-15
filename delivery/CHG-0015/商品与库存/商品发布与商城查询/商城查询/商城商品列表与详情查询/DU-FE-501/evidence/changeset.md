# Changeset — DU-FE-501

> 仓库：repo-2（ai-platform-frontend / mall-admin），分支 M3-dev。
> 范围：CHG-0015 雪花 ID 字符串化的前端类型与视图回归。**仅业务 ID 变字符串**；
> 金额（分）/数量/分页（page、size、current、total、salePriceInCents、totalQuantity、level、sort、sortOrder）保持 number。

## API 类型层（commit dd034e8）

| 文件 | 改动 |
|---|---|
| `mall-admin/src/api/product/product.ts` | ProductItem.id/categoryId/brandId、ImageView.id、AttributeView.id、SkuView.id、ProductQuery 与 SaveProductPayload 的 categoryId/brandId、全部方法 id/productId/skuId 形参、create/addSku 返回 `{id}` 改 string；金额/排序/分页保持 number |
| `mall-admin/src/api/product/brand.ts` | BrandItem.id、create 返回、update/changeStatus 形参改 string；sort 保持 number |
| `mall-admin/src/api/product/category.ts` | CategoryNode.id/parentId（根节点 `"0"`）、CategoryPayload.parentId?、tree 之外各方法 ID 形参改 string；level/sort 保持 number |
| `mall-admin/src/api/inventory/inventory.ts` | InventoryItem.skuId、InventoryLogItem.id/skuId/operator、page/get/init/adjust/logs 形参改 string；数量字段保持 number |
| `mall-admin/src/api/product/brand.spec.ts` | ID 夹具改 19 位字符串（`1900000000000000001` 等），newId 变量、模板字符串 URL |
| `mall-admin/src/api/product/category.spec.ts` | parentId `"0"`、19 位 ID、模板字符串 URL |

## 视图层（commit ffeb468）

| 文件 | 改动 |
|---|---|
| `views/product/product-editor.ts` | `ProductFormInput.categoryId: string[]`、`brandId: string\|null`（级联路径/品牌均字符串） |
| `views/product/ProductEditView.vue` | `editingId/skuEditingId` 改 string；路由 query.id 用 `String()` 直取（**禁 Number()**）；表单 categoryId `string[]`/brandId string；`EditableSku.id` 改 string，未保存商品的本地 SKU 用 `local-<n>` 临时键 |
| `views/product/ProductListView.vue` | filters.categoryId/brandId 改 string\|undefined（el-select 无需 .number）；ID 列宽 80→190 |
| `views/product/BrandListView.vue` | editingId 改 string；ID 列宽 80→190 |
| `views/product/CategoryTreeView.vue` | editingId/parentId 改 string；根节点比较与标题判断 0→`"0"`；openCreate 形参 string |
| `views/inventory/InventoryListView.vue` | filters.skuId/initForm/adjustForm.skuId 改 string（trim 后提交，空串→undefined）；初始化 SKU 输入由 el-input-number 改 el-input（maxlength=19，`/^\d{1,19}$/`）；表格 skuId 列 200 |
| `views/inventory/InventoryLogView.vue` | filters.skuId 改 string + trim；id 列 190、skuId 列 200 |
| `views/product/product-editor.spec.ts` | 表单夹具 categoryId/brandId 改 19 位字符串；新增断言 payload.categoryId/brandId 字符串不丢精度 |

## 不纳入本次变更

- `src/components.d.ts`、`src/auto-imports.d.ts`：unplugin 自动生成，不随本次手工改造提交。
- 金额、数量、分页、层级、排序等数值字段：契约保持 number。
