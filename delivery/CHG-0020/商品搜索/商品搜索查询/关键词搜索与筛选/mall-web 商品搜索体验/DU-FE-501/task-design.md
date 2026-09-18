# DU Task Design — DU-FE-501

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 搜索体验：全局搜索框、SearchView 结果页（筛选/排序/分页/URL 双向同步）、空/Loading/Error 三态、跳详情。

## 2. Repository

repo-2（ai-platform-frontend：mall-web）

## 3. Scope

- src/stores/search.ts：state（keyword/filters/sort/page/size/items/total/loading/error）、fetchProducts、竞态防护（请求序号或 AbortController）。
- src/api/search.ts：GET /api/mall/search/products 封装（沿用既有 request 实例）。
- src/views/search/SearchView.vue：搜索框、类目/品牌筛选、价格区间（元→分 ×100）、排序 Tabs、结果卡片网格、分页、空态/骨架/错误态（重试+返回首页/分类浏览出口）。
- src/router：/search 路由；Header/HomeView 搜索框跳 /search?keyword=。
- 卡片字段映射：productId→/product/:id、mainImage→图片、minPrice→价格（既有分→元格式化）。

## 4. Design References

- CHG-0020 requirement-design.md §4（前端契约/字段冻结）；STORY-005-01-02-03 story-design §1/§2。

## 5. Dependencies

权威表：无。实际前置 DU-BE-502（搜索接口）。

## 6. Implementation Sketch

```
SearchBox(enter) → router.push({path:'/search', query:{keyword}})
SearchView
 ├─ watch(route.query) → store.fetchProducts(buildQuery(route.query))
 │      ├─ loading=true（骨架）
 │      ├─ items=[] → 空态（分类浏览引导）
 │      └─ error → Error 态（重试按钮重发同一 query）
 ├─ 筛选/排序/分页控件 → router.replace(query 合并)   // URL 为唯一状态源
 └─ 价格 input（元）×100 → minPriceFen/maxPriceFen；min>max 即时提示不发请求
```

## 7. Pseudocode

```
onSearchInput(k): router.replace({query: {...q, keyword:k, page:1}})
buildQuery(q):
  return { keyword:q.keyword, categoryId:q.categoryId, brandId:q.brandId,
           minPriceFen: q.minYuan==null?undefined:Math.round(q.minYuan*100),
           maxPriceFen: q.maxYuan==null?undefined:Math.round(q.maxYuan*100),
           sort:q.sort||'default', page:Number(q.page)||1, size:20 }
fetchProducts(query):
  seq = ++seqCounter
  try { data = await searchApi.products(query); if(seq===seqCounter) commit(data) }
  catch(e){ if(seq===seqCounter) state.error = true }
```
