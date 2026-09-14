# DU Task Design — DU-FE-801

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 购物车双模前端：useGuestCart（LocalStorage 游客车与上限）、会员车 store、详情页加购接线、登录后合并编排（成功清空/失败保留可重试）、购物车页全字段操作与合计、去结算占位；AOF 配置核查留证。

## 2. Repository

repo-2（ai-platform-frontend / mall-web）；AOF 证据在 workspace infra compose（无 repo-4 代码改动）。

## 3. Scope

- api/cart.ts：getCart/addItem/updateItem/removeItems/setSelected/selectAll、issueMergeToken/mergeCart、getSkuItems（公开）+ availability（DU-FE-704 已有 api 复用）。
- composables/useGuestCart.ts：LocalStorage key `mall-web:guest-cart`，条目 {skuId,quantity,selected,priceFenAtAdded,addedAt}；100 条目/999 件上限前端预拦截提示；改量/删除/勾选纯本地。
- stores/cart.ts：双模（guest/member）；会员操作调后端并刷 GET；登录成功（auth store 状态切换）自动编排：issueMergeToken → merge({token,items:guest}) → 成功清本地+pending 标记清除；网络失败保留游客车并置 mergePending（下次刷新/进车重试）；truncated/dropped 汇总 toast。
- 详情页加购接线（替换 DU-FE-704 占位）：游客写本地（含上限提示），会员调 addItem。
- views/cart/CartView.vue：全字段行（图/名/skuName/specs/价/步进器/三态 StockBadge/单选全选/删除）；游客车行展示用 skus/items+availability（缺失键标失效）；合计仅有效+选中+有货；去结算按钮 M3 置灰 + tooltip "结算功能即将开放"；StateView 空/错态。
- AOF 证据：摘录 docker-compose.infra.yml redis 命令行 --appendonly yes --appendfsync everysec 入 test evidence（代码零改动）。

## 4. Design References

- CHG-0018 requirement-design.md §3.1（双模与合并时序）、§4（契约）；STORY-003-03-02-01 story-design.md §1 repo-2 段、§6。三态组件复用 DU-FE-704 StockBadge，守卫用 DU-FE-601。

## 5. Dependencies

DU-BE-803（token/merge/items）；DU-BE-801/802（会员车写/读）；DU-FE-704（StockBadge/availability api）；DU-FE-601（登录态事件/守卫）。

## 6. Implementation Sketch

- 合并触发点：登录/刷新恢复后若本地有游客车且未完成合并；成功 200 即清空（含 truncated/dropped 情况也算消费完成）；401/400 token 问题：重新取 token 重试一次；网络错保留。
- 游客车步进同样受 999/100 约束，与后端错误码文案一致（CART_ITEMS_LIMIT/QUANTITY_LIMIT）。
- 金额整数分；合计用 GET 读模型的 selectedTotalFen（会员）/本地按 items+availability 计算（游客：有效+选中+有货）。
- vitest：useGuestCart 上限/持久化；合并成功清空、失败保留、重放后重取 token；购物车行渲染；三检。

## 7. Pseudocode

N/A（metadata `pseudocode: false`）。状态编排为直线异步流程；本地车为数组/ map 常规操作。
