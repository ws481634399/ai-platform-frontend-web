# DU Task Spec — DU-FE-601

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"做什么/验收"。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 0. 元信息

- DU id: DU-FE-601
- Change ID: CHG-0016
- Feature Path: 商城前台/商城会员/会员注册与认证/商城会员登录与会话
- 权威来源: story-design.md §5 / DU-FE-601

## 任务清单

- [ ] 任务 1 — auth api + http 拦截器 + auth store 持久化与 restore（verifies: TC-009）
- [ ] 任务 2 — 单飞 refresh-coordinator：并发 401 一次刷新并重放全部请求（verifies: TC-009）
- [ ] 任务 3 — 路由守卫 + redirect 回跳；refresh 失败清态跳登录，登录后回跳（verifies: TC-010）
- [ ] 任务 4 — LoginView/RegisterView（表单规则、错误透传、注册成功跳登录）+ 退出入口（verifies: TC-009, TC-010）
- [ ] 任务 5 — vue-tsc/eslint/pnpm build 三检 + vitest（verifies: TC-009, TC-010）

## Acceptance Criteria

- [ ] AC-014 — 刷新页面恢复登录态；并发 401 仅一次 refresh 且全部重放成功。
- [ ] AC-015 — refresh 失败清态并跳 /login?redirect=；登录后回跳原页面。

## 执行顺序（Execution Order）

1. 任务 1 → 2 → 4 与 3 并行 → 5；联调待 DU-BE-602/601 部署。

## 并行度（Parallelization）

任务 3（守卫）与任务 4（页面）可并行。

## Verification

- Unit: vitest + fake timer/axios mock：单飞断言 refresh 调用次数=1、重放 3 次；守卫重定向快照。
- Integration: N/A。
- API: 与 DU-BE-602 联调真实刷新/失败两路径。
- Migration: N/A。
- Error Case: refresh 401 清态无脏残留；redirect 仅接受同源相对路径。
