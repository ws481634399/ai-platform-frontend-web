# DU Implementation — DU-FE-503

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

mall-admin 管理端「系统配置」三页面与 API 层：

- **API 层**：[config.ts](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-admin/src/api/config.ts) 新增 featureConfigApi（list/get/create/update/remove，remove 带 `?reason=` 并经 encodeURIComponent 透传）、systemParameterApi（list/create/update/remove）、configHistoryApi（list，参数 configType/key）；统一分页类型 `ItemPage<T>={total,page,size,items}`；导出 ParameterType/ParameterEffectType/ConfigType/ConfigChangeKind 类型；错误处理 extractApiErrorMessage/getApiErrorCode + friendlyConfigErrorMessage（B0604 乐观锁冲突追加「请刷新后重试」、已含刷新文案不重复追加、403 无权限兜底文案、axios 错误回退）。
- **功能开关页** [FeatureConfigsView.vue](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-admin/src/views/config/FeatureConfigsView.vue)：分组 + enabled 状态过滤、分页；新建/编辑共用弹窗（编辑态 key 输入 disabled）；行内 switch 启停弹 ElMessageBox.prompt 必填变更原因；删除必填原因；内置行删除按钮 disabled + tooltip「内置配置不可删除」；更新携带 version 乐观锁；操作按钮 v-permission="system:feature:update" 控制。
- **系统参数页** [SystemParametersView.vue](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-admin/src/views/config/SystemParametersView.vue)：类型 el-tag、数值展示 minValue~maxValue 列、effectType 动态/重启生效 tag；按参数类型切换表单（JSON 走 textarea 并 JSON.parse 校验、validateByType 前端数值/布尔/JSON 校验、数值范围 min/max 校验）；更新携带 version。
- **变更历史页** [ConfigHistoryView.vue](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-admin/src/views/config/ConfigHistoryView.vue)：configType + key 筛选；changeKind（CREATED/UPDATED/DELETED）tag、旧值/新值列、changedBy/changedAt 展示；只读。
- **菜单接线**：[component-registry.ts](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-admin/src/router/component-registry.ts) 注册 FeatureConfigs/SystemParameters/ConfigHistory 三个组件 key，页面由 identity V10 下发的动态菜单驱动，无静态路由文件改动。
- **测试**：[config.spec.ts](file:///d:/Desktop/ai-platform/implementation/ai-platform-frontend/mall-admin/src/api/config.spec.ts) 共 12 个用例——featureConfigApi 4 例（空筛选分页、筛选参数透传、create/update/delete 带 reason、encodeURIComponent 中文原因）、systemParameterApi 2 例、configHistoryApi 1 例、错误归一化 5 例（B0602 文案、B0604 追加刷新提示、已含刷新文案不重复、axios 错误回退、403 兜底）。

## Commits

| Commit | 仓库 | 说明 |
| --- | --- | --- |
| 404eb77 | repo-2 | DU-FE-503：mall-admin 系统配置三页面（功能开关/系统参数/变更历史）、config API 与错误归一化、组件注册表接线、config.spec.ts 12 例 |

## Deviations

<!-- 实现与 DU 建议（Sketch / Pseudocode）明显偏离时必须记录；无偏离写「无」。
     每条偏离三要素缺一不可：原 DU 建议 / 实际实现 / 原因（建议附影响评估）。
     格式：### DEV-N
           - 原 DU 建议:
           - 实际实现:
           - 原因:
           - 影响评估: -->

### DEV-1
- 原 DU 建议: task-design 建议新增 `src/stores/system.ts` Pinia store 集中管理配置列表与编辑态。
- 实际实现: 未建独立 store，三个页面直接 import `src/api/config.ts` 在组件内管理列表/弹窗状态。
- 原因: 三页均为独立的后台 CRUD 场景，无跨页面共享状态（历史页只读、开关页与参数页无联动），store 层只会透传无额外逻辑。
- 影响评估: 无功能缺失；后续若仪表盘等位置需复用配置状态，可再抽 store，api 签名已稳定。

### DEV-2
- 原 DU 建议: task-design 描述在路由表中新增三条静态路由（/system/features 等）。
- 实际实现: 仅在 component-registry.ts 注册三个组件 key，路由/菜单完全由后端动态菜单（identity V10 下发的 PAGE 记录：/system/features、/system/parameters、/system/config-history）驱动。
- 原因: mall-admin 既有架构即「动态菜单 + 组件注册表」，静态写路由会绕过权限菜单体系造成双份维护。
- 影响评估: 与后端 V10 菜单/权限严格配套；无菜单记录或无授权时页面不可达，符合权限模型。

### DEV-3
- 原 DU 建议: test-design 规划对三页面做 vitest 组件级测试（表单校验矩阵、409 冲突提示、历史筛选渲染）。
- 实际实现: 仅 api 层 config.spec.ts 12 例（含 B0604 冲突文案逻辑），未编写 Vue 组件挂载测试。
- 原因: 工程前端单测基线集中在 api/store 纯逻辑层，页面组件尚无挂载测试基建；表单校验与冲突提示均为 Element Plus 组件 + api 层函数组合。
- 影响评估: 请求构造、参数编码、错误归一化有自动化覆盖；组件交互（弹窗必填原因、内置 disabled、JSON 校验 UX）依赖 Integration Gate 场景六/七浏览器验收。

## 自检

对照 task-spec.md「Verification」逐条：

- **Unit（vitest 表单校验矩阵、409 冲突刷新、历史筛选渲染）**：⚠️ 部分覆盖——api 层 12 例（请求参数/分页/reason 编码/三类资源/错误归一化含 B0604 刷新提示）全绿口径；组件级表单与渲染用例未建，见 DEV-3。
- **Integration（浏览器联调放 Integration Gate 场景六/七）**：✅ 已按设计将动态菜单可见性、启停填原因、乐观锁冲突刷新、内置禁删、JSON/范围校验列入人工/浏览器验收范围，本次代码回填不代替 Gate 执行。
- **API（对接 DU-BE-507 三类端点契约）**：✅ 路径、查询参数（group/enabled/type/configType/key）、分页解包 {total,page,size,items}、删除 reason、history 参数名 `key`（与后端实际契约一致，见 DU-BE-507 DEV-5）均按后端实现对齐。
- **Migration**：N/A ✅ 前端无数据库迁移；菜单/权限由后端 V10 迁移提供。
- **Error Case（400 字段级错误、409 冲突、403 无权限）**：✅ 409/B0604 刷新提示与 403 兜底有 12 例中的断言；400 字段级错误依赖 Element Plus 表单 + api message 透传，组件交互在联调 Gate 验收。
- **测试计数（源码清点）**：config.spec.ts 12 个 it。当前工作区前端 node_modules 未安装，无法本地执行 vitest，计数为源码逐用例清点结果，非实跑结果。
