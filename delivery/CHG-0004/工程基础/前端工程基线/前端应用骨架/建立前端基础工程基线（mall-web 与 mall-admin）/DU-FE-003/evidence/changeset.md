# Changeset — DU-FE-003

Commit：ffeb7da（31 files，+3053 行）。

| 仓库   | 模块                | 文件                                                                 | 变更类型           | 行数变化 |
| ------ | ------------------- | -------------------------------------------------------------------- | ------------------ | -------- |
| repo-2 | mall-admin 根       | package.json / pnpm-lock.yaml                                        | 新增               | +2460（含 lockfile） |
| repo-2 | mall-admin 根       | vite.config.ts（@ alias + proxy + AutoImport/Components 插件）        | 新增               | +37      |
| repo-2 | mall-admin 根       | index.html                                                           | 新增               | +12      |
| repo-2 | mall-admin 根       | .env.development / .env.production（title=AI Mall 后台）             | 本地新增           | 不入库（.env.* 按设计忽略） |
| repo-2 | mall-admin 根       | eslint.config.js / tsconfig.json / tsconfig.node.json / .prettierrc.json / .npmrc / .env.example | 新增（模板复制） | +92 |
| repo-2 | mall-admin/src      | main.ts / App.vue                                                    | 新增               | +11      |
| repo-2 | mall-admin/src/api  | http.ts（模板复制）                                                  | 新增               | +35      |
| repo-2 | mall-admin/src/router | index.ts（6 条路由 + 守卫扩展入口）                               | 新增               | +55      |
| repo-2 | mall-admin/src/stores | index.ts / app.ts（appName + isCollapsed + toggleSidebar）        | 新增               | +19      |
| repo-2 | mall-admin/src/layouts | AdminLayout.vue（Sidebar/Header/Main）/ MenuItems.ts（4 项）     | 新增               | +93      |
| repo-2 | mall-admin/src/views | LoginView.vue / WorkbenchView.vue / Users+Products+Settings 占位页 / NotFoundView.vue | 新增 | +175 |
| repo-2 | mall-admin/src/types | index.ts（ApiResponse<T> + MenuItem）                               | 新增               | +20      |
| repo-2 | mall-admin/src      | auto-imports.d.ts / components.d.ts（unplugin 生成，入库）           | 新增               | +44      |
| repo-2 | mall-admin/src      | composables/utils/assets/components/.gitkeep                         | 新增               | 0        |
