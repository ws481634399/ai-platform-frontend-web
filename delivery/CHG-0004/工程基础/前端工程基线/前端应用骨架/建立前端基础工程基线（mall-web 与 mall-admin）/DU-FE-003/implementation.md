# DU Implementation — DU-FE-003

> DU 级实施记录（Actual Implementation）。实施正文归属本仓库，Workspace 仅保留引用。

## 变更内容

从零实例化 mall-admin 后台管理前端完整工程（Commit ffeb7da，31 files，+3053 行）：

- 工程配置：package.json（engines + 6 项 scripts + EP 差异依赖）、pnpm-lock.yaml（版本权威）、vite.config.ts（@ alias + proxy /api→localhost:8080 + AutoImport/Components(ElementPlusResolver, dts) 插件）、index.html（%VITE_APP_TITLE% 插值）、eslint.config.js / tsconfig*2 / .prettierrc.json / .npmrc / .env.example（模板复制）、.env.development / .env.production（title=AI Mall 后台，本地验证用）
- src 十目录：main.ts（createApp + router + pinia，EP 不全局注册）、App.vue（仅 router-view）、api/http.ts（模板复制）、router/index.ts（/login、/ → AdminLayout → 重定向 /dashboard、/dashboard、/users、/products、/settings、catch-all NotFoundView，共 6 条 + 守卫扩展入口）、stores/index.ts + app.ts（appName + isCollapsed + toggleSidebar）、layouts/AdminLayout.vue（Sidebar el-menu 静态菜单 + Header el-dropdown + 折叠按钮 + Main router-view）、layouts/MenuItems.ts（4 项菜单 + icons）、views/LoginView.vue（el-card 占位，不调接口不实现 Token）、views/WorkbenchView.vue（env 标题 + EP 基础组件 + /__ping 验证聚合页）、Users/Products/Settings 三个占位页、views/NotFoundView.vue、types/index.ts（ApiResponse<T> + MenuItem）、composables/utils/assets/components 占位
- unplugin 生成类型声明：src/auto-imports.d.ts、src/components.d.ts 随提交入库（保证新克隆环境 type-check 可直接通过）
- 依赖锁定：element-plus / unplugin-auto-import / unplugin-vue-components / @element-plus/icons-vue；typescript 5.9.3（显式固定主版本）；其余与 mall-web 镜像对齐

## Commits

| Commit  | DU        | 消息                                                  | 文件数 |
| ------- | --------- | ----------------------------------------------------- | ------ |
| ffeb7da | DU-FE-003 | feat(mall-admin): 实例化 mall-admin 后台管理工程基线（Element Plus 按需导入） | 31     |

## 验证记录（AC）

- AC-04 install：依赖树完整（node_modules + pnpm-lock.yaml 已固定），lint/type-check/build 三条命令均成功运行，间接证明 install 成功；补跑留证受 sandbox 限制（D:\.pnpm-store 写入受限，EPERM），logs/mall-admin-install.log 为受阻原始输出（留作透明记录，非通过证据）
- AC-05 dev：`pnpm dev` 启动（Vite 8.2.2 ready），`/` 客户端重定向 /dashboard，AdminLayout 渲染（Sidebar 4 项菜单 + Header + Main），EP 组件可见无样式异常（按需导入生效）；曾遇 HMR 缓存假象（切换端口后旧 tab 资源加载报错），换干净 tab 复验通过
- AC-06 build：`pnpm build` 退出码 0，dist/ 23 个文件（index.html + 9 css + 13 js），AdminLayout/LoginView/WorkbenchView 独立 chunk（懒加载可观测）（evidence/logs/mall-admin-build.log，built in 1.71s）
- AC-07 Router：/login → LoginView（el-card 登录占位）；`/` → /dashboard（AdminLayout 默认子路由）；/users /products /settings → 各占位页；不存在路径 → NotFoundView（catch-all）
- AC-08 Pinia 折叠同步：浏览器点击折叠按钮，Sidebar（el-menu :collapse）与 Header 状态同步翻转，isCollapsed 由 stores/app.ts 单一来源驱动
- AC-09 HTTP：WorkbenchView 点击 /__ping 按钮 → 请求经 http.ts 统一拦截器 → 网关不在线走错误路径 → 页面展示统一错误文案（M0 后端无需在线，符合设计预期）
- AC-10 EP 组件：el-card（Login/Workbench）、el-menu（Sidebar 4 项）、el-input/el-button（Login 表单占位）均正常渲染（按需导入 + Components resolver）
- AC-11 env：WorkbenchView 标题显示「AI Mall 后台」（VITE_APP_TITLE），document.title 同值；.env.production 未硬编码网关地址（VITE_API_BASE_URL 留空部署注入）
- AC-12 质量：`pnpm lint` 0 error（35 warn 均为设计降级的样式规则，evidence/logs/mall-admin-lint.log）；`pnpm type-check`（vue-tsc × tsconfig.json/tsconfig.node.json 串联）退出码 0，含 unplugin 生成的 components.d.ts / auto-imports.d.ts（evidence/logs/mall-admin-type-check.log）
- AC-13 零业务：src 全文关键字扫描（JWT/Token/RBAC/dynamic-menu + 商品/订单/库存/角色/系统配置/AI）命中仅两类：CSS border（含 order 子串，误报）与 http.ts M1 扩展锚点注释（设计要求的占位），无业务类型/流程/状态

