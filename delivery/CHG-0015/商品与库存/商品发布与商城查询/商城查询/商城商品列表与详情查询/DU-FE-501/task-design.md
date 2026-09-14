# DU Task Design — DU-FE-501

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

字符串 ID 改造后 mall-admin 商品/SKU/分类/品牌/库存五个业务面的类型与页面回归；验证 skuId 端到端不丢精度。

## 2. Repository

repo-2（ai-platform-frontend，mall-admin 应用）

## 3. Scope

- mall-admin/src/api/**：product(product.ts/brand.ts/category.ts)、inventory.ts 中所有 ID 字段类型 number→string；请求参数序列化（URL/body 传字符串，不在前端做数值转换）。
- views/product/**、views/inventory/**：行 key、详情路由跳转参数、表单回显/提交、比较逻辑去数值化。
- 类型逃逸点以 vue-tsc 报错清单逐个修复。

## 4. Design References

- CHG-0015 requirement-design.md §3.2、§4（契约形态变化）；story-design.md §1 repo-2 段、§6 前端测试策略。

## 5. Dependencies

无（与 DU-BE-501 联调，接口契约先行为实际前置；权威表跨仓依赖在 Change §6 声明）。

## 6. Implementation Sketch

- 类型层：API 响应 interface 的 id/skuId/categoryId/brandId/productId 改为 string；分页 current/total 与 price/stock 保持 number。
- 视图层：路由 push 用字符串 id；el-table row-key 直接用字符串；表单 v-model 中 ID 字段不做 Number()；删除/操作参数透传字符串。
- 验证：vue-tsc --noEmit 清零 → 五页面手工冒烟（列表→筛选→新增/编辑→详情→跳转）→ build。

## 7. Pseudocode

N/A（metadata `pseudocode: false`）。纯类型与视图回归，无算法。
