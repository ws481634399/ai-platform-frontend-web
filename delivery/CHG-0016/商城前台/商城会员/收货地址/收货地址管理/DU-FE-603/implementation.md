# DU Implementation — DU-FE-603

> DU 级实施记录（Actual Implementation，sdd-dev 绑定本 DU 产出）。实施正文归属本仓库。
> 本文件固定为 Actual Implementation（实际修改模块/文件、Commit、Task/DU Mapping、实现偏离、完成情况），
> 与 task-design.md / task-spec.md（Expected Implementation）分立，不得合并。

## 变更内容

mall-web 收货地址管理页（CHG-0016 STORY-003-01-03-01），全部在 repo-2 mall-web，
后端端点由 DU-BE-604 提供（基址 `/api/mall/shipping-addresses`，member 8102 经网关 8080）。

1. **类型与 API 层**：
   - `src/types/address.ts`：ShippingAddressView（**id 字符串雪花 ID、无 memberId**，
     postalCode/时间戳 ISO 字符串）、AddressUpsertRequest（postalCode 空归一 null）、
     AddressListResponse{items,defaultId:string|null}、DefaultAddressResponse{item|null}。
   - `src/api/address.ts`：addressApi.list/create/update/remove/setDefault/getDefault 六方法，
     复用 `@/api/http`（Bearer 注入与 401 单飞重放自动覆盖）；路径以 story-design §2 为准——
     设默认 `PUT /{id}/default`（DEV-3）；remove 走 204 不解包。
2. **独立 pinia store `src/stores/address.ts`**（DEV-4，不挂 member store）：
   items/defaultId/loading/loaded 内存态 + hasDefault/reachLimit 计算；
   fetchList（loaded 缓存，force 强拉，进入页面挂载即强拉防跨账号脏数据）；
   add/update/remove 成功后**统一强拉**（首条默认、排序、默认标记全信后端，本地不拼结果）；
   setDefault **乐观更新**：本地即时改标并置顶 → 请求 → 成功强拉；
   失败回滚快照、强制重拉后再抛出（视图 toast），对应 AC-022 并发 409；reset 清缓存。
3. **表单规则 `src/utils/address-form.ts`**（与 DU-BE-604 聚合同界）：收货人 trim 后 1–32；
   手机 `^1[3-9]\d{9}$`；省/市/区 1–64；**详址 1–128（DEV-2）**；邮编空合法/非空 6 位数字；
   ADDRESS_LIMIT=20 与 B0202 同值。buildAddressRequest 全 trim + 邮编空串归一 null；
   toFormValues 回填编辑（postalCode null→空串）。前置校验仅为体验，安全边界在后端。
4. **页面 `src/views/member/AddressListView.vue`**（路由 `/member/addresses`，requiresMember）：
   - 挂载强拉列表；加载中/加载失败/空态（含新增 CTA）三态；列表顺序直接渲染后端顺序
     （is_default DESC, updated_at DESC），默认地址蓝色描边卡片 + 「默认」徽标；
   - 头部「新增地址」按钮，达 20 条切换为上限提示（reachLimit 零请求拦截，409 仍以后端为准）；
   - 新增/编辑复用同一弹层：编辑 toFormValues 回填；提交先前端行内校验，
     失败字段红字且**弹层不关、内容不丢**；成功关弹层 + 页面成功提示；
     400/409 经 resolveErrorMessage 透传后端中文文案（如「最多保存20条收货地址」）；
   - 删除走 window.confirm 二次确认；非默认地址显示「设为默认」，调用乐观 setDefault；
   - 全部交互点带 data-testid（address-new-button/address-list/address-item-{id}/
     address-default-badge/address-set-default-{id}/address-edit-{id}/address-delete-{id}/
     address-dialog*/address-form-* 等）供浏览器联调定位。
5. **路由与布局**：router 在 MallLayout 子路由挂 member-addresses（requiresMember:true，
   未登录由 DU-FE-601 守卫带 redirect 跳登录）；MallLayout 登录态增「收货地址」入口。
6. **测试（新增 21 例，vitest 58/58；无新增依赖、无 lockfile 变更）**：
   - `api/address.spec.ts` 6 例：list 解包 items/defaultId、create POST 体与解包、
     update PUT /{id}、remove DELETE（204 不解包）、**setDefault PUT /{id}/default**、
     getDefault item=null；
   - `utils/address-form.spec.ts` 9 例：合法全过/邮编空合法、收货人空白与 32/33 边界、
     手机空/错号段/短号、省市区空白与 64/65、详址空白与 **128/129**、邮编 5 位/含字母、
     build trim+邮编归一 null、toFormValues null→空串、ADDRESS_LIMIT=20；
   - `stores/address.spec.ts` 6 例：fetch 缓存与 force、增改删成功均强拉、
     409 新增失败不重拉不污染、setDefault 乐观置顶（请求等待中断言本地态）+成功重拉、
     409 失败回滚快照重拉再抛出、reset 清缓存。

详细文件清单见 evidence/changeset.md，红/绿与 TC/AC 映射见 evidence/red-green.md。

## Commits

| Commit | 说明 |
|---|---|
| 6a10cdd2de3d5b317bdc1022cad8382e2e4b70b5 | feat(mall-web): 收货地址管理页（列表/默认徽标/新增编辑弹层/删除确认/乐观设默认，DU-FE-603 全部代码与测试，10 文件 21 例） |

