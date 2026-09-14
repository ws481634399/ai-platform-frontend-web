# DU Task Design — DU-FE-601

> 层级：实现仓（Repository）侧产物——Expected Implementation 之"怎么做"（DU 技术方案）。
> 权威 DU 划分：外部 story-design.md §5（SSOT）。

## 1. Goal

mall-web 会员登录态基础设施（auth store、token 存储、单飞 refresh-coordinator、路由守卫与 redirect 回跳）+ 登录页 + 注册页。

## 2. Repository

repo-2（ai-platform-frontend / mall-web 应用）

## 3. Scope

- mall-web/src/api：auth.ts（register/login/refresh/logout 类型与调用）；http.ts 拦截器接入（请求挂 Authorization；401 → coordinator 单飞 refresh → 重放原请求；refresh 也 401 → 清态跳 /login?redirect=）。
- stores/auth.ts：member/tokens 状态、localStorage 持久化（access 内存/refresh 存储策略与 mall-admin 先例一致）、restore、clear。
- router：requiresGuest/requiresMember 守卫，redirect query 保留与回跳。
- views/auth/LoginView.vue、RegisterView.vue：表单校验规则与后端一致（用户名 4-20 字母开头；密码 ≥8 非纯数字）、错误文案透传、注册成功跳登录。
- 移植 mall-admin refresh-coordinator 单飞模式（Promise 共享）。

## 4. Design References

- CHG-0016 requirement-design.md §3.1（前端认证架构，移植 mall-admin 协调器）、§4（端点）；STORY-003-01-01-02 story-design.md §1 repo-2 段。
- 代码先例：mall-admin/src/api 内 refresh-coordinator、http 拦截器。

## 5. Dependencies

DU-BE-602（登录/刷新契约）。实际联调另依赖 DU-BE-601（注册端点）与 DU-BE-501（字符串 ID 透传）。

## 6. Implementation Sketch

- 单飞刷新：模块级 inflight Promise<boolean>；并发 3 个 401 时仅首次调 /refresh，其余 await 同一 Promise 后重放；刷新期间新请求排队。
- 会话恢复：应用启动读持久化 token → 试 restore（access 未过期直接可用；过期则尝试一次 refresh）→ 失败保持游客态。
- 守卫：requiresMember 未登录 → /login?redirect=原 path+query；登录成功回跳（仅同源相对路径，防开放重定向）；requiresGuest 已登录访问 /login → 首页。
- 注册页独立（注册 story 无 FE TC，归属本 DU scope，交付随登录页一并完成）。
- 退出：调 logout → clear → 跳首页。

## 7. Pseudocode

N/A（metadata `pseudocode: false`）。协调器为成熟单飞模式移植；守卫为直线重定向逻辑。
