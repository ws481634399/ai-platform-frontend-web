# DU Implementation — DU-FE-002

> DU 级实施记录（Actual Implementation）。实施正文归属本仓库，Workspace 仅保留引用。

## 变更内容

从零实例化 mall-web 商城前端完整工程（Commit 06e6e5f，24 files，+2522 行）：

- 工程配置：package.json（engines + 6 项 scripts）、pnpm-lock.yaml（版本权威）、vite.config.ts（@ alias + proxy /api→localhost:8080）、index.html（%VITE_APP_TITLE% 插值）、eslint.config.js / tsconfig*2 / .prettierrc.json / .npmrc / .env.example（模板复制）、.env.development（VITE_API_BASE_URL=/api）、.env.production（留空部署注入）
- src 十目录：main.ts（createApp + router + pinia）、App.vue（仅 router-view）、api/http.ts（模板复制）、router/index.ts（/ → MallLayout → HomeView 懒加载 + catch-all NotFoundView + 守卫扩展入口）、stores/index.ts + app.ts（appName + counter + increment）、layouts/MallLayout.vue（Header/Main/Footer 无 UI 库）、views/HomeView.vue（env 标题 + Pinia 计数器 + /__ping 双路径验证聚合页）、views/NotFoundView.vue、types/index.ts（ApiResponse<T> 对齐 UnifyResult）、composables/utils/assets/components 占位
- 依赖锁定：vue 3.5.42 / vue-router 5.3.0 / pinia 4.0.3 / axios 1.20.0；vite 8.2.2 / typescript 5.9.3 / vue-tsc 3.3.11 / eslint 10.9.1 + eslint-plugin-vue 10.10.0 + typescript-eslint 8.69.0 + @eslint/js 10.0.1 / prettier 3.9.6 / @types/node 26.4.1

## Commits

| Commit  | DU       | 消息                                            | 文件数 |
| ------- | -------- | ----------------------------------------------- | ------ |
| 06e6e5f | DU-FE-002 | feat(mall-web): 实例化 mall-web 商城前端工程基线 | 24     |

## 验证记录（AC）

- AC-01 install：`pnpm install` 退出码 0，日志无 WARN/unmet（evidence/logs/mall-web-install.log）；环境核验 node v22.22.1 / pnpm 10.32.1
- AC-02 dev：`pnpm dev` 启动（Vite 8.2.2 ready），浏览器访问 `/` 渲染「AI Mall 商城」+ 两验证卡片，console 0 error
- AC-03 build：`pnpm build` 退出码 0，dist/ 9 个文件（evidence/logs/mall-web-build.log）
- AC-07 Router：`/` 渲染 HomeView；`/no-such` 客户端 catch-all 渲染 NotFoundView（SPA fallback 返回 index.html 属预期）；构建产物含 HomeView/MallLayout/NotFoundView 独立 chunk（懒加载可观测）
- AC-08 Pinia：浏览器连续点击 +1 三次，计数器 0→3（非持久化）
- AC-09 HTTP：浏览器点击 /__ping 按钮 → 网络面板有 /api/__ping 请求记录 → 后端网关不在线 → 错误统一经 http.ts Response 拦截器 → 页面展示「请求失败（目标不可达，已进入统一错误处理入口）」。实际走**错误路径**（M0 后端无需在线，符合设计预期）
- AC-11 env：HomeView 标题显示「AI Mall 商城」（来自 VITE_APP_TITLE），document.title 同值；.env.production 的 VITE_API_BASE_URL 为空串
- AC-12 质量：`pnpm lint` 0 error（19 warn 均为设计降级的样式规则）；`pnpm type-check`（vue-tsc × tsconfig.json/tsconfig.node.json）退出码 0
- AC-13 零业务：src 全文关键字扫描（product/cart/order/login/register/permission/role/AI/RAG/jwt/token/rbac）命中仅两类：CSS `border`（含 order 子串，误报）与 http.ts 的 M1 扩展锚点注释（设计要求的占位），无业务类型/流程/状态

## Deviations

### DEV-1
- 原 DU 建议: `router.beforeEach` 空实现占位（守卫扩展入口）
- 实际实现: `router.beforeEach(() => true)`（无 next 回调签名）
- 原因: vue-router 5.3.0 已弃用守卫 `next()` 回调（运行时产生 [VUE_ROUTER_R0025] deprecation 警告），改为返回值式守卫，语义仍为默认放行的空守卫
- 影响评估: 守卫扩展入口语义保留；console 0 警告，不影响任何 AC

### DEV-2
- 原 DU 建议: 依赖「typescript」（未锁版本）
- 实际实现: `typescript@5` 显式固定主版本（5.9.3）
- 原因: 安装时最新 TypeScript 7.0.2 与 typescript-eslint 8.69.0 的 peer 范围（<6.1.0）冲突，产生 WARN 级依赖冲突，违反 AC-01「无 WARN 级依赖冲突」
- 影响评估: TS 5.9.3 满足全部插件 peer；lockfile 已固定，版本权威成立

### DEV-3
- 原 DU 建议: `type-check`（vue-tsc --noEmit）
- 实际实现: `vue-tsc --noEmit -p tsconfig.json && vue-tsc --noEmit -p tsconfig.node.json`（双 tsconfig 串联）
- 原因: 本 DU 采用 app/node 双 tsconfig（无 references 组合），需分别检查 src 与 vite.config.ts
- 影响评估: 命令名与语义不变（镜像 scripts 一致），覆盖面更完整

## 自检

- [x] 实施前已读 repo task.md §7/§8/§9 与 design.md 对应设计
- [x] 实施限定在 DU Scope（mall-web/）内，未越仓/越 DU 改动
- [x] 每个 AC 逐项验证（见上文验证记录），无伪称 PASS
- [x] Commit 对应本 DU 整体任务并标注 DU: DU-FE-002
- [x] 代码遵循 standards/engineering/frontend（TS 优先、单一职责、scoped 样式、统一错误处理）
- [x] 无未 catch 的异步错误（http 调用 try/catch + finally）
- [x] 无硬编码敏感信息/网关地址（业务代码零硬编码，仅 vite.config proxy 与 env 文件）
