# DU Implementation — DU-FE-704

> DU 级实施记录（Actual Implementation）。

## 变更内容

### API（api/catalog.ts）
- 新增 `getProductDetail(id)` → `ProductDetail`（含 brandName/categoryPath/specDimensions/skuIndex）
- 新增 `getSkuAvailability(skuIds[])` → `SkuAvailability[]`（POST /api/mall/skus/availability）
- 完整类型：ProductDetail/SkuView/SpecDimension/SkuIndexEntry/StockStatus 等

### SkuSelector.vue（表驱动规格选择器）
- props：dimensions / skuIndex / dimensionsOrder
- 已选 Map（维度→值），组合键 computed 按 dimensionsOrder 拼 `|`
- 命中 → 唯一 SKU；未选齐 → null
- DISABLED 组合值置灰不可点（基于已选维度推导）
- emit `change(sku)`

### StockBadge.vue（库存三态）
- IN_STOCK 现货 / LOW_STOCK 库存紧张 / OUT_OF_STOCK 缺货 / UNKNOWN 状态获取失败+重试按钮
- 加购按钮与三态绑定：OUT_OF_STOCK/UNKNOWN 禁用

### ProductDetailView.vue
- 四态加载（StateView）；404 专门态（无加购入口）
- 图集缩略图切换 + 异常占位
- 富文本 DOMPurify.sanitize 后 v-html
- 面包屑 categoryPath
- 进入页面批量查询所有启用 SKU 可售状态；UNKNOWN 局部重试
- 加购按钮占位（CHG-0018 接入）
- 路由 `/products/:id` 注册

## Commits

| Hash | 类型 | 说明 |
|------|------|------|
| 30712bd | feat | 商品详情页 + SKU 选择器 + StockBadge |

## Deviations

无。

## 自检

- SkuSelector 选齐命中唯一 SKU / 未选齐 null / DISABLED 置灰 —— SkuSelector.spec.ts (3)
- StockBadge 三态文案 + UNKNOWN 重试 —— StockBadge.spec.ts (3)
- catalog getProductDetail / getSkuAvailability —— catalog.spec.ts (3)
- mall-web 全量 80 passed；vite build 成功
