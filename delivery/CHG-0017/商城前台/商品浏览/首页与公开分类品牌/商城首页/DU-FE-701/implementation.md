# DU Implementation — DU-FE-701

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。

## 变更内容

### API 层
- `api/catalog.ts`：`catalogApi.getHome()` 调 `GET /api/mall/home`，解包 `HomeView`
- 类型：`CategoryEntry(id:string, name, iconImageUrl)`、`ProductCard(id,name,mainImageUrl,minPrice:number|null,maxPrice)`、`RecommendItem(...+source)`、`Banner`、`HomeView`
- 金额域统一整数分（number），ID 域字符串

### 公共组件（供列表/详情复用）
- `PriceText.vue`：整数分 → `¥X.XX`，用整数拆分元/分（`Math.floor(fen/100)` + `fen%100` + `padStart`），禁止 parseFloat 处理金额
- `StateView.vue`：loading/error/empty 三态插槽，error 带重试按钮 emit `retry`
- `ProductCard.vue`：名称 + 主图 `loading="lazy"` + 价区（min~max）+ 点击 `router.push(/products/:id)`
- `BannerSlot.vue`：banners=[] 渲染内置静态占位，否则渲染图片链接

### 首页
- `views/HomeView.vue`：四态（loading/empty/error/success）；分类入口点击 → `/products?categoryId=`；新品/推荐栅格
- `vite.config.ts`：vitest environment 改 `happy-dom`；新增 `@vue/test-utils` + `happy-dom` devDeps

## Commits

| Hash | 类型 | 说明 |
|------|------|------|
| 2c85e52 | feat | 商城首页 + 公共组件（ProductCard/PriceText/StateView/BannerSlot） |

## Deviations

无。

## 自检

- 四态渲染：loading/empty/error+重试/success —— HomeView.spec.ts 4 例验证
- 分类点击 → `/products?categoryId=1`；卡片点击 → `/products/101` —— HomeView.spec.ts success 用例
- 金额整数分无浮点：9900→¥99.00、19999→¥199.99、5→¥0.05、null→¥-- —— PriceText.spec.ts 4 例
- API 契约：GET /api/mall/home，HomeView 含 categoryEntries/newArrivals/recommends/banners —— catalog.spec.ts 2 例
- 全量测试 68 passed（15 文件，既有 54 + 新增 14）；build 成功
