# Red → Green — DU-FE-603

## 红基线（真实失败，非假设）

1. **表单夹具对象展开顺序覆盖**：首跑 address-form.spec 1 例失败——toFormValues 用例的夹具
   先写 `postalCode: null` 再 `...valid`（valid.postalCode='310000'），展开覆盖了 null，
   断言期望空串实际收到 '310000'。调换顺序（先 `...valid` 后显式 postalCode:null）后转绿，
   产品代码本就正确。
2. **vue-tsc TS2345 mock 实现返回类型**：stores/address.spec 的 setDefault mockImplementation
   内只做乐观态断言、async 函数隐式返回 Promise<void>，与 addressApi.setDefault 的
   Promise<ShippingAddressView> 签名不兼容。mock 内补 return view('2', true)（store 不读返回值）
   后 type-check 通过；产品代码无改动。

以上均为测试夹具/桩类型问题，无产品行为缺陷。

## 绿灯

| 门禁 | 命令 | 结果 | 日志 |
| --- | --- | --- | --- |
| 单元测试 | `pnpm test` | 12 文件 **58/58** passed（基线 37 + 新增 21） | logs/fe-test-run2.log（红绿过程见 run1） |
| 类型检查 | `pnpm type-check` | vue-tsc 双 tsconfig 0 错误 | logs/fe-typecheck-run1.log |
| Lint | `pnpm lint` | **0 errors**，133 warnings（全为已降级样式规则；基线 92 + 新页 41） | logs/fe-lint-run1.log |
| 构建 | `pnpm build` | 成功，AddressListView 路由级分包 10.19 kB/gzip 3.33 kB | logs/fe-build-run1.log |

构建输出的 `[INEFFECTIVE_DYNAMIC_IMPORT]` 提示为 DU-FE-601 已记录的既有模式
（refresh-coordinator 动态 import 切断初始化循环），与本 DU 无关，接受。

## TC → 测试映射（TC-011 前端面；AC-019~024 标注联调，浏览器链路归 M3 Test）

| 关注点 | 覆盖测试/落点 | 结果 |
| --- | --- | --- |
| 列表/默认徽标/空态、顺序与后端一致 | api spec「list 解包 items/defaultId」；store spec「fetch 缓存/force、增改删后强拉」；AddressListView 直接渲染后端顺序 + 默认徽标/空态（type-check+build 锁定） | passed（渲染点击归联调） |
| 新增/编辑/校验、400/409 不关弹层 | address-form.spec 9 例字段矩阵；store spec「409 新增失败不重拉不污染」；api spec「create POST 体/update PUT /{id}」；弹层 catch resolveErrorMessage 不关层 | passed |
| 删除二次确认 | AddressListView window.confirm + removeAddress；store spec「remove 成功强拉」 | passed（confirm 交互归联调） |
| 设默认即时置顶/409 回滚重拉 | store spec「乐观置顶（请求等待期本地已改标置顶）+成功强拉」「409 回滚快照重拉再抛出」；api spec「PUT /{id}/default」 | passed |
| 越权 404 不改变数据 | 所有写动作 catch 路径不改 store（store 仅在成功响应后落状态）；resolveErrorMessage 透传 404 文案 | passed（真实 404 归联调） |
| 20 条上限 | address-form.spec「ADDRESS_LIMIT=20」；store spec「reachLimit 409 不污染」；视图 reachLimit 零请求切换提示 | passed |

## AC 覆盖

| AC | 证据 |
| --- | --- |
| AC-019（前端面，联调） | store spec「addAddress 成功强拉」；视图新增成功关弹层 + 列表以服务端视图渲染（首条默认徽标由后端 isDefault 决定） |
| AC-020（前端面，联调） | store 写后统一 fetchList(true)、本地不排序；视图直接 v-for store.items |
| AC-021（前端面，联调） | store 仅在成功响应后落状态；失败动作后 items 不变，视图页面红字 toast；真实越权 404 在 M3 Test 双会员链路复验 |
| AC-022（前端面，联调） | store spec 乐观置顶 + 409 回滚重拉两例；api spec PUT /{id}/default；视图 makeDefault catch 透传文案 |
| AC-023（前端面，联调） | store spec「remove 成功强拉（空列表）」；默认删除后端不重选，强拉后无徽标/空态由后端 items/defaultId 决定 |
| AC-024（前端面，联调） | address-form.spec 行内校验矩阵；视图字段级红字 + 弹层不关；reachLimit 上限提示；409 B0202 文案透传 |
| AC-025 | 四检全绿：vitest 58/58、type-check 0 错误、lint 0 errors、build 成功路由分包 |

## 联调边界

真实浏览器「登录→收货地址→新增（首条默认徽标）→编辑→设默认即时置顶→删除确认→
越权 404→20 条上限 409→并发设默认 409」两进程链路（网关 8080/member 8102，
并发场景 MySQL 真实生成列）不在本 DU 自动化范围，归 M3 Test 五集成场景；
本 DU 以 vi.mock 与逻辑切片锁定全部前端合同行为，页面 data-testid 已为联调预埋。