## Deviations

### DEV-1
- 原 DU 建议: `router.beforeEach` 空实现占位（守卫扩展入口）
- 实际实现: `router.beforeEach(() => true)`（无 next 回调签名）
- 原因: vue-router 5.3.0 已弃用守卫 `next()` 回调（运行时产生 [VUE_ROUTER_R0025] deprecation 警告），改为返回值式守卫，语义仍为默认放行的空守卫（与 DU-FE-002 一致）
- 影响评估: 守卫扩展入口语义保留；console 0 警告，不影响任何 AC

### DEV-2
- 原 DU 建议: 依赖「typescript」（未锁版本）
- 实际实现: `typescript@5` 显式固定主版本（5.9.3）
- 原因: TypeScript 7.0.2 与 typescript-eslint 8.69.0 的 peer 范围（<6.1.0）冲突，产生 WARN 级依赖冲突（与 DU-FE-002 一致）
- 影响评估: TS 5.9.3 满足全部插件 peer；lockfile 已固定，版本权威成立

### DEV-3
- 原 DU 建议: `type-check`（vue-tsc --noEmit）
- 实际实现: `vue-tsc --noEmit -p tsconfig.json && vue-tsc --noEmit -p tsconfig.node.json`（双 tsconfig 串联）
- 原因: 本 DU 采用 app/node 双 tsconfig，需分别检查 src 与 vite.config.ts（与 DU-FE-002 scripts 镜像一致）
- 影响评估: 命令名与语义不变，覆盖面更完整

### DEV-4
- 原 DU 建议: 未明确 unplugin 生成文件的入库策略
- 实际实现: src/auto-imports.d.ts / src/components.d.ts 随代码提交入库
- 原因: 两文件是 AutoImport/Components 插件声明的 dts 产物，入库可保证新克隆环境无需先跑 dev/build 即可通过 type-check 与 IDE 提示
- 影响评估: 文件内容确定性生成，无冲突风险；AC-12 明确要求 type-check 覆盖生成声明，入库使该验证可复现

## 自检

- [x] 实施前已读 repo task.md §7/§8/§9 与 design.md 对应设计
- [x] 实施限定在 DU Scope（mall-admin/）内，未越仓/越 DU 改动
- [x] 每个 AC 逐项验证（见上文验证记录），无伪称 PASS（AC-04 日志缺失已如实标注）
- [x] Commit 对应本 DU 整体任务并标注 DU: DU-FE-003
- [x] 代码遵循 standards/engineering/frontend（TS 优先、单一职责、scoped 样式、统一错误处理、路由 meta 预留）
- [x] EP 按需导入：main.ts 未全局注册 Element Plus，组件经 Components resolver 自动导入
- [x] 无未 catch 的异步错误（http 调用 try/catch + finally）
- [x] 无硬编码敏感信息/网关地址（业务代码零硬编码，仅 vite.config proxy 与 env 文件）
- [x] 与 DU-FE-002 镜像文件对齐（eslint.config.js / tsconfig*2 / .prettierrc.json / .npmrc / .env.example / http.ts diff 一致）
