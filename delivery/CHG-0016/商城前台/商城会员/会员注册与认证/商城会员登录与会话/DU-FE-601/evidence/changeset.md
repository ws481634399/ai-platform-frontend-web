# Changeset — DU-FE-601（mall-web 会员登录态）

基线：83fbc90153647ccbf24cbb56a525c7e1cdd4265e → 结果：97b83107636fbf9051140d591f6addcb86aad0db

## 修改文件（5）

| 文件 | 变更 |
| --- | --- |
| mall-web/package.json | 加 `test` 脚本与 devDependency vitest ^4.0.8 |
| mall-web/pnpm-lock.yaml | 锁文件同步（pnpm install --no-frozen-lockfile） |
| mall-web/src/api/http.ts | 重写：Bearer/X-Trace-Id 请求注入；401 单飞 refresh+重放；认证端点豁免；_retry 防循环 |
| mall-web/src/router/index.ts | 注册 /login、/register 路由；beforeEach 会员守卫（restore→accessPolicy） |
| mall-web/src/layouts/MallLayout.vue | 头部用户区：游客登录/注册入口、会员号+退出 |

## 新增文件（16）

| 文件 | 职责 |
| --- | --- |
| mall-web/src/api/auth.ts | register/login/refresh/logout 四端点（refresh/logout withCredentials，UnifyResult unwrap） |
| mall-web/src/api/http.spec.ts | 6 例：并发 3×401 单飞重放、refresh 失败清会话、防循环、login 豁免、403 不动、头注入 |
| mall-web/src/auth/clear-session.ts | 集中清态 + 跳 /login?redirect= |
| mall-web/src/auth/clear-session.spec.ts | 2 例：清态跳转 query、已在登录页不重复跳 |
| mall-web/src/router/access-policy.ts | 纯函数访问策略 + safeRedirect 同源相对白名单 |
| mall-web/src/router/access-policy.spec.ts | 5 例：会员重定向/放行/游客页已登录回首页 + 开放重定向变体 |
| mall-web/src/stores/member.ts | 会员 store：access/memberId 内存态、login/refresh/logout/restore(单次)/clear |
| mall-web/src/stores/member.spec.ts | 3 例：登录落态与失败安全、restore 单次、logout 失败仍清态 |
| mall-web/src/types/auth.ts | MemberCredentialRequest/MemberTokenPair/MemberRegisterResult（memberId: string） |
| mall-web/src/utils/http-error.ts | axios 错误透传 UnifyResult.message，fallback 兜底 |
| mall-web/src/utils/member-form.ts | 用户名/密码规则（对齐后端域规则）+ trim 归一 |
| mall-web/src/utils/member-form.spec.ts | 4 例：合规/用户名矩阵/密码矩阵/归一 |
| mall-web/src/utils/refresh-coordinator.ts | 单飞协调器（inflight Promise 共享、失败清会话、finally 复位） |
| mall-web/src/utils/refresh-coordinator.spec.ts | 2 例：并发一次、失败复位 |
| mall-web/src/views/auth/LoginView.vue | 登录页：规则预检、错误透传、safeRedirect 回跳、注册入口 |
| mall-web/src/views/auth/RegisterView.vue | 注册页：规则预检、成功跳登录预填、409 文案透传、登录入口 |

合计 21 文件（5 修改 + 16 新增）。
