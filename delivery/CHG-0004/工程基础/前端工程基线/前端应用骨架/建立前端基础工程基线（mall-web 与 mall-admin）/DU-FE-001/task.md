# DU Task — DU-FE-001

> Repository Delivery 的 DU 级任务细化（Expected Implementation）。
> 权威来源：workspace tasks.md 中本 DU 小节；本文件为 repo 侧可执行副本。

## 1. Goal

建立仓库根（README/.gitignore）与规范底座（templates/ 镜像源文件单一事实源），使 DU-FE-002（mall-web）与 DU-FE-003（mall-admin）可直接复制实例化，避免两应用手动对齐漂移。

## 2. Repository

repo-2：implementation/ai-platform-frontend（空仓库，main 分支零提交，从零初始化）。

## 3. Scope

- 仓库根：README.md（双应用结构说明 + 各自快速开始 + 版本权威与源策略说明）、.gitignore（node_modules/ dist/ .env.* 保留 .env.example）
- templates/base-files/ 镜像源模板 7 份：eslint.config.js / tsconfig.json / tsconfig.node.json / .prettierrc.json / .npmrc / .env.example / package-scripts.json
- templates/http.ts：Axios 统一 Client 模板（拦截器扩展锚点完整）
- templates/src-skeleton/：src 十目录占位骨架（api/assets/components/composables/layouts/router/stores/types/utils/views）

## 4. Design References

- design.md §2.1 方案概要 / §2.2 工程结构与镜像文件清单 / §2.3 技术栈与版本策略 / §2.9 质量基线
- standards/engineering/frontend/coding-standard.md（目录按职责组织、类型安全优先）

## 5. Dependencies

无（首个 DU，建立底座；DU-FE-002/003 依赖本 DU 模板交付）。

## 6. Acceptance Criteria

- 仓库根存在 README.md（含双应用快速开始）与 .gitignore（不忽略 .env.example）
- templates/base-files 7 份镜像源文件齐全；templates/http.ts 存在；src-skeleton 十目录齐全
- eslint.config.js 为 flat config，引入 eslint-plugin-vue（vue3-recommended）与 typescript-eslint；核心规则不关闭
- package-scripts.json 含 engines node>=22 且 pnpm>=10；scripts 含 dev/build/preview/lint/type-check/format
- .npmrc 设定 registry 为 npmmirror
- 模板文件无任何业务代码残留

## 7. Implementation Sketch

```text
repo-2 root
├── README.md            总览 + mall-web/mall-admin 快速开始 + 版本权威说明
├── .gitignore           node_modules/ dist/ .env.*（保留 .env.example）
└── templates/
    ├── base-files/      7 份镜像源模板（单一事实源）
    ├── http.ts          Axios 实例 + baseURL VITE_API_BASE_URL + 拦截器锚点注释
    └── src-skeleton/    十目录骨架（.gitkeep 占位）
```

## 8. Pseudocode

N/A（纯工程结构与配置模板创建，无业务流程/算法/状态转换/编排逻辑；complexity-trigger 未命中）。

## 9. Verification

- 静态检查：根目录确认 README.md/.gitignore 存在；templates/base-files 列出 7 文件 + templates/http.ts + src-skeleton 十目录齐全
- ESLint 兼容性：随 DU-FE-002/003 首次 `pnpm lint` 冒烟验证（本 DU 为依赖前提）
- 对齐检查：DU-FE-002/003 实例化文件与 templates/base-files diff 应一致（允许声明内自然差异：package.json 依赖清单 / admin unplugin 插件）
- Error Case：templates 缺失任一文件则阻塞 DU-FE-002/003 开始