## Deviations

<!-- 实现与 DU 建议（Sketch / Pseudocode）明显偏离时必须记录；无偏离写「无」。 -->

### DEV-1 「vitest 全流程组件测试」落为逻辑切片 vitest，不引入 DOM 挂载栈

- 原 DU 建议: task-spec 任务 4 写「vitest 全流程组件测试（mock api 成功/400/404/409）」。
- 实际实现: 未新增 @vue/test-utils/happy-dom 依赖；合同行为下沉 api/utils/store 三切片共 21 例
  （成功/400/404/409/乐观回滚重拉均在 store 与 api spec 锁定），SFC 仅做交互编排。
- 原因: DU-FE-601/602 已确立 mall-web 测试惯例——既有 9 个 spec 全部纯逻辑层（node 环境），
  视图不挂载；frozen-lockfile 下为单页引入 DOM 测试栈需更新锁文件，收益不抵面扩张。
- 影响评估: 端点契约、字段校验矩阵、乐观/回滚/重拉、上限拦截均有自动化断言；
  真实点击/弹层/confirm/两进程链路按 test-design 归 M3 Test 浏览器集成场景（AC-019~024 联调）；
  SFC 可编译性与模板类型由 vue-tsc 双 tsconfig + vite build 兜底，data-testid 已预埋。

### DEV-2 详细地址上限取 SSOT 128，弃用 task-design 的 200

- 原 DU 建议: task-design 表单约束写「详细地址 ≤200 字」。
- 实际实现: 常量 DETAIL_MAX_LENGTH=128、输入 maxlength=128、校验提示 128 三处统一。
- 原因: story-spec/story-design 与 DU-BE-604 后端 ShippingAddress.DETAIL_MAX 均为 128
  （后端 task-design 同笔误，DU-BE-604 DEV-2 已按 SSOT 落地）；前后端必须同界，否则
  129–200 字输入前端放行、后端 400，体验与契约都错。
- 影响评估: 与真实后端 Bean Validation 一致；边界 128/129 有自动化断言。

### DEV-3 设默认端点用 PUT /{id}/default（非 POST /set-default）

- 原 DU 建议: 部分早期文档表述为 POST /set-default 风格动作路径。
- 实际实现: addressApi.setDefault 调 `PUT /api/mall/shipping-addresses/{id}/default`。
- 原因: story-design §2 / requirement-design §4 与 DU-BE-604 实际控制器
  （ShippingAddressController，DEV-3）均为此路径；以前端对齐后端实现与 story SSOT 为准。
- 影响评估: 路径有 api spec 单例锁定，联调不会错路由；网关 MEMBER 规则 DU-BE-602 已预置。

### DEV-4 独立 address store；写后强拉、仅设默认做乐观；弹层不单拆组件

- 原 DU 建议: task-design 提及 AddressView + AddressForm 组件划分，未明确状态归属。
- 实际实现: 新建 pinia `member-address` store 承载列表态与全部远程动作；
  新增/编辑/删除成功后一律 fetchList(true) 强拉，仅 setDefault 做本地乐观更新+失败回滚重拉；
  弹层以同 SFC 内 mask+form 实现，未拆 AddressForm 子组件。
- 原因: 地址列表生命周期独立于资料缓存，挂 member store 会让 clear/跨账号语义耦合；
  排序与默认标记由后端 `is_default DESC, updated_at DESC` 决定，本地拼写结果易与服务端漂移，
  强拉最简且正确；设默认是唯一有「即时置顶」体验要求（AC-022）的动作，值得乐观化；
  弹层仅本页使用、无复用需求，单 SFC 内聚且 data-testid 齐全，拆组件增加 props/emit 面无收益。
- 影响评估: store spec 对强拉次数、乐观时点、回滚结果均有断言；
  弹层打开/回填/不关层行为经 type-check+build 编译保证，点击交互归 M3 Test。

## 自检

- [x] 单元测试：`pnpm test` → 12 文件 **58/58**（基线 37 + 本 DU 21），日志 evidence/logs/fe-test-run2.log（run1 为夹具展开顺序修正前的红绿记录）。
- [x] 类型检查：`pnpm type-check` → vue-tsc 双 tsconfig 0 错误，日志 fe-typecheck-run1.log。
- [x] Lint：`pnpm lint` → **0 errors** / 133 warnings（均为既有降级样式规则，基线 92 + 新页 41），日志 fe-lint-run1.log。
- [x] 构建：`pnpm build` → 成功，AddressListView 路由级分包（10.19 kB / gzip 3.33 kB），日志 fe-build-run1.log。
- [x] 契约对齐：地址视图无 memberId、id 字符串；POST 新增 / PUT /{id} / DELETE /{id} / **PUT /{id}/default** /
      GET /default{item|null}；邮编空串归一 null；错误文案经 resolveErrorMessage 透传 400/404/409 中文。
- [x] 安全/体验：20 条上限前端零请求拦截、后端 B0202 兜底；字段校验与后端同界（详址 128）；
      /member/addresses 挂 requiresMember，未登录经 DU-FE-601 守卫带 redirect 跳登录。
- [x] 无新增运行时/开发依赖（未改 package.json 与 lockfile）。
