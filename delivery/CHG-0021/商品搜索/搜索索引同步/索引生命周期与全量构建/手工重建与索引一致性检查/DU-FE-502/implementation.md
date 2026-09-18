# DU Implementation — DU-FE-502

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

### mall-admin（`ai-platform-frontend/mall-admin`）

- API 层：`src/api/search/index.ts`（按域目录范式，非 task-design 字面的 `src/api/searchIndex.ts`）
  - 导出 `searchIndexApi`：`rebuild()`、`recentTasks(limit)`、`getTask(taskId)`、`consistencyCheck()`、`syncFailures(params)`、`retrySyncFailure(id)`；
  - 类型：`RebuildTaskView`、`RebuildStatus`、`ConsistencyCheckView`、`SyncFailureView`、`SyncFailureStatus`、`ItemPage<T>`；
  - 请求层复用仓内 axios 实例（401/403 统一处理）；409 B0503 经页面 `extractMessage` 提示。
- 页面：`src/views/search/SearchIndexView.vue`（三张 `el-card`）
  1. **索引重建**：重建按钮（`v-permission="'search:index:rebuild'"`）、进度条（total/indexed）、物理索引/错误信息描述列表、最近任务表（状态 tag）；
  2. **一致性检查**：执行检查按钮 + `el-descriptions` 展示 productOnSaleCount/indexCount/checkedAt，missing/extra 以 id chip 列表渲染，`missingTruncated/extraTruncated` 显示超 200 截断提示；
  3. **同步失败记录**：状态筛选（PENDING/SUCCESS/FAILED_DEAD）、分页表格（productId/eventType/retryCount/lastError/nextRetryAt）、人工重试按钮。
- 交互：`setInterval` **2s** 轮询 RUNNING 任务（页面卸载 clearInterval）；`onMounted` 发现最近任务为 RUNNING 时自动接续轮询；rebuild 409 时提示后端文案并刷新最近任务（接续展示执行中任务）；按钮/查询权限用 `v-permission` 指令（`search:index:rebuild`/`search:index:list`）。
- 动态路由/菜单：后端 V9 菜单种子 `component_key=SearchIndex` 驱动（见 DU-BE-504）；前端 `src/router/component-registry.ts` 注册 `SearchIndex → SearchIndexView` 键，该注册随提交 **404eb77**（CHG-0022 FE-503）合入，当前主干 HEAD 已包含；a196082 本身仅含本 DU 两文件。

### 本地门禁实测（2026-09-18，node v22.22.1 / pnpm 10.32.1）

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `pnpm type-check`（vue-tsc 双 tsconfig） | ✅ 通过，无错误 |
| Lint | `pnpm lint`（eslint） | ✅ 0 error；221 warning（全仓存量格式项，非本页阻断） |
| 单测 | `pnpm test`（vitest run） | ✅ 16 文件 / 47 用例全通过；**无 SearchIndexView 专属 spec** |
| 构建 | `pnpm build`（vite） | ✅ 构建成功（产物含 SearchIndex 页面 chunk） |

## Commits

| Commit | 仓库 | 说明 |
| --- | --- | --- |
| a196082 | repo-2 ai-platform-frontend | `feat(search): 管理端搜索索引运维页（CHG-0021 FE-502）`——仅 2 文件：`src/api/search/index.ts`（117 行）、`src/views/search/SearchIndexView.vue`（707 行），共 824 行新增 |
| 5a5056f | repo-2 ai-platform-frontend | `fix(search): 索引页状态枚举对齐后端`——修复 DEV-4：SUCCESS / FAILED_DEAD（2 文件，+21/-25） |
| 404eb77 | repo-2 ai-platform-frontend | `SearchIndex` 动态组件注册（`component-registry.ts`）随 CHG-0022 FE-503 合入（跨 Change 依赖，主干已含，非本 DU 提交） |

## Deviations

<!-- 实现与 DU 建议（Sketch / Pseudocode）明显偏离时必须记录；无偏离写「无」。
     每条偏离三要素缺一不可：原 DU 建议 / 实际实现 / 原因（建议附影响评估）。
     格式：### DEV-N
           - 原 DU 建议:
           - 实际实现:
           - 原因:
           - 影响评估: -->

### DEV-1

- 原 DU 建议: API 模块路径 `src/api/searchIndex.ts`。
- 实际实现: `src/api/search/index.ts`。
- 原因: 遵循仓内按域目录组织范式（已有 `src/api/product/`、`src/api/order/` 等）。
- 影响评估: 无；import 路径相应调整。

### DEV-2

- 原 DU 建议: 重建按钮点击后 `ElMessageBox` 二次确认，确认后才发起。
- 实际实现: 点击直接发起；防误触依赖后端 RUNNING 互斥（B0503/409）+ 按钮 loading + 错误提示，页面未做二次确认弹窗。
- 原因: 重建为幂等可重入的运维操作（旧索引在切换成功后才删除，失败保留），二次确认优先级在实现时让位于交付；后端互斥闸门保证不会并发重建。
- 影响评估: 少一次防误触确认；误点最坏结果是跑一次无害的全量重建（秒级、占用一次请求，见 DU-BE-504 DEV-2）。建议后续补 confirm。

### DEV-3

