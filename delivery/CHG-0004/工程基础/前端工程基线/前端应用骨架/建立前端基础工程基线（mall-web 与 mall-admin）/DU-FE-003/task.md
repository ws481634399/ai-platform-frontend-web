# DU Task — DU-FE-003

> Repository Delivery 的 DU 级任务细化（Expected Implementation）。
> 权威来源：workspace tasks.md 中本 DU 小节；本文件为 repo 侧可执行副本。

## 1. Goal

从零实例化完整 mall-admin Vue3 + TS + Vite 工程，引入 Element Plus 按需自动导入，构建 AdminLayout（4 占位菜单）与 /login 占位页，验证 AC-04/05/06/07/08/09/10/11/12/13。

## 2. Repository

repo-2：implementation/ai-platform-frontend（mall-admin/ 子目录，完全独立工程，独立 lockfile）。

## 3. Scope

- 项目根：package.json（模板 scripts + 差异依赖 element-plus/unplugin-auto-import/unplugin-vue-components/@element-plus/icons-vue）、pnpm-lock.yaml、vite.config.ts（@ alias + proxy /api→8080 + AutoImport/Components(ElementPlusResolver, dts) 插件）、index.html、tsconfig*2/eslint.config.js/.prettierrc.json/.npmrc/.env.example（模板复制）、.env.development/.env.production（title=AI Mall 后台）
- src/：main.ts（EP 不全局注册）、App.vue、api/http.ts（模板复制）、router/index.ts（/login、/→AdminLayout→重定向 /dashboard、/dashboard、/users、/products、/settings、catch-all；beforeEach 权限扩展入口）、stores/index.ts + stores/app.ts（isCollapsed + toggleSidebar）、layouts/AdminLayout.vue（Sidebar el-menu 静态菜单 + Header el-dropdown + Main router-view）、layouts/MenuItems.ts（4 项 + icons）、views/LoginView.vue（el-card 占位，不调接口不实现 Token）、views/WorkbenchView.vue（验证聚合页）、views/UsersPlaceholderView.vue / ProductsPlaceholderView.vue / SettingsPlaceholderView.vue（最小占位）、views/NotFoundView.vue、types/index.ts（ApiResponse<T> + MenuItem）、composables/utils/assets/components 空目录占位

## 4. Design References

- design.md §2.3 技术栈（Element Plus 按需导入）/ §2.5 Router（admin 分支）/ §2.6 Pinia / §2.7 AdminLayout / §2.8 环境变量 / §2.9 质量基线

## 5. Dependencies

- DU-FE-001（镜像源文件模板先行交付，本 DU 复制复用）
- 与 DU-FE-002 并行（组 B），无先后依赖

## 6. Acceptance Criteria

- AC-04 `pnpm install` 成功
- AC-05 `pnpm dev` 启动；`/` 重定向 `/dashboard`；AdminLayout 渲染，EP 组件可见无样式异常
- AC-06 `pnpm build` 产出 dist/
- AC-07 `/login` → LoginView；`/` → /dashboard；/users /products /settings → 占位页；不存在路径 → NotFoundView
- AC-08 折叠按钮切换 → isCollapsed 在 Header 与 Sidebar 同步
- AC-09 WorkbenchView 触发 /__ping → 成功或错误统一走拦截器
- AC-10 el-card/el-input/el-button/el-menu 正常渲染
- AC-11 VITE_APP_TITLE 在 WorkbenchView 显示；.env.production 未硬编码地址
- AC-12 `pnpm lint` 通过；`pnpm type-check` 通过（含 unplugin 生成的类型声明）
- AC-13 静态扫描（JWT/Token/RBAC/dynamic-menu + 商品/订单/库存/角色/系统配置/AI）命中数=0

## 7. Implementation Sketch

```text
mall-admin/
├── package.json / vite.config.ts    差异：EP + unplugin 系 + AutoImport/Components 插件
├── env files                        title = AI Mall 后台
└── src
    ├── main.ts                      createApp + router + pinia
    ├── layouts/AdminLayout.vue      Sidebar(el-menu×MenuItems) / Header(el-dropdown+折叠) / Main
    ├── layouts/MenuItems.ts         静态菜单数组（4 项 + icons）
    ├── router/index.ts              6 条路由 + beforeEach 权限扩展入口
    ├── stores/app.ts                name + isCollapsed + toggleSidebar()
    ├── api/http.ts                  自 templates/http.ts 复制
    └── views/                       LoginView / WorkbenchView / 3 占位页 / NotFoundView
```

## 8. Pseudocode

N/A（装配型工程任务；路由/菜单/布局为静态声明式配置，静态菜单数组是常量声明非编排逻辑；complexity-trigger 未命中）。

## 9. Verification

- Command：`pnpm install` 退出码 0；`pnpm lint` 0 error；`pnpm type-check` 0（含 components.d.ts）；`pnpm build` 0 + dist/ 非空（日志入 evidence/logs）
- Dev Server：`/login` 登录页 EP 组件渲染；`/` 客户端重定向 /dashboard；侧栏 4 项点击 → 对应占位页
- Runtime（浏览器验证页）：折叠按钮 → Sidebar/Header 状态同步；WorkbenchView EP 基础组件 + env title；/__ping 请求结果或错误展示
- Static Scan（AC-13）：扩展关键字命中数=0
- Error Case：按需导入未生成 components.d.ts → vue-tsc 失败即阻塞；AutoImport 类型冲突 → eslint 报错即失败
