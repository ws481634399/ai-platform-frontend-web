# Red → Green — DU-FE-601

## 红基线（真实失败，非假设）

1. **pnpm frozen-lockfile 拒绝安装**：加 vitest 后首次 `pnpm install` 报
   `ERR_PNPM_OUTDATED_LOCKFILE`（环境默认 frozen）。改用 `pnpm install --no-frozen-lockfile`
   更新锁文件后安装成功。属工程配置真实红灯。
2. **vitest 首跑 2 例失败**（`Test Files 2 failed | 3 passed，Tests 2 failed | 18 passed`）：
   - `http.spec > TC-010 refresh 也失败`：断言「清态后 accessToken 为 undefined」，但该用例中
     clearSession 是 vi.fn() 空 mock，本不负责清 store——断言放错了层。改为仅断言
     clearSession 被调用恰好一次，真实清态行为移交 clear-session.spec 覆盖。
   - `stores/member.spec > logout 失败路径`：store.logout 按 mall-admin 惯例 `try/finally`
     清理后**向上重抛**，测试未接 rejection 导致用例失败。修正为
     `rejects.toThrow('network down')` 并保留「仍已清态」断言（文档化该惯例）。
3. **clear-session.spec 初版 pinia 实例错位**：setActivePinia(createPinia()) 造的活动实例与
   clearSession 内部硬引用的共享 `@/stores` pinia 不是同一实例，`member.isAuthenticated`
   仍为 true。改为在共享 pinia 上取 store 并 beforeEach clear()。

以上均为测试代码问题（产品代码行为本就正确），第三处为测试夹具修正。

## 绿灯

| 门禁 | 命令 | 结果 | 日志 |
| --- | --- | --- | --- |
| 单元测试 | `pnpm test` | 6 文件 **22/22** passed | logs/fe-test-run1.log |
| 类型检查 | `pnpm type-check` | vue-tsc 双 tsconfig 0 错误（一次通过） | logs/fe-typecheck-run1.log |
| Lint | `pnpm lint` | **0 errors**，56 warnings（全为已降级样式规则） | logs/fe-lint-run1.log |
| 构建 | `pnpm build` | 成功，路由级分包（837ms/165ms） | logs/fe-build-run1.log |

构建输出含 `[INEFFECTIVE_DYNAMIC_IMPORT]` 提示：refresh-coordinator 动态 import @/router
与 main.ts 静态引用共存——这是从 mall-admin 原样移植的模式（动态 import 的目的是切断
http→router 初始化循环而非分包），admin 构建同提示，接受。

## TC → 测试映射（test-design.md TC-009/010）

| TC | 覆盖测试 |
| --- | --- |
| TC-009 刷新页面 restore；并发 3 个 401 仅一次 refresh 且全部重放 | member.spec「restore 仅尝试一次/失败保持游客态」；http.spec「TC-009 并发 3 个 401…」；coordinator.spec「并发共享同一个 Promise」；http.spec「请求拦截器注入…」 |
| TC-010 refresh 失败清态跳 /login?redirect=；登录后回跳 | http.spec「TC-010 refresh 也失败…」；clear-session.spec 2 例；access-policy.spec 5 例（含 safeRedirect 防开放重定向） |

## AC 覆盖

| AC | 证据 |
| --- | --- |
| AC-014 | restore 三例 + 并发单飞重放 + coordinator 两例 + 注入头断言 |
| AC-015 | refresh 失败集中清理一次 + clearSession 跳转 + 守卫 redirect 矩阵 + safeRedirect |

## 联调边界

真实浏览器「登录→刷新页恢复→过期自动刷新→退出」两进程链路（网关 8080/identity 8101）
不在本 DU 自动化范围，归 M3 Test 五集成场景；本 DU 以 axios adapter 与 vi.mock 在切片层
锁定全部合同行为。
