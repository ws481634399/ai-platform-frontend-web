# Red → Green — DU-FE-602

## 红基线（真实失败，非假设）

1. **邮箱边界夹具长度误算**：首跑 `profile-form.spec` 1 例失败——`'a'.repeat(124)+'@b.cn'`
   总长 129（>128），却放在「合法」断言（expected undefined，actual「邮箱格式不正确」）。
   与 DU-BE-603 后端同型陷阱：合法边界应为 local 123 + '@b.cn' 5 = **128**，124+5=129 非法。
   改夹具后转绿（产品代码本就正确）。
2. **vue-tsc TS6133**：ProfileView 初版声明了 `avatarInput` 模板 ref 但脚本未读（change 事件
   target 已够用），`noUnusedLocals` 报错。删除该 ref 与模板绑定后通过。
3. **eslint 4 errors `no-undef`**：`URL`/`Event`/`HTMLInputElement` 在 SFC `<script lang="ts">`
   虚拟文件被判未定义（.ts 文件因 typescript-eslint 配套不触发）。按 typescript-eslint 官方
   建议对 `**/*.vue` 关闭 no-undef（DEV-2），vue-tsc 承担符号检查，0 errors。

以上均为测试夹具/视图样板/工程配置问题，无产品行为缺陷。

## 绿灯

| 门禁 | 命令 | 结果 | 日志 |
| --- | --- | --- | --- |
| 单元测试 | `pnpm test` | 9 文件 **37/37** passed（基线 22 + 新增 15） | logs/fe-test-run1.log |
| 类型检查 | `pnpm type-check` | vue-tsc 双 tsconfig 0 错误 | logs/fe-typecheck-run1.log |
| Lint | `pnpm lint` | **0 errors**，92 warnings（全为已降级样式规则；基线 56 + 新页 36） | logs/fe-lint-run1.log |
| 构建 | `pnpm build` | 成功，ProfileView 路由级分包 6.00 kB/gzip 2.43 kB | logs/fe-build-run1.log |

构建输出的 `[INEFFECTIVE_DYNAMIC_IMPORT]` 提示为 DU-FE-601 已记录的既有模式
（refresh-coordinator 动态 import 切断初始化循环），与本 DU 无关，接受。

## TC → 测试映射（test-design.md TC-006 前端部分）

| TC | 覆盖测试/落点 | 结果 |
| --- | --- | --- |
| TC-006 ProfileView 表单改/存、头像预览上传成功/失败提示；build/lint/type-check | 表单校验：`profile-form.spec` 8 例（昵称 1–32、手机/邮箱清空与非法、性别、头像类型/2MB）；接口契约：`api/member.spec` 3 例（GET 字符串 ID、PUT 变更体、FormData part=file）；状态编排：`stores/profile.spec` 4 例（拉取回填缓存、保存成功替换/400 失败不污染、上传成功刷新 avatarUrl/503 失败保留旧头像、clear）；视图：ProfileView.vue（字段错误、成功/失败双色提示、预览 revoke、data-testid）经 type-check + build 锁定 | passed（逻辑切片自动化；点击链路归 M3 Test 浏览器集成，DEV-1） |

## AC 覆盖

| AC | 证据 |
| --- | --- |
| AC-016（前端面） | api/member.spec「GET 解包字符串 memberId/null 字段」；profile.spec「fetchProfile 缓存、memberId 仅来自视图」；页面用户名只读、无任何入参 ID |
| AC-017（前端面） | profile-form.spec 校验矩阵与后端同界；profile.spec「保存成功替换/失败不污染缓存」；ProfileView 字段级错误 + diff 仅提交变更字段 |
| AC-018（前端面） | profile-form.spec「伪装 gif/超 2MB 拦截」；api/member.spec「multipart part=file」；profile.spec「上传成功同步/503 失败保留旧 URL」；resolveErrorMessage 透传后端 400/503 中文文案 |
| AC-025 | 四检全绿：vitest 37/37、type-check 0 错误、lint 0 errors、build 成功路由分包 |

## 联调边界

真实浏览器「登录→个人中心→改资料保存→选头像预览→上传成功/9000 不通 503」两进程链路
（网关 8080/member 8102/MinIO 9000）不在本 DU 自动化范围，归 M3 Test 五集成场景；
本 DU 以 vi.mock 与逻辑切片锁定全部前端合同行为，页面 data-testid 已为联调预埋。
