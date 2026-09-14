# DU Task Design — DU-FE-402

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）；本文件只按 DU id DU-FE-402 引用该表，不新造 DU。
> 互链：通过 DU id DU-FE-402 与同目录 task-spec.md（"做什么/验收"）配对互链。
> 本文件固定为 Expected Implementation（Plan / Sketch / Pseudocode），
> 与 implementation.md（Actual Implementation）分立，不得合并。

## 1. Goal

补齐 mall-admin 商品图片、属性和创建前 SKU 编辑，修复 M1 HTTP/lint 回归。

## 2. Repository

repo-2（`implementation/ai-platform-frontend`）。

## 3. Scope

- `mall-admin/src/views/product/ProductEditView.vue`
- `mall-admin/src/api/product/product.ts`
- `mall-admin/src/api/http.ts` 及测试
- `mall-admin/src/components/PageHeader.vue`

## 4. Design References

- `requirement-design.md` §2/§4/§6。
- `story-design.md` §1/§2。

## 5. Dependencies

DU-BE-401。

## 6. Implementation Sketch

1. 抽取表单状态中的 `images`、`attributes`、`skus`，提供显式新增/删除操作。
2. 新建模式下 SKU 对话框写入本地数组，不要求 editingId；保存时一次组装 Product payload。
3. 编辑模式回显图片/属性/SKU，Product 保存后对新 SKU 使用现有子资源 API。
4. HTTP 401 判断使用认证端点排除函数，单测覆盖 login/refresh/\u4ed6 API。
5. 修正 lint 并执行全量质量门。

## 7. Pseudocode

N/A；本 DU 是现有表单和拦截器的增量补全，没有新算法或状态机。
