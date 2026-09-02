# DU Task — DU-FE-002

> Repository Delivery 的 DU 级任务细化（Expected Implementation）。
> 权威来源：workspace tasks.md 中本 DU 小节；本文件为 repo 侧可执行副本。

## 1. Goal

从零实例化完整 mall-web Vue3 + TS + Vite 工程（复制 DU-FE-001 模板 + 差异增量），验证 AC-01/02/03/07/08/09/11/12/13。

## 2. Repository

repo-2：implementation/ai-platform-frontend（mall-web/ 子目录，完全独立工程，独立 lockfile）。

## 3. Scope

- 项目根：package.json（模板 scripts + 依赖 vue/vue-router/pinia/axios + vite/typescript/vue-tsc/eslint 套装/prettier）、pnpm-lock.yaml、vite.config.ts（@ alias + proxy /api→8080）、index.html（VITE_APP_TITLE 插值）、tsconfig*2/eslint.config.js/.prettierrc.json/.npmrc/.env.example（模板复制）、.env.development（VITE_API_BASE_URL=/api）、.env.production（VITE_API_BASE_URL 空值）
- src/：main.ts、App.vue（仅 router-view）、api/http.ts（模板复制）、router/index.ts（2 条路由 + beforeEach 占位）、stores/index.ts + stores/app.ts（计数器）、layouts/MallLayout.vue（Header/Main/Footer）、views/HomeView.vue（env 标题 + Pinia 计数 + /__ping 验证）、views/NotFoundView.vue、types/index.ts（ApiResponse<T> 预留）、composables/utils/assets/components 空目录占位

## 4. Design References

- design.md §2.4 HTTP / §2.5 Router（mall-web 分支）/ §2.6 Pinia / §2.7 MallLayout / §2.8 环境变量 / §2.9 质量基线

## 5. Dependencies

- DU-FE-001（镜像源文件模板先行交付，本 DU 复制复用）
- 与 DU-FE-003 并行（组 B），无先后依赖

## 6. Acceptance Criteria

- AC-01 `pnpm install` 成功且无 WARN 级依赖冲突
- AC-02 `pnpm dev` 启动，Home 页渲染无控制台 JS 错误
- AC-03 `pnpm build` 产出 dist/，无类型/构建错误
- AC-07 `/` 渲染 HomeView；`/no-such` 渲染 NotFoundView；懒加载 chunks 可观测
- AC-08 Pinia 计数器点击更新正确；刷新重置（非持久化）
- AC-09 `http.get('/__ping')` 双路径可观测：不可达 → 统一错误入口展示失败；可达 → 正常响应体（Evidence 记录实际路径）
- AC-11 development 的 VITE_APP_TITLE 在 HomeView 显示；.env.production 的 VITE_API_BASE_URL 为空串（部署注入）
- AC-12 `pnpm lint` 0 error；`pnpm type-check` 通过
- AC-13 静态扫描（Product/cart/order/login/register/permission/role/AI/RAG）命中数=0

## 7. Implementation Sketch

```text
mall-web/
├── package.json + pnpm-lock.yaml     engines + scripts 六项
├── vite.config.ts                    alias @ → /src + server.proxy /api → 8080
├── env files（dev/prod/example）
└── src
    ├── main.ts                       createApp + router + pinia
    ├── App.vue                       <router-view />
    ├── layouts/MallLayout.vue        Header/Main/Footer（无 UI 库）
    ├── router/index.ts               routes 2 条 + beforeEach 锚点
    ├── stores/app.ts                 AppStore(appName + counter + increment)
    ├── api/http.ts                   Axios 实例（自 templates/http.ts 复制）
    ├── views/HomeView.vue            验证聚合页
    ├── views/NotFoundView.vue        catch-all 页
    └── types/index.ts                ApiResponse<T> 占位
```

## 8. Pseudocode

N/A（初始化与装配型工程任务；组件间数据流为 props + pinia store + axios promise 标准形式；complexity-trigger 未命中）。

## 9. Verification

- Command：`pnpm install` 退出码 0；`pnpm lint` 0 error；`pnpm type-check` 退出码 0；`pnpm build` 退出码 0 + dist/ 非空（日志入 evidence/logs）
- Dev Server：`pnpm dev` 启动，curl `/` 200 + 正确标题；SPA fallback 下 `/no-such` 返回 index.html，客户端 catch-all 渲染 NotFoundView
- Runtime（浏览器验证页）：计数器点击 0→N；/__ping 按钮捕获并展示请求结果或错误
- Static Scan（AC-13）：全局关键字搜索命中数=0
- Error Case：pinia 未注册 → 控制台 getActivePinia 警告即失败；proxy 未配置 8080 → 配置缺失即阻塞
