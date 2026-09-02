# ai-platform-frontend

AI 商城平台前端仓库，包含两个**完全独立**的 Vue 3 + TypeScript + Vite 应用：

| 应用 | 目录 | 定位 | UI 库 |
| ---- | ---- | ---- | ---- |
| mall-web | `mall-web/` | 商城用户端 | 无（M1 商城视觉设计引入） |
| mall-admin | `mall-admin/` | 后台管理端 | Element Plus（按需自动导入） |

## 工程约定

- **两应用完全独立**：各自持有 package.json / pnpm-lock.yaml / 配置与依赖，不使用 pnpm workspace，不抽公共包——统一性靠规范与 `templates/` 镜像源文件清单保证
- **版本权威**：各应用的 `pnpm-lock.yaml` 即版本唯一权威（对齐后端 mall-bom 唯一权威原则），升级依赖必须产生 lockfile 变更
- **Node / pnpm**：engines 约束 `node >= 22`、`pnpm >= 10`
- **npm 源**：各应用 `.npmrc` 统一 `registry=https://registry.npmmirror.com`（网络环境适配）
- **统一 HTTP 出口**：业务代码禁止直接 `import axios`，一律经 `src/api/http.ts` 实例
- **环境变量**：业务代码零硬编码地址，全部经 `import.meta.env`（`VITE_API_BASE_URL` / `VITE_APP_TITLE`）；dev 经 Vite proxy `/api → http://localhost:8080`（mall-gateway）

## mall-web 快速开始

```bash
cd mall-web
pnpm install
pnpm dev        # 开发服务器（Vite）
pnpm lint       # ESLint 检查
pnpm type-check # vue-tsc 类型检查
pnpm build      # 生产构建 → dist/
pnpm preview    # 预览构建产物
pnpm format     # Prettier 格式化
```

## mall-admin 快速开始

```bash
cd mall-admin
pnpm install
pnpm dev        # 开发服务器（Vite）
pnpm lint       # ESLint 检查
pnpm type-check # vue-tsc 类型检查（含 unplugin 生成类型声明）
pnpm build      # 生产构建 → dist/
pnpm preview    # 预览构建产物
pnpm format     # Prettier 格式化
```

## templates/ 镜像源文件

`templates/` 是两应用共享配置的**单一事实源**（base-files 7 份 + http.ts + src 十目录骨架）。修改 eslint / tsconfig / prettier / http.ts 等镜像文件时，必须同步修改模板与两个应用实例，review 阶段按镜像文件清单对照检查。

允许的自然差异：package.json 依赖清单（mall-admin 多 element-plus 与 unplugin 系）、vite.config.ts（admin 多按需导入插件）、views/layouts 内容。
