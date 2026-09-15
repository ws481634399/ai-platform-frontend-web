# DU Implementation — DU-FE-703

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。

## 变更内容

### API 层
- `catalog.ts` 扩展：`getProducts(query)`、`getCategoriesTree()`、`getBrands(page,size)`
- `serializeProductQuery(query)`：brandIds 逗号序列化，空值字段省略
- 类型：`CategoryNode`、`BrandView`、`BrandPage`、`ProductListItem`、`PageView<T>`、`ProductListQuery`

### 商品列表页
- `views/product/ProductListView.vue`：
  - 侧栏分类树（全部 + 根分类，点击 setCategory → replace query）
  - 品牌多选（checkbox，toggleBrand）
  - 排序条四档（default/newest/price_asc/price_desc）
  - 分页器（上一页/下一页，totalPages 计算）
  - **route.query 为唯一状态源**：筛选变化 → `router.replace({query})` → `watch(route.fullPath)` 发请求；刷新自然恢复
  - **竞态防护**：自增 `requestSeq`，仅最后一次响应落库
  - 三态：loading / empty（"没有符合条件的商品" + 清空筛选）/ error（重试保留 query）
  - 复用 `ProductCard`、`StateView`
- `router/index.ts`：注册 `/products` 路由（游客直达无守卫）

## Commits

| Hash | 类型 | 说明 |
|------|------|------|
| 5a97392 | feat | 商品列表页：分类树+品牌多选+排序+分页，query 唯一状态源 |

## Deviations

无。

## 自检

- query 序列化：brandIds 逗号、空值省略 —— catalog.spec.ts::serializeProductQuery
- getProducts 传参正确 —— catalog.spec.ts::getProducts
- route.query 驱动请求、刷新恢复 —— ProductListView watch(route.fullPath)
- 竞态防护 requestSeq —— loadProducts 内 seq 比对
- mall-web 全量 71 passed；build 成功
