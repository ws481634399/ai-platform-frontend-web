# DU Task Design — DU-FE-303

> 权威 DU 划分：story-design.md §5（SSOT）
> 本文件固定为 Expected Implementation。

## 1. Goal

mall-admin 商品列表/创建/编辑/查看页（含 SKU 表单、图片、属性区块）。

## 2. Repository

repo-2（ai-platform-frontend）

## 3. Scope

- mall-admin: src/views/product/ProductListView.vue、ProductEditView.vue（基本信息+图片+属性+SKU 区块）、src/api/product/product.ts、component-registry 注册 ProductList

## 4. Design References

- requirement-design.md §3 仓库影响、§6 DU 划分
- story-design.md §1 模块改动、§2 接口契约

## 5. Dependencies

DU-BE-304、DU-BE-305

## 6. Implementation Sketch

- API 模块 product.ts：封装 list/get/create/update/changeStatus/addSku/updateSku/changeSkuStatus，http.ts 自动解包 UnifyResult。
- ProductListView：分页表格（名称/分类/品牌/状态），搜索/筛选，跳转创建/编辑/查看。
- ProductEditView：el-form 基本信息（名称/副标题/描述/分类选择/品牌选择）、图片上传（objectKey+url）、属性键值对动态表、SKU 子表（编码/规格键值/价格元→分/启停）。
- 权限按钮：has('product:product:create') 等控制。
- 路由：动态菜单 component_key=ProductList。

## 7. Pseudocode

N/A（前端表单装配，无复杂算法/状态机；SKU 价格元分转换为简单算术）
