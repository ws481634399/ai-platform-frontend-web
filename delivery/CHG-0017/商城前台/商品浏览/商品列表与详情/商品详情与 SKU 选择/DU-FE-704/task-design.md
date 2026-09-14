# DU Task Design — DU-FE-704

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 商品详情页：图集/富文本（净化）/面包屑、表驱动规格选择器 SkuSelector（组合→唯一 skuId、价格/图片/三态联动）、StockBadge 三态（含 UNKNOWN 重试降级）、商品 404 页、游客直达。

## 2. Repository

repo-2（ai-platform-frontend / mall-web）

## 3. Scope

- api/catalog.ts：getProductDetail(id)、postSkuAvailability(skuIds[])；类型 skuId 字符串、priceFen number。
- views/product/ProductDetailView.vue：StateView 四态；404 专门态（无加购入口）；图集（缩略图切换、异常占位）；富文本 v-html 前 DOMPurify 净化；面包屑 categoryPath。
- components/SkuSelector.vue：props specDimensions+skuIndex；已选 Map（维度→值）；组合键 computed（按 dimensionsOrder 拼 "|"）；命中 → 唯一 sku；未选齐/无组合 → 无 skuId；禁用组合（status DISABLED）置灰不可点；缺货组合可看不可加购。
- components/StockBadge.vue：skuId 集批量调 availability（一次）→ IN_STOCK/LOW_STOCK/OUT_OF_STOCK；UNKNOWN 显示"状态获取失败"+重试小按钮（仅重试三态，不阻塞图文浏览）；加购按钮与三态绑定（OUT_OF_STOCK/UNKNOWN 禁用）。
- 加购入口在本 Story 仅按钮与事件占位（接入购物车为 CHG-0018 DU-FE-801）。

## 4. Design References

- CHG-0017 requirement-design.md §3.1（表驱动选择器/三态降级）、§4（详情与 availability 契约、阈值 10 在后端，前端只消费三态）；STORY-003-02-02-02 story-design.md §1 repo-2 段。

## 5. Dependencies

DU-BE-704（详情矩阵）；三态数据跨 Story 依赖 DU-BE-705（availability 公开端点）。

## 6. Implementation Sketch

- 选中联动：任一维改变 → 重算组合键 → 命中 SKU 则切换主图（sku.imageUrl ?? 主图）、PriceText、StockBadge 状态；切到新 skuId 时三态若未查则并入一次批量请求。
- 可用性批量：进入页面收集全部 enabled skuId 一次调用（≤100 上限由后端管；详情 SKU 数现实远低）；UNKNOWN 条目允许局部重试（仅传 UNKNOWN 的 id）。
- 金额全程 priceFen 整数；无 parseFloat。
- vitest 矩阵驱动（fixture 构造二维矩阵，断言每个完整选择路径唯一 sku）、置灰、三态联动、UNKNOWN 重试；三检。

## 7. Pseudocode

N/A（metadata `pseudocode: false`）。选择为声明式 computed 表查找，非过程算法。
