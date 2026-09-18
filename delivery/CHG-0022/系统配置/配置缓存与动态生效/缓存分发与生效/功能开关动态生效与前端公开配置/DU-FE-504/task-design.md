# DU Task Design — DU-FE-504

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 公开开关：启动加载 features store（fail-open）、搜索入口按 search.enabled 显隐、游客购物车写入口禁用与 403 提示。

## 2. Repository

repo-2（ai-platform-frontend：mall-web）

## 3. Scope

- src/stores/features.ts：Map\<key,boolean\>、loadPublicFeatures()（App/main 启动调用）、hasFeature(key,default=true)（未知/加载失败 fail-open）。
- src/api/config.ts（mall-web）：GET /api/mall/public-features。
- Header/HomeView 搜索框与 /search 入口 v-if="hasFeature('search.enabled')"；SearchView 挂载时检查关闭态显示"功能暂未开放"空态（后端 403 兜底同文案）。
- 游客购物车：写按钮（加购/改量/删除/选中）在 hasFeature('mall.guest-cart.enabled') 为 false 时隐藏/禁用；请求拦截器对 B0606 统一提示"游客购物车暂未开放，请登录"。
- effectType 为 mall-admin 侧展示（DU-FE-503），本 DU 不含。

## 4. Design References

- CHG-0022 requirement-design.md §4（前端行为）；STORY-006-02-01-02 story-design §1/§2。

## 5. Dependencies

权威表：DU-BE-509。

## 6. Implementation Sketch

```
App.setup → features.loadPublicFeatures()
   success → map(key→enabled)
   fail    → 静默 WARN（map 空；hasFeature 走默认 true）
组件: v-if="features.hasFeature('search.enabled')"
SearchView: !hasFeature → 功能未开放空态（不发搜索请求）
请求拦截: response code===B0606 → toast(message)（游客车引导登录）
```

## 7. Pseudocode

N/A — store 单状态加载与布尔判定，无复杂流程；fail-open 与显隐在组件测试覆盖，未命中 complexity-trigger。
