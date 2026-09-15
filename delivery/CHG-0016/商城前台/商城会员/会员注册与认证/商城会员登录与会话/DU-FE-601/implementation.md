# DU Implementation — DU-FE-601

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

mall-web 会员登录态基础设施 + 登录/注册页（STORY-003-01-01-02 repo-2 部分），对接 DU-BE-602
已交付的 `/api/auth/member/{register,login,refresh,logout}` 契约（commit 97b8310）：

1. **HTTP 层**（任务 1/2）：
   - `src/api/http.ts`：请求拦截器注入 `Authorization: Bearer <accessToken>` 与
     `X-Trace-Id`（crypto.randomUUID）；响应拦截器对业务请求 401 走单飞 refresh 后重放原请求，
     `/login`、`/refresh` 端点自身 401 不触发刷新（`_retry` 防循环）。
   - `src/utils/refresh-coordinator.ts`：移植 mall-admin 单飞模式（模块级 inflight Promise，
     并发共享、finally 复位、失败时动态 import 执行唯一一次 clearSession）。
   - `src/api/auth.ts`：register/login/refresh/logout 四端点；refresh/logout 带
     `withCredentials`（后端双发 HttpOnly refresh_token cookie）；UnifyResult unwrap。
2. **会话状态**（任务 1）：`src/stores/member.ts`——accessToken 内存态、memberId 字符串雪花 ID、
   login/refresh/logout/clear、restore 整轮生命周期只试一次（成功恢复、失败保持游客态）；
   `src/auth/clear-session.ts` 集中清态并跳 `/login?redirect=原路径`。
3. **路由与页面**（任务 3/4）：
   - `src/router/access-policy.ts` 纯函数策略：游客页（/login、/register）已登录回首页；
     requiresMember 未登录带 redirect 跳登录；`safeRedirect` 仅放行同源相对路径
     （拒绝 `//host`、`/\host`、绝对 URL，防开放重定向）。
   - `src/router/index.ts` 注册 /login、/register 路由与 beforeEach 守卫（先 restore 再决策）。
   - `src/views/auth/LoginView.vue`：本地规则预检→登录→safeRedirect 回跳；错误文案透传
     UnifyResult.message（resolveErrorMessage）。
   - `src/views/auth/RegisterView.vue`：同套规则，成功跳 /login 并 query.username 预填；
     409「用户名已存在」等后端文案直接透传。
   - `src/utils/member-form.ts`：规则与后端 MemberUsername
     （`[A-Za-z][A-Za-z0-9_]{3,19}`）/ MemberPasswordPolicy（8-32 位含字母+数字）一致。
   - `src/layouts/MallLayout.vue` 用户区：游客显示登录/注册入口；会员显示 `会员 #<memberId>`
     与退出按钮（logout 后停留首页）。
4. **测试**（任务 5）：vitest 6 文件 22 例（本次新增 devDependency vitest@^4.0.8，
   pnpm-lock 同步）；vue-tsc 双 tsconfig 0 错误；eslint 0 errors（56 warnings 全为
   已降 warn 的 Prettier 样式重叠规则）；vite build 成功。

详细文件清单见 evidence/changeset.md，红/绿证据见 evidence/red-green.md。

## Commits

| Commit | 任务 | 说明 |
|---|---|---|
| 97b83107636fbf9051140d591f6addcb86aad0db | 任务1~5 | feat(web): 会员登录态基础设施与登录/注册页（5 修改 + 16 新增，vitest 22 例） |
| docs 提交 | 任务5 | docs(sdd): DU-FE-601 implementation/evidence（四检日志，不自引用 hash） |

完整短 hash/消息对照见 evidence/commits.md。

## Deviations

### DEV-1 存储策略澄清：refresh token 不落 localStorage，仅依赖 HttpOnly cookie；access 仅内存
- 原 DU 建议: task-design.md §3「access 内存/refresh 存储策略与 mall-admin 先例一致」措辞含混；
  requirement-design §3.1 关键组件行写「member store（access/refresh localStorage）」，
  但 §4 契约与 §8 待澄清项明确「dev 阶段对齐 admin 实际实现」。
- 实际实现: mall-admin 实际实现是 access 内存 + refresh 经 HttpOnly cookie（authApi.refresh
  带 withCredentials，store 不持久化任何 token）。mall-web 对齐该实际实现：store 只持有
  accessToken/memberId 内存态，刷新页面靠 restore() 调 /refresh（cookie）恢复，不写 localStorage。
- 原因: requirement-design §8 已给出冲突时的裁决规则（对齐 admin 实际实现）；cookie 方案
  XSS 面更小，且后端 DU-BE-602 已双发 cookie 与 body，前端直接走 cookie 轨道。
- 影响评估: 行为与 mall-admin 完全同构，TC-009「刷新页面 restore」由 member.spec
  restore 两例覆盖；真实浏览器刷新恢复留 M3 Test 集成场景观察。

### DEV-2 注册页归属：注册 Story 无 FE TC，按 story-design §1 将 RegisterView 并入本 DU
- 原 DU 建议: task-spec 任务4 已含 RegisterView，但 story test-design 的 TC 仅 TC-009/010 两条。
- 实际实现: 注册页与登录页同次交付（共用 member-form/http-error 与样式），注册成功跳登录预填；
  注册功能正确性的独立验证仍在后端 TC-001~009（DU-BE-601），本 DU 不为其虚增前端 TC。
- 原因: 登录页依赖注册入口闭环（相互链接），拆两个 DU 会造成中间状态链接悬空。
- 影响评估: 无范围蔓延；资料页/地址页明确不在本 DU，后续 DU-FE-602/603 交付。

## 自检

- [x] `pnpm type-check`：vue-tsc 双 tsconfig **0 错误**（一次通过，日志 fe-typecheck-run1.log）。
- [x] `pnpm lint`：**0 errors**（56 warnings 均为配置中已降级的样式规则，非本次可避免）。
- [x] `pnpm test`：vitest **6 文件 / 22 例全绿**（首跑 2 例失败，修测试断言后转绿，见 red-green.md）。
- [x] `pnpm build`：vite build 成功（LoginView/RegisterView/clear-session 等均按路由分包）。
- [x] AC-014：刷新恢复（store restore 成功/失败/单次三例）；并发 3 个 401 → refresh 调用
      次数=1、三请求各重放一次且均 200（http.spec TC-009）。
- [x] AC-015：refresh 失败 → 等待者全拒绝 + clearSession 仅一次（http.spec）；
      清态跳 `/login?redirect=原路径`（clear-session.spec）；登录后 safeRedirect 回跳、
      开放重定向变体拒绝（access-policy.spec 5 例）。
- [x] 边界克制：未实现资料/地址页与任何 /api/mall/** 业务调用；accessPolicy 纯函数无 vue 依赖；
      未引入 UI 组件库（原生表单，与 mall-web M0 基线一致）。
- [x] 依赖 DU-BE-602：端点路径、请求/响应字段（memberId 字符串）、cookie 路径均按其已交付
      契约实现；真实两进程浏览器联调留 M3 Test 五集成场景。
