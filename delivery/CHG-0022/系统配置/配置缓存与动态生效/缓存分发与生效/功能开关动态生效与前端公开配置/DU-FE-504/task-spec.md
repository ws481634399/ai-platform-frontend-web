# DU Task Spec — DU-FE-504

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"（DU 契约与验收）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-504
- Change ID: CHG-0022
- Feature Path: 系统配置/配置缓存与动态生效/缓存分发与生效/功能开关动态生效与前端公开配置
- 权威来源: story-design.md §5 / DU-FE-504

## 任务清单

- [ ] 任务 1 — features store 与 public-features api（启动加载/fail-open）（verifies: TC-006）
- [ ] 任务 2 — 搜索入口 v-if 显隐与 /search 关闭态空态（verifies: TC-003）
- [ ] 任务 3 — 游客购物车写入口禁用 + B0606 拦截提示（verifies: TC-004）
- [ ] 任务 4 — effectType/加载异常展示配合（接口失败不白屏）（verifies: TC-005, TC-006）
- [ ] 任务 5 — vitest + type-check/lint/build 门禁（verifies: TC-007）

## Acceptance Criteria

- [ ] AC-003 — search.enabled=false 入口隐藏、/search 显示未开放；重开恢复。
- [ ] AC-007 — 前后端测试全绿（本 DU 负责前端：入口显隐组件测试与构建门禁）。
- 游客车禁用交互随 AC-004 后端联调在 Integration Gate 场景六验证，本 DU 保证前端禁用与提示。

## 执行顺序（Execution Order）

1. 任务 1 → 2/3 → 4 → 5。

## 并行度（Parallelization）

任务 2 与 3 可并行。

## Verification

- Unit: vitest（msw 两态/加载失败 fail-open/入口显隐/拦截器 B0606 提示）。
- Integration: 浏览器开关动态生效放 Integration Gate 场景六。
- API: 对接 /api/mall/public-features 契约。
- Migration: N/A。
- Error Case: public-features 503/超时不白屏、默认可见。