- 原 DU 建议: 轮询间隔 3s。
- 实际实现: `setInterval` 2s。
- 原因: M5 重建为秒级同步任务，2s 轮询使进度/终态反馈更快，且有终态即停与卸载清理，请求量可控。
- 影响评估: RUNNING 期间请求频率略高（每任务最多数个请求）。

### DEV-4（Review 四查发现，已修复 5a5056f）

- 原 DU 建议/后端契约: 状态枚举对齐后端——重建 `RebuildStatus = PENDING/RUNNING/SUCCESS/FAILED`，失败记录 `SyncFailureStatus = PENDING/SUCCESS/FAILED_DEAD`（story 设计行文曾使用 SUCCEEDED 字样，但以后端实际枚举为准）。
- 实际实现（初版）: `src/api/search/index.ts` 声明 `'RUNNING'|'SUCCEEDED'|'FAILED'` 与 `'PENDING'|'RETRYING'|'SUCCEEDED'|'DEAD'`，与后端字面量不一致。
- 原因: 前端按 story-design 行文措辞命名，未与落地枚举核对；type-check 只校验前端内部字面量无法发现跨端不一致。
- 修复（commit 5a5056f）: api 类型改为 `PENDING/RUNNING/SUCCESS/FAILED` 与 `PENDING/SUCCESS/FAILED_DEAD`；SearchIndexView 进度条/轮询成功判断/标签/筛选项/人工重试可用性（canManualRetry=PENDING||FAILED_DEAD）全部同步；补 PENDING 重建态展示。修复后 type-check/lint/vitest 47/47/build 四门禁重新全绿。

### DEV-5（测试偏离）

- 原 DU 建议: task-spec Verification 要求 SearchIndexView 的 vitest（api mock、`vi.useFakeTimers` 轮询、409 分支、差集渲染/truncated）。
- 实际实现: 未编写本页专属 spec；现有 47 个用例覆盖框架/其他页面。
- 原因: 实现期未补页面测试；以 type-check/lint/build 四门禁 + 浏览器实测（Integration Gate）替代。
- 影响评估: 轮询/409/差集渲染/枚举分支无回归保护；结合 DEV-4，正是缺乏组件测试使跨端枚举不一致未在本地暴露。

## 自检

### 任务清单

| 任务 | 证据 | 结果 |
| --- | --- | --- |
| 任务 1 api 模块与路由/菜单注册 | `src/api/search/index.ts`（六方法/类型）；动态菜单由 V9 `component_key=SearchIndex` + `component-registry.ts`（404eb77）驱动；权限码 list/rebuild | ✅（见 DEV-1；注册跨提交见 Commit 表） |
| 任务 2 状态卡与最近任务表 | `SearchIndexView.vue` 第一/二张卡：进度条、任务表、状态 tag、物理索引/错误字段 | ✅（展示受 DEV-4 枚举不一致影响） |
| 任务 3 重建按钮 confirm + RUNNING 禁用/轮询 + 409 提示 | 2s 轮询、onMounted 接续 RUNNING、409 catch `extractMessage` 后刷新任务；**未做 confirm 弹窗**（DEV-2） | ⚠️ 轮询/409 已实现；confirm 缺失；终态展示受 DEV-4 影响 |
| 任务 4 一致性检查面板（计数/差集/truncated） | descriptions 双计数 + missing/extra chip + missingTruncated/extraTruncated 提示 | ✅ |
| 任务 5 type-check/lint/vitest/build 门禁 | 四门禁本地实测：type-check ✅、lint 0 error（221 存量 warning）、vitest 47/47（本页无 spec）、build ✅ | ✅ 门禁通过；页面专属单测缺失见 DEV-5 |

### Acceptance Criteria

| AC | 证据 | 结果 |
| --- | --- | --- |
| AC-006 页面可查看任务状态、发起重建（确认）、执行并展示一致性检查；type-check/lint/build 通过 | 页面三卡交付并对接 `/api/admin/search/index/**` 五端点；四门禁实测通过（type-check ✅ / lint 0 error / vitest 47 passed / build ✅）；但：① 重建无二次确认（DEV-2）；② 与后端状态枚举字面量不匹配，重建成功终态与死信记录展示/筛选/人工重试入口存在实际缺陷（DEV-4） | ⚠️ 门禁与页面骨架 passed；交互细节存在 2 项遗留（confirm 缺失、枚举不一致），浏览器实测与修复留 Integration Gate，不声明完全达成 |

### Verification 对照

- Unit（vitest api mock/假定时器轮询/409/差集渲染）：**未编写**（DEV-5）——⚠️。
- Integration（浏览器真实重建/检查）：本地未启后端联调；由于 DEV-4 枚举缺陷，预期真实联调时重建成功终态展示异常——⚠️ 必须在 Integration Gate 修复后复测。
- API（对接 DU-BE-504 端点契约）：路径/方法/分页参数已按后端实际契约（`/rebuild`、`/rebuild?limit`、`/consistency-check`、`/sync-failures`、`/sync-failures/{id}/retry`）对接；状态枚举契约不一致（DEV-4）——⚠️。
- Migration: N/A——N/A。
- Error Case（409 冲突提示、接口失败消息）：409 有 `extractMessage` 分支并接续轮询；通用请求错误有消息展示——代码具备，无组件测试——⚠️。
