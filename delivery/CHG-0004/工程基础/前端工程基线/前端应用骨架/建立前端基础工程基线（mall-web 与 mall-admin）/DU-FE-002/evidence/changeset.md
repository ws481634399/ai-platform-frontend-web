# Changeset — DU-FE-002

Commit：06e6e5f（24 files，+2522 行）。

| 仓库  | 模块            | 文件                                                          | 变更类型 | 行数变化 |
| ----- | --------------- | ------------------------------------------------------------- | -------- | -------- |
| repo-2 | mall-web 根     | package.json / pnpm-lock.yaml                                 | 新增     | +2295（含 lockfile） |
| repo-2 | mall-web 根     | vite.config.ts                                                | 新增     | +27      |
| repo-2 | mall-web 根     | index.html                                                    | 新增     | +12      |
| repo-2 | mall-web 根     | .env.development / .env.production                            | 新增     | +4（本地验证用；.env.* 按设计不入库） |
| repo-2 | mall-web 根     | eslint.config.js / tsconfig.json / tsconfig.node.json / .prettierrc.json / .npmrc / .env.example | 新增（模板复制） | +104 |
| repo-2 | mall-web/src    | main.ts / App.vue                                             | 新增     | +10      |
| repo-2 | mall-web/src/api| http.ts（模板复制）                                            | 新增     | +37      |
| repo-2 | mall-web/src/router | index.ts（2 条路由 + 守卫扩展入口）                        | 新增     | +30      |
| repo-2 | mall-web/src/stores | index.ts / app.ts（AppStore：appName + counter）           | 新增     | +28      |
| repo-2 | mall-web/src/layouts | MallLayout.vue（Header/Main/Footer）                      | 新增     | +47      |
| repo-2 | mall-web/src/views   | HomeView.vue（验证聚合页）/ NotFoundView.vue              | 新增     | +133     |
| repo-2 | mall-web/src/types   | index.ts（ApiResponse<T>）                                | 新增     | +11      |
| repo-2 | mall-web/src         | composables/utils/assets/components/.gitkeep               | 新增     | 0        |
