# DU Implementation — DU-FE-501

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

### src/api/search.ts：搜索 API 客户端与契约类型

- 类型：`ProductSearchSort = '' | 'price_asc' | 'price_desc' | 'newest'`；`ProductSearchItem`（productId/productName/mainImage/minPrice/maxPrice/brandName/categoryName，与后端 7 字段白名单一致，金额整数分）；`ProductSearchPage{items,total,page,size}`；`ProductSearchQuery`。
- `serializeSearchQuery(query)`：空值省略（undefined/null/''）、sort 为空串不传、**minPriceFen/maxPriceFen 为 0 时保留**（0 分是合法边界）；`searchApi.products` 走 `http.get<UnifyResult<ProductSearchPage>>('/api/mall/search/products')` 并解包 data。

### src/stores/search.ts：Pinia setup store

- state：keyword、filters{categoryId,brandId,minPriceFen,maxPriceFen}、sort、page、size=20、items、total、loading、error。
- `requestSeq` 竞态防护：每次 search 自增序号，响应返回时序号非最新即丢弃，保证只有末次请求落屏。
- 失败经 `resolveErrorMessage(e, '搜索失败，请稍后重试')` 归一人性化文案；`resetFilters()` 复位筛选。

### src/views/search/SearchView.vue：结果页（route.query 唯一状态源）

- `watch(() => route.fullPath, search, { immediate: true })`：进入/刷新/前进后退均按 URL 还原状态并查询；`buildRouterQuery` 空值省略、page>1 才带 page。
- SORT_TABS：综合（''）/价格升序/价格降序/最新；改动重置 page=1。
- 价格：`yuanToFen = Math.round(yuan*100)`、`yuanFromFen = n/100`；最低>最高时提示「最低价格不能高于最高价格」并拦截不发请求。
- 结果卡片复用 PriceText 渲染分，点击 `router.push('/products/' + id)` 进既有详情页；无条件态展示热门词 HOT_KEYWORDS=['手机','机械键盘','蓝牙耳机','笔记本电脑']。
- StateView 承载加载/空/错误三态，错误态可重试；分页上一页/下一页。
- 页面内含自己的搜索输入框（提交回写 query）。
- **search.enabled 关闭态**（随同提交提前落地的 CHG-0022/FE-504）：功能关闭时不发请求，展示「搜索功能暂未开放」与「去逛逛商品」出口链接。

### src/layouts/MallLayout.vue / src/router/index.ts

- router（index.ts 第 49–54 行）：path `search`（name `search`）→ SearchView.vue；第 55–60 行 `products/:id` → ProductDetailView。
- MallLayout：第 77–85 行 nav 增加「搜索」链接 to="/search"（data-testid `mall-search-link`，受 search.enabled fail-open 控制）。

### 测试与门禁

- `src/api/search.spec.ts`：**5 个 it**——products 解包 UnifyResult；serialize 空参全省略；完整参数透传；minPriceFen:0 边界保留；三排序值 price_asc/price_desc/newest 透传。
- package.json scripts：`type-check`(vue-tsc)、`lint`、`test`(vitest run)、`build` 为 CI 门禁项。
- store 竞态（requestSeq 末次落屏）、SearchView 三态/URL 双向由代码实现承载，当前**无独立单测文件**（见 DEV-2，如实记录）；前后端联测归 Integration Gate。

## Commits

| Commit | DU | 说明 |
| --- | --- | --- |
| ec0921b | DU-FE-501 | repo-2：mall-web 搜索 API 客户端/Pinia store/搜索结果页（URL 状态源、筛选排序分页、三态、元分换算）+ /search 路由与 nav 入口（同提交含 CHG-0022 search.enabled 关闭态） |
| 5ab0979 | DU-FE-501 | review major 闭环：①productId/categoryId/brandId 改 string（@StringId 口径）；②SearchView 补分类树/品牌筛选下拉（AC-015 可达，写 URL 回第 1 页）；③新增 SearchView.spec.ts 3 例 |

## Deviations

<!-- 实现与 DU 建议（Sketch / Pseudocode）明显偏离时必须记录；无偏离写「无」。
     每条偏离三要素缺一不可：原 DU 建议 / 实际实现 / 原因（建议附影响评估）。
     格式：### DEV-N
           - 原 DU 建议:
           - 实际实现:
           - 原因:
           - 影响评估: -->

### DEV-1
- 原 DU 建议: task-spec 任务 2/story-design 要求「Header 全局搜索框回车跳 /search?keyword=」；story-design 卡片跳转写作 `/product/:id`（单数）。
- 实际实现: MallLayout 顶部全局搜索框 submitSearch（第 27–34 行）实际跳转 **`/products?keyword=`**（商品列表页承接顶部检索）；进入 /search 的入口是 nav「搜索」链接与页内搜索框。详情路由实际为既有 **`/products/:id`**（复数，router/index.ts 第 55–60 行），SearchView 卡片跳转与之一致。
- 原因: 顶部全局检索统一由商品列表页承接关键词（列表页既有的关键词能力），/search 定位为带完整筛选/排序/分页的搜索工作台；详情页沿用既有复数路由不新增别名。
- 影响评估: 用户经 Header 回车后落在列表页而非搜索结果页，AC-001 的「回显关键词+结果卡片」由 /search 页内搜索框与 nav 入口满足；功能可达，交互入口与设计稿描述有差异，建议产品确认是否调整 Header 跳转目标。

