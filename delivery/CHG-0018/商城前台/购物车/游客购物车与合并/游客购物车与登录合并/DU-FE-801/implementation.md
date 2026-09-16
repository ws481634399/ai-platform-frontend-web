# DU Implementation — DU-FE-801

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。

## 变更内容

### 新增文件
| 文件 | 说明 |
|------|------|
| `src/api/cart.ts` | 购物车 API：会员车 CRUD（getCart/addItem/updateItem/removeItems/setSelected/selectAll）+ 合并（issueMergeToken/merge）+ 公开 SKU 条目批量查询（getSkuItems） |
| `src/composables/useGuestCart.ts` | 游客车 LocalStorage 持久化：key=`mall-web:guest-cart`，条目 `{skuId,quantity,selected,addedAt}`，999 件/100 条上限，90 天惰性清理 |
| `src/stores/cart.ts` | 双模购物车 store：游客走本地、会员走 API；登录态监听自动触发合并编排（issueToken→merge，token 失效重取一次，网络失败保留+pending 标记） |
| `src/views/cart/CartView.vue` | 购物车页：游客/会员双模列表（图/名/skuName/specs/价/步进器/StockBadge 三态/单选全选/删除）、合计仅有效+选中+有货、去结算置灰 tooltip、StateView 空/错态 |

### 修改文件
| 文件 | 改动 |
|------|------|
| `src/views/product/ProductDetailView.vue` | `addToCart()` 接线：游客写本地（含上限提示）、会员调 API；成功轻提示；mock 友好的 `hasResponseStatus` 类型守卫 |
| `src/layouts/MallLayout.vue` | 头部新增购物车链接 + 角标（badgeCount） |
| `src/router/index.ts` | 新增 `/cart` 路由 |
| `src/App.vue` | `onMounted` 调 `cart.init()`（已登录+游客车非空则合并） |
| `src/views/product/ProductDetailView.spec.ts` | mock `@/stores/cart`，addItem 返回 success |

### AOF 配置证据（repo-4 零改动）
`implementation/ai-platform-infrastructure/deploy/docker-compose.infra.yml` redis 服务：
```yaml
command:
  - redis-server
  - --appendonly
  - "yes"
  - --appendfsync
  - everysec
```
AOF 已就绪（CHG-0006 交付），本 DU 仅验证留证，无 repo-4 diff。

## Commits

未提交（待用户确认）。

## Deviations

无。实现严格遵循 task-design.md：useGuestCart LocalStorage 策略、合并编排（token 失效重取一次/网络失败保留）、CartView 全字段+三态+合计口径、去结算置灰。

## 自检

- [x] type-check 通过（vue-tsc --noEmit）
- [x] lint 通过（0 errors，1 预存 v-html warning）
- [x] build 通过（vite build）
- [x] test 通过（85/85，含 ProductDetailView 加购接线）
- [x] AOF 配置证据摘录（--appendonly yes / --appendfsync everysec）
