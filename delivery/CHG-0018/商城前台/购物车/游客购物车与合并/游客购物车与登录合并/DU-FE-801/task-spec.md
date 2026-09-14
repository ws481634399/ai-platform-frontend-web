# DU Task Spec — DU-FE-801

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-801
- Change ID: CHG-0018
- Feature Path: 商城前台/购物车/游客购物车与合并/游客购物车与登录合并
- 权威来源: story-design.md §5 / DU-FE-801

## 任务清单

- [ ] 任务 1 — cart api 全套（含 merge-token/merge/items）（verifies: TC-001, TC-008）
- [ ] 任务 2 — useGuestCart 本地车：加购/改量/删除/勾选 + 100/999 上限提示（verifies: TC-001）
- [ ] 任务 3 — 双模 cart store：会员操作与刷车；游客 skus/items+availability 行展示与缺失失效（verifies: TC-009）
- [ ] 任务 4 — 登录合并编排：成功清空且不再重复触发；truncated/dropped 提示（verifies: TC-002, TC-003, TC-004, TC-006）
- [ ] 任务 5 — 合并网络失败保留游客车、可重试不丢失；token 失效重取一次（verifies: TC-007, TC-005）
- [ ] 任务 6 — CartView 全字段/操作/合计；去结算置灰 tooltip（verifies: TC-008）
- [ ] 任务 7 — AOF 配置证据摘录 + build/lint/type-check 三检（verifies: TC-012）

## Acceptance Criteria

- [ ] AC-015 — 游客详情加购进本地车，操作可用且有上限提示。
- [ ] AC-016 — 登录合并同 SKU 相加/异 SKU 并入（联调）。
- [ ] AC-017 — truncated/dropped 有明确提示且本地清空（联调）。
- [ ] AC-018 — 重放/过期场景前端能重取 token 完成或明确失败（联调）。
- [ ] AC-019 — 合并成功清 LocalStorage、刷新不重复合并；失败保留可重试。
- [ ] AC-020 — 购物车双模全字段/三态/合计可用；游客车行展示正确；去结算置灰。
- [ ] AC-022 — infra redis AOF everysec 证据留档（repo 零 diff）；前端三检通过。

## 执行顺序（Execution Order）

1. 任务 1/2 → 3 → 4/5 → 6 → 7；联调待 DU-BE-803/801/802。

## 并行度（Parallelization）

任务 2（useGuestCart）与任务 3（会员 store）并行；任务 6 页面在两 store 就绪后。

## Verification

- Unit: vitest useGuestCart 上限/持久化；合并四结果（成功/截断/失效/网络失败）；行渲染与合计口径。
- Integration: N/A（E2E 在 test 阶段五场景"游客车合并"）。
- API: 与 DU-BE-803/801/802 联调。
- Migration: N/A。
- Error Case: 合并失败无丢失；游客车含失效条目行内标识不阻塞其余操作。