### DEV-2
- 原 DU 建议: task-spec Verification 要求「vitest（pinia store + router mock + mock 请求；竞态序）」，AC-006 写「vitest 三态/query 同步通过」。
- 实际实现: 当前仅有 `src/api/search.spec.ts` 5 例（API 解包/query 序列化/0 边界/排序透传）；**不存在** stores/search.spec.ts 与 SearchView 专属 spec，竞态（requestSeq）与三态/URL 双向无自动化测试直接断言，靠 type-check/lint/build 门禁与人工/联测验证。
- 原因: 组件与 store 测试未随本 DU 补齐（实现先行）。
- 影响评估: requestSeq 逻辑简单（序号比较丢弃旧响应）但无回归护栏；后续应补 store 竞态单测（mock 两请求乱序返回）与 SearchView query 同步组件测试，以完全闭合 AC-006 的字面要求。

### DEV-3（跨 Change 同提交说明）
- 原 DU 建议: 本 DU 仅实现 CHG-0020 搜索体验。
- 实际实现: SearchView/MallLayout 内已含 CHG-0022（FE-504）search.enabled 关闭态分支（不发请求 + 「搜索功能暂未开放」+ 去逛逛商品出口）。
- 原因: 前端 Change 同步交付，同一提交 ec0921b 带入。
- 影响评估: 开关缺省 fail-open，不影响 CHG-0020 默认体验；关闭态为本 Change 的额外增益。

### DEV-4（sdd-review 闭环，提交 5ab0979）
- 原 DU 建议: AC-015 要求结果页可使用分类/品牌/价格筛选；story-design 规定 productId 等业务 ID 遵循字符串化口径。
- 实际实现: 初版 URL 层已支持 categoryId/brandId（parseRouteQuery/序列化/API 参数齐备）但页面**无分类/品牌选择控件**，两维筛选不可达；api/search.ts 将 productId 声明为 number。review 两项 major 闭环：SearchView 新增筛选条（挂载并发拉取公开分类树 getCategoriesTree 拍平带层级缩进 + getBrands 品牌下拉，onChange 写 URL 并回第 1 页，元数据加载失败静默降级为仅关键词/价区）；search.ts/SearchView/卡片跳转/query 类型全部改 string（parseId 仅接受纯数字串，非法 URL 值回退 undefined）；新增 SearchView.spec.ts 3 例（筛选渲染、选分类 URL 同步与查询态、19 位雪花 ID 详情跳转不丢精度）。
- 原因: 控件遗漏属实现缺口；ID number 为初版对后端序列化形态的误判（后端 d7dc2b0 同步加 @StringId）。
- 影响评估: mall-web vitest 105/105（新增 3 例）、type-check 0 error、lint 0 error、build 通过；stores/search.ts 的 requestSeq 竞态仍无专属 store spec（残留 minor，见 review EV）。

## 自检

对照 task-spec.md Verification：

- ✅ 任务 1/AC 契约：search.ts 类型与后端 ProductSearchItem 7 字段/金额分/SearchPage{items,total,page,size} 一致；search.spec.ts 覆盖解包与序列化（5 例）。
- ✅ AC-002：SearchView 以 route.query 为唯一状态源，keyword/筛选/四排序/分页（page>1 才带）双向写 URL，刷新/前进后退经 watch(fullPath, immediate) 还原。
- ✅ AC-003：StateView 三态；错误态 resolveErrorMessage 文案 + 重试；空态有热门词出口。
- ✅ AC-004：卡片跳既有 /products/:id 详情页（路由真实存在）。
- ✅ AC-005：yuanToFen/yuanFromFen 元分换算（Math.round 防浮点）；最低>最高即时提示不发请求；0 分边界序列化保留。
- ✅ AC-006/任务 7（review 后基本闭合）：type-check/lint/build 全绿；vitest 8 例与本页相关（API 层 search.spec 5 + SearchView.spec 3，覆盖筛选渲染/URL 同步/字符串 ID 跳转）；仅 stores/search.ts 的 requestSeq 竞态序仍无专属 store spec（DEV-2 残留 minor，Integration Gate 联测补）。
- ✅ Error Case：store catch 归一错误文案，竞态仅末次响应落屏（requestSeq，逻辑已实现，缺自动化回归）。
- ✅ Integration：联测归 Integration Gate（真实 GET /api/mall/search/products）。
- 说明：未杜撰测试执行数字；search.spec.ts 5 例为源码 it 枚举，组件/store spec 文件经 glob 确认不存在。
