# DU Implementation — DU-FE-001

> DU 级实施记录（Actual Implementation）。实施正文归属本仓库，Workspace 仅保留引用。

## 变更内容

建立 repo-2 仓库根与前端规范底座（单一事实源模板）：

- 仓库根：README.md（双应用结构说明 + 各自快速开始 + 版本权威/源策略说明）、.gitignore（node_modules/ dist/ .env.* 保留 .env.example；含 delivery 证据日志例外）
- templates/base-files/（7 份镜像源模板）：eslint.config.js（ESLint flat config + eslint-plugin-vue vue3-recommended + typescript-eslint，样式规则降 warn）、tsconfig.json（strict + paths @ + types vite/client）、tsconfig.node.json（vite.config.ts 专用）、.prettierrc.json、.npmrc（npmmirror）、.env.example、package-scripts.json（engines node>=22 pnpm>=10 + 6 项 scripts）
- templates/http.ts：Axios 统一 Client 模板（baseURL=VITE_API_BASE_URL、timeout 10s、Request/Response 拦截器 M1 扩展锚点注释）
- templates/src-skeleton/：src 十目录骨架（api/assets/components/composables/layouts/router/stores/types/utils/views，.gitkeep 占位）

## Commits

| Commit | DU | 消息 | 文件数 |
| ------ | -- | ---- | ------ |
| cc5b3a7 | DU-FE-001 | feat(scaffold): 初始化仓库根与前端规范底座模板 | 20 |

## Deviations

### DEV-1
- 原 DU 建议: 仓库根 .gitignore 忽略 node_modules/ dist/ .env.*（保留 .env.example）
- 实际实现: 同设计，另增 `*.log` 忽略及 `!delivery/**/evidence/logs/**` 证据日志例外
- 原因: 对齐 Workspace 交付约定（delivery/archive/**/evidence/logs/ 必须保留构建/启动日志），避免 DU 验证日志被忽略
- 影响评估: 不影响应用行为；保证后续 test/review 阶段证据日志可提交

### DEV-2
- 原 DU 建议: 镜像源文件模板 8 份（未含 @eslint/js 依赖说明）
- 实际实现: 模板内容不变；在 DU-FE-002/003 的 package.json 中显式声明 `@eslint/js` devDependency
- 原因: ESLint 10 不再随附 @eslint/js，eslint.config.js `import js from '@eslint/js'` 需要显式依赖（首次 lint 实测 ERR_MODULE_NOT_FOUND 后补装）
- 影响评估: 两应用一致声明，镜像对齐不受影响；lint 可正常执行

## 自检

- [x] 仓库根 README.md/.gitignore 存在，.gitignore 不忽略 .env.example（`!.env.example`）
- [x] templates/base-files 7 份齐全 + templates/http.ts + src-skeleton 十目录齐全（20 文件提交可见）
- [x] eslint.config.js 为 flat config，引入 eslint-plugin-vue（vue3-recommended）与 typescript-eslint；核心规则未关闭，样式规则降 warn
- [x] package-scripts.json 含 engines node>=22 / pnpm>=10；scripts 含 dev/build/preview/lint/type-check/format
- [x] .npmrc registry=https://registry.npmmirror.com
- [x] 模板文件无业务代码残留（仅拦截器扩展锚点注释）
- [x] ESLint 兼容性随 DU-FE-002/003 首次 lint 冒烟通过（0 error）
- [x] 对齐检查：DU-FE-002/003 实例化的 eslint.config.js / tsconfig*2 / .prettierrc.json / .npmrc / .env.example / http.ts 与模板 diff 一致（复制产生）
