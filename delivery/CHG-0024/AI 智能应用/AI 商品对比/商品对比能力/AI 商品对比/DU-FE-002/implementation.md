# DU Implementation — DU-FE-002

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

| Task | 文件 | 内容 |
| --- | --- | --- |
| T1 | mall-web/src/api/ai.ts | 新增 `AiCompareRequest/Response`、`AiCompareDimension`、`AiCompareProductItem` 类型与 `aiApi.compare()` 封装（POST /api/ai/compare，直出结构） |
| T2 | mall-web/src/views/ai/CompareView.vue（新增） | 商品搜索选择器（关键词搜索 → 勾选 2~6 件）、可选场景问题、维度对比表格（行=维度列=商品，缺失单元格"暂无该项数据"）、商品摘要（图/名/价）、AI 总结区、"价格以结算页为准"文案、Loading/403/Error+重试状态机 |
| T3 | mall-web/src/router/index.ts | 注册路由 `/ai/compare`（name=ai-compare） |
| T4 | mall-web/src/layouts/MallLayout.vue | 导航入口"商品对比"，`v-if="features.hasFeature('ai.compare.enabled', true)"`，data-testid=mall-compare-link |
| T5 | mall-web/src/views/ai/CompareView.spec.ts（新增） | 5 个用例：表格渲染+缺失占位、场景问题透传+总结、未选满禁用、403 空态、5xx 重试 |

> 共享接线文件（src/api/ai.ts、src/router/index.ts、src/layouts/MallLayout.vue）同时承载 DU-FE-002/003/004 的改动，
> 三个 DU 联合开发、合并为同一 feat commit，各 DU 在此分别登记。

## Commits

| 短 SHA | 类型 | 说明 |
| --- | --- | --- |
| f2fd7ca | feat | DU-FE-002/003/004 联合：mall-web 对比/客服/订单助手 + mall-admin 知识库（代码+测试+证据） |

## Deviations

无。

## 自检

- [x] 对比表格行=维度、列=商品，values 缺键统一"暂无该项数据"，无推测值
- [x] 价格逐格展示后端原值，页面含"价格以结算页为准"
- [x] 403 → "AI 对比暂未开启"空态；5xx → 错误态可重试且复用上次请求
- [x] 导航入口受 ai.compare.enabled 控制（显隐仅体验层，后端 fail-closed）
- [x] vitest 全绿（mall-web 129 passed，含本 DU 5 例）；vue-tsc 通过；eslint 0 error；vite build 成功（证据见 evidence/logs/）
