# DU Task Design — DU-FE-703

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 商品列表页：筛选（分类/品牌多选）、排序、分页与 URL query 双向同步、刷新恢复，全部状态态（loading/empty/error），复用 ProductCard/StateView。

## 2. Repository

repo-2（ai-platform-frontend / mall-web）

## 3. Scope

- api/catalog.ts：getProducts(query) 类型与 query 序列化（brandIds 逗号、page/size/sort/categoryId）。
- views/product/ProductListView.vue：侧栏分类树（getCategoriesTree，点击 categoryId）、品牌多选（getBrands）、排序条（四档）、分页器；router query 为唯一状态源（筛选变化 → replace query → watch query 发请求；刷新自然恢复；支持外部链接直达）。
- 状态：StateView loading/empty（"没有符合条件的商品"+清空筛选）/error（重试，保留 query）；列表用 ProductCard。
- 金额：number 整数分域模型，无 parseFloat；游客直达无守卫。

## 4. Design References

- CHG-0017 requirement-design.md §3.1、§4；STORY-003-02-02-01 story-design.md §1 repo-2 段。复用 DU-FE-701 组件。

## 5. Dependencies

DU-BE-703（/products）；分类/品牌取 DU-BE-702 端点。

## 6. Implementation Sketch

- query ↔ state：route.query 解析（parseInt page、split brandIds、白名单 sort）；任何筛选变更重置 page=1；请求参数严格映射，非法值不传。
- 请求防抖（分类树点击）可不需要；请求竞态：用自增 requestSeq，仅最后一次响应落库（防快速翻页旧响应覆盖）。
- 空页（page 超出）显示 empty 而非报错。
- vitest：query 同步、竞态、三态；三检。

## 7. Pseudocode

N/A（metadata `pseudocode: false`）。查询驱动视图，无算法。
