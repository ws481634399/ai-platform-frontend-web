# DU Task Design — DU-FE-701

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 首页：四态（loading/empty/error/success）、分类入口与商品卡片路由、静态 banner 位、价区整数分展示、图片懒加载；并沉淀 ProductCard/PriceText/StateView 基础组件。

## 2. Repository

repo-2（ai-platform-frontend / mall-web）

## 3. Scope

- api/catalog.ts：getHome 类型（id 字符串、minPrice/maxPrice number 整数分）。
- views/home/HomeView.vue；components：ProductCard.vue（名称/主图懒加载 loading=lazy/价区/点击跳详情）、PriceText.vue（整数分→¥ 展示，禁止 parseFloat 处理金额，仅展示层除以 100 且用整数格式化）、StateView.vue（loading/empty/error 三态插槽，本 Story 沉淀供列表/详情复用）、BannerSlot.vue（静态占位位，banners=[] 时渲染内置静态内容）。
- 分类入口点击 → /products?categoryId=；卡片 → /products/:id（游客直达，无守卫）。

## 4. Design References

- CHG-0017 requirement-design.md §3.1（mall-web 组件策略与状态态）、§4（/home 契约）；STORY-003-02-01-01 story-design.md §1 repo-2 段。

## 5. Dependencies

DU-BE-701（/home 契约）。StateView 等组件为后续 DU-FE-703/704 复用基础。

## 6. Implementation Sketch

- 挂载请求 → loading；成功且全空段 → empty 引导；失败 → error 带重试按钮；成功 → 栅格渲染。
- 金额域模型保持 number（整数分）；PriceText 仅展示层 `¥{(fen/100).toFixed(2)}`（注意 toFixed 前用整数运算，避免浮点；可直接用整数拆分元/分）。
- 图片 objectKey/URL：直接用后端返回的完整 imageUrl/mainImageUrl。
- vitest：四态渲染快照；点击 router push 断言；三检。

## 7. Pseudocode

N/A（metadata `pseudocode: false`）。展示型页面。
