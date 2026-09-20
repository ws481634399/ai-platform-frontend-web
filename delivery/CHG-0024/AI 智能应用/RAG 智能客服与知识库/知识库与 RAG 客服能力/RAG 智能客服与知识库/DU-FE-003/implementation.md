# DU Implementation — DU-FE-003

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

| Task | 文件 | 内容 |
| --- | --- | --- |
| T1 | mall-admin/src/api/knowledge.ts（新增） | 五端点封装（upload multipart / list / setEnabled / remove / rebuild）；ai-service 成功响应直出不做 unwrap，错误信封由视图捕获 |
| T2 | mall-admin/src/views/knowledge/knowledge-validate.ts（新增） | 上传前初筛：扩展名 .md/.txt 白名单、≤5MB、空文件；纯函数 |
| T3 | mall-admin/src/views/knowledge/KnowledgeListView.vue（新增） | el-table 列表（标题/状态徽标 PENDING·PROCESSING·COMPLETED·FAILED/切片数/版本/启停 switch/时间/失败原因）；上传（el-upload 自定义 http-request）、启停、删除（el-popconfirm 二次确认）、重建索引；后台处理期间 3s 轮询 |
| T4 | mall-admin/src/router/component-registry.ts | 注册 `AiKnowledge`（component_key 对齐 V12 菜单种子 /ai/knowledge） |
| T5 | mall-admin/src/views/knowledge/knowledge-validate.spec.ts、KnowledgeListView.contract.spec.ts（新增） | 纯函数 4 例（含 5MB 边界）+ SFC 源码契约 5 例（五端点接线/四状态/V12 权限码/二次确认） |
| T6 | mall-web/src/api/ai.ts | 新增 `AiSupport*` 类型与 `aiApi.supportChat()`（POST /api/ai/support/chat） |
| T7 | mall-web/src/views/ai/SupportView.vue（新增） | 提问/回答气泡、引用列表（title+snippet 可展开）、兜底文案原样展示、订单类问题引导订单助手、新会话重置、Loading/403/Error+重试 |
| T8 | mall-web/src/router/index.ts、src/layouts/MallLayout.vue | 路由 `/ai/support`；导航入口"智能客服"，`v-if="features.hasFeature('ai.rag.enabled', true)"`，data-testid=mall-support-link |
| T9 | mall-web/src/views/ai/SupportView.spec.ts（新增） | 6 例：命中+引用、兜底无引用、5xx 重试、403 空态、新会话重置、loading 禁用 |

> 权限码以 V12 种子为准：`ai:knowledge:list/upload/update/delete/rebuild`
> （story-design 正文写的 knowledge:doc:* 为早期命名，实施前已逐文件核实 V12 实际下发值）。
> 共享接线文件同时承载 DU-FE-002/003/004，三个 DU 合并为同一 feat commit，各自登记。

## Commits

| 短 SHA | 类型 | 说明 |
| --- | --- | --- |
| PENDING-SHA | feat | DU-FE-002/003/004 联合：mall-web 对比/客服/订单助手 + mall-admin 知识库（代码+测试+证据） |

## Deviations

### DEV-1
- 原 DU 建议: 操作按钮 v-permission 对齐 knowledge:doc:* 权限码
- 实际实现: 使用 ai:knowledge:list/upload/update/delete/rebuild
- 原因: V12 迁移脚本实际下发的权限码为 ai:knowledge:*（实施前核实 repo-1），以运行中 SSOT 为准
- 影响评估: 与后端权限/菜单种子一致，无额外风险；不影响 AC-022/028

## 自检

- [x] 上传限定 .md/.txt 且 ≤5MB 前端初筛（后端魔数终验）
- [x] 四种状态徽标正确；FAILED 展示失败原因；处理中列表轮询
- [x] 删除二次确认；启停 switch 透传布尔；重建后列表刷新
- [x] 客服回答与引用逐条渲染；sources=[] 时原样展示兜底文案不编造
- [x] 新会话重置 conversationId；403 空态；5xx 可重试
- [x] mall-admin 114 passed（本 DU 9 例）、mall-web 129 passed（本 DU 6 例）；两工程 vue-tsc 通过、eslint 0 error、vite build 成功（evidence/logs/）
